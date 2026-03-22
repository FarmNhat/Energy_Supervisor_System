from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...core.config import get_settings
from ...core.database import get_db
from ...repositories import AssetRepository, UserRepository
from ...schemas import AssetRead


router = APIRouter(prefix="/assets", tags=["assets"])


@router.get("", response_model=list[AssetRead])
def list_assets(db: Session = Depends(get_db)) -> list[AssetRead]:
    settings = get_settings()
    user = UserRepository(db).get_by_username(settings.seed_username)
    if user is None:
        return []
    return [AssetRead.model_validate(asset) for asset in AssetRepository(db).list_by_user(user.user_id)]
