from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...schemas import DashboardOverview


router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/overview", response_model=DashboardOverview)
def get_dashboard_overview(request: Request, db: Session = Depends(get_db)) -> DashboardOverview:
    telemetry_service = request.app.state.telemetry_service
    return telemetry_service.build_overview(db)
