from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from ...core.config import get_settings
from ...core.database import get_db
from ...repositories import ConfigRepository, UserRepository
from ...schemas import ConfigRead, ConfigUpdate


router = APIRouter(prefix="/config", tags=["config"])


@router.get("/current", response_model=ConfigRead)
def get_current_config(db: Session = Depends(get_db)) -> ConfigRead:
    settings = get_settings()
    user = UserRepository(db).get_by_username(settings.seed_username)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Default user not found")
    config = ConfigRepository(db).get_by_user_id(user.user_id)
    if config is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Config not found")
    return ConfigRead.model_validate(config)


@router.put("/current", response_model=ConfigRead)
def update_current_config(payload: ConfigUpdate, db: Session = Depends(get_db)) -> ConfigRead:
    settings = get_settings()
    user = UserRepository(db).get_by_username(settings.seed_username)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Default user not found")
    config_repo = ConfigRepository(db)
    config = config_repo.get_by_user_id(user.user_id)
    if config is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Config not found")

    updates = payload.model_dump(exclude_unset=True)
    if "automation_rules_json" in updates and updates["automation_rules_json"] is not None:
        updates["automation_rules_json"] = {
            key: value.model_dump() if hasattr(value, "model_dump") else value
            for key, value in updates["automation_rules_json"].items()
        }

    return ConfigRead.model_validate(config_repo.update(config, **updates))
