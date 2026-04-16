from __future__ import annotations

from sqlalchemy.orm import Session

from .core.settings import get_settings
from .models import Asset, Config, User
from .repositories import AssetRepository, ConfigRepository, UserRepository
from .security import hash_password

DEFAULT_RULES = {
    "temperature": {"min": 20.0, "max": 26.0, "unit": "C"},
    "humidity": {"min": 40.0, "max": 60.0, "unit": "%"},
    "light": {"min": 30.0, "max": 80.0, "unit": "%"},
    "voltage": {"min": 3.0, "max": 3.6, "unit": "V"},
}


def default_rules_copy() -> dict[str, dict[str, float | str]]:
    return {
        metric_key: dict(metric_rules)
        for metric_key, metric_rules in DEFAULT_RULES.items()
    }


def seed_default_data(session: Session) -> None:
    settings = get_settings()
    user_repo = UserRepository(session)
    config_repo = ConfigRepository(session)
    asset_repo = AssetRepository(session)

    user = user_repo.get_first()
    if user is None:
        user = User(username=settings.seed_username, password_hash=hash_password(settings.seed_password))
        session.add(user)
        session.flush()

    config = config_repo.get_current()
    if config is None:
        config = Config(
            user_id=user.user_id,
            overload_enabled=True,
            threshold_w=1800.0,
            automation_rules_json=default_rules_copy(),
        )
        session.add(config)
        session.flush()
    else:
        config.automation_rules_json = default_rules_copy()
        session.add(config)

    existing_assets = {asset.hw_address for asset in asset_repo.list_all()}
    defaults = [
        {
            "name": "Temperature Channel",
            "asset_type": "temperature_sensor",
            "location": "Main Node",
            "relay_channel": None,
            "hw_address": "temperature",
            "state_cached": "unknown",
            "is_active": True,
        },
        {
            "name": "Humidity Channel",
            "asset_type": "humidity_sensor",
            "location": "Main Node",
            "relay_channel": None,
            "hw_address": "humidity",
            "state_cached": "unknown",
            "is_active": True,
        },
        {
            "name": "Light Channel",
            "asset_type": "light_sensor",
            "location": "Main Node",
            "relay_channel": None,
            "hw_address": "light",
            "state_cached": "unknown",
            "is_active": True,
        },
        {
            "name": "Voltage Channel",
            "asset_type": "voltage_sensor",
            "location": "Main Node",
            "relay_channel": None,
            "hw_address": "voltage",
            "state_cached": "unknown",
            "is_active": True,
        },
    ]

    for payload in defaults:
        if payload["hw_address"] in existing_assets:
            continue
        session.add(Asset(user_id=user.user_id, **payload))

    session.commit()
