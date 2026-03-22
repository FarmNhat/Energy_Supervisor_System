from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...schemas import RecentSample


router = APIRouter(prefix="/records", tags=["records"])


@router.get("/recent", response_model=list[RecentSample])
def get_recent_records(
    request: Request,
    limit: int = Query(24, ge=1, le=240),
    db: Session = Depends(get_db),
) -> list[RecentSample]:
    telemetry_service = request.app.state.telemetry_service
    return telemetry_service.get_recent_samples(db, limit=limit)
