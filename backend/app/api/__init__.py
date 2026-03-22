from __future__ import annotations

from datetime import timezone

from fastapi import APIRouter, Depends, FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from fastapi.responses import StreamingResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..core.settings import get_settings
from ..db import SessionLocal, get_db
from ..realtime import build_realtime_message, connection_manager
from ..repositories import UserRepository
from ..schemas import AuthRequest, AuthResponse, ConfigUpdateRequest, HealthResponse, TelemetryIngestRequest, UserRead
from ..security import hash_password, issue_access_token, verify_password
from ..services import DashboardService, TelemetryService

settings = get_settings()

router = APIRouter()
api_router = APIRouter(prefix="/api")


def serialize_user_created_at(value) -> str | None:
    if value is None:
        return None
    if getattr(value, "tzinfo", None) is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.isoformat()


@router.get("/health", response_model=HealthResponse)
def healthcheck() -> HealthResponse:
    database_state = "ok"
    try:
        with SessionLocal() as session:
            session.execute(text("SELECT 1"))
    except Exception:
        database_state = "error"

    return HealthResponse(
        status="ok",
        database=database_state,
        mqtt_enabled=not settings.disable_mqtt,
        topic=settings.mqtt_topic,
    )


@api_router.get("/dashboard/overview")
def dashboard_overview(limit: int = Query(24, ge=1, le=240), session: Session = Depends(get_db)) -> dict:
    return DashboardService.overview(session, limit=limit)


@api_router.post("/auth/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: AuthRequest, session: Session = Depends(get_db)) -> AuthResponse:
    user_repo = UserRepository(session)
    existing = user_repo.get_by_username(payload.username)
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")

    user = user_repo.create(payload.username, hash_password(payload.password))
    return AuthResponse(
        access_token=issue_access_token(user.user_id, user.username),
        user=UserRead(
            user_id=user.user_id,
            username=user.username,
            created_at=serialize_user_created_at(user.created_at),
        ),
    )


@api_router.post("/auth/login", response_model=AuthResponse)
def login_user(payload: AuthRequest, session: Session = Depends(get_db)) -> AuthResponse:
    user = UserRepository(session).get_by_username(payload.username)
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    return AuthResponse(
        access_token=issue_access_token(user.user_id, user.username),
        user=UserRead(
            user_id=user.user_id,
            username=user.username,
            created_at=serialize_user_created_at(user.created_at),
        ),
    )


@api_router.get("/records/recent")
def recent_records(limit: int = Query(24, ge=1, le=240), session: Session = Depends(get_db)) -> dict:
    return DashboardService.recent_records(session, limit=limit)


@api_router.get("/assets")
def assets(session: Session = Depends(get_db)) -> dict:
    return DashboardService.assets(session)


@api_router.get("/alerts/recent")
def recent_alerts(limit: int = Query(10, ge=1, le=100), session: Session = Depends(get_db)) -> dict:
    return DashboardService.recent_alerts(session, limit=limit)


@api_router.post("/telemetry/ingest")
def ingest_telemetry(payload: TelemetryIngestRequest, session: Session = Depends(get_db)) -> dict:
    return TelemetryService.ingest_payload(session, payload.model_dump(exclude_none=True))


@api_router.get("/reports/export")
def export_report(limit: int = Query(240, ge=1, le=5000), session: Session = Depends(get_db)) -> StreamingResponse:
    csv_payload = DashboardService.export_report_csv(session, limit=limit)
    headers = {"Content-Disposition": "attachment; filename=energy-supervisor-report.csv"}
    return StreamingResponse(iter([csv_payload]), media_type="text/csv; charset=utf-8", headers=headers)


@api_router.put("/config/current")
def update_config(payload: ConfigUpdateRequest, session: Session = Depends(get_db)) -> dict:
    return DashboardService.update_config(session, payload.model_dump(exclude_none=True))


def register_routes(app: FastAPI) -> None:
    app.include_router(router)
    app.include_router(api_router)

    @app.websocket("/ws/realtime")
    async def realtime_socket(websocket: WebSocket) -> None:
        await connection_manager.connect(websocket)
        try:
            with SessionLocal() as session:
                overview = DashboardService.overview(session, limit=10)
                await websocket.send_json(
                    build_realtime_message(
                        snapshot=overview["metrics"],
                        alerts=overview["alerts"],
                        summary=overview["summary"],
                        recent_records=overview["recent_samples"],
                    ).model_dump(mode="json")
                )
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            pass
        except Exception:
            pass
        finally:
            connection_manager.disconnect(websocket)
