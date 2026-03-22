from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...repositories import RecordRepository
from ...schemas import AlertRead
from ...services.telemetry import build_alert_read


router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/recent", response_model=list[AlertRead])
def get_recent_alerts(
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[AlertRead]:
    records = RecordRepository(db).recent_alerts(limit=limit)
    return [build_alert_read(record) for record in records]
