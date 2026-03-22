from __future__ import annotations

from fastapi import APIRouter, Depends, FastAPI, Query, WebSocket, WebSocketDisconnect
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.app.core.settings import get_settings
from backend.app.db import SessionLocal, get_db
from backend.app.realtime import build_realtime_message, connection_manager
from backend.app.schemas import ConfigUpdateRequest, HealthResponse
from backend.app.services import DashboardService

settings = get_settings()

router = APIRouter()
api_router = APIRouter(prefix="/api")


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


@api_router.get("/records/recent")
def recent_records(limit: int = Query(24, ge=1, le=240), session: Session = Depends(get_db)) -> dict:
    return DashboardService.recent_records(session, limit=limit)


@api_router.get("/assets")
def assets(session: Session = Depends(get_db)) -> dict:
    return DashboardService.assets(session)


@api_router.get("/alerts/recent")
def recent_alerts(limit: int = Query(10, ge=1, le=100), session: Session = Depends(get_db)) -> dict:
    return DashboardService.recent_alerts(session, limit=limit)


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
                        snapshot=overview["snapshot"],
                        alerts=overview["alerts"],
                        summary={
                            "config_summary": overview["config_summary"],
                            "latest_metrics": overview["latest_metrics"],
                        },
                        recent_records=overview["recent_records"],
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
