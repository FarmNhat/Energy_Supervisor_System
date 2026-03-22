from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...schemas import DashboardOverview, MetricSnapshot


router = APIRouter(prefix="/telemetry", tags=["telemetry"])


@router.post("/ingest", response_model=DashboardOverview)
def ingest_telemetry(
    payload: MetricSnapshot,
    request: Request,
    db: Session = Depends(get_db),
) -> DashboardOverview:
    telemetry_service = request.app.state.telemetry_service
    return telemetry_service.ingest_payload(db, payload.model_dump())
