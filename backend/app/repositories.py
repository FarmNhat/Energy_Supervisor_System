from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import Asset, Config, Record, User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_first(self) -> User | None:
        statement = select(User).order_by(User.user_id.asc()).limit(1)
        return self.db.scalar(statement)

    def get_by_id(self, user_id: int) -> User | None:
        return self.db.get(User, user_id)

    def get_by_username(self, username: str) -> User | None:
        statement = select(User).where(User.username == username)
        return self.db.scalar(statement)

    def create(self, username: str, password_hash: str) -> User:
        user = User(username=username, password_hash=password_hash)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user


class ConfigRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_current(self) -> Config | None:
        statement = select(Config).order_by(Config.updated_at.desc(), Config.config_id.desc()).limit(1)
        return self.db.scalar(statement)

    def get_by_user_id(self, user_id: int) -> Config | None:
        statement = select(Config).where(Config.user_id == user_id)
        return self.db.scalar(statement)

    def create(self, user_id: int, overload_enabled: bool, threshold_w: float, automation_rules_json: dict) -> Config:
        config = Config(
            user_id=user_id,
            overload_enabled=overload_enabled,
            threshold_w=threshold_w,
            automation_rules_json=automation_rules_json,
        )
        self.db.add(config)
        self.db.commit()
        self.db.refresh(config)
        return config

    def update(self, config: Config, **fields) -> Config:
        for key, value in fields.items():
            setattr(config, key, value)
        self.db.add(config)
        self.db.commit()
        self.db.refresh(config)
        return config


class AssetRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_all(self) -> list[Asset]:
        statement = select(Asset).order_by(Asset.asset_id.asc())
        return list(self.db.scalars(statement).all())

    def list_by_user(self, user_id: int) -> list[Asset]:
        statement = select(Asset).where(Asset.user_id == user_id).order_by(Asset.asset_id.asc())
        return list(self.db.scalars(statement).all())

    def get_by_id(self, asset_id: int) -> Asset | None:
        return self.db.get(Asset, asset_id)

    def get_by_type(self, user_id: int, asset_type: str) -> Asset | None:
        statement = select(Asset).where(Asset.user_id == user_id, Asset.asset_type == asset_type)
        return self.db.scalar(statement)

    def by_hw_address(self, hw_address: str) -> Asset | None:
        statement = select(Asset).where(Asset.hw_address == hw_address)
        return self.db.scalar(statement)

    def create_many(self, assets: list[Asset]) -> list[Asset]:
        self.db.add_all(assets)
        self.db.commit()
        for asset in assets:
            self.db.refresh(asset)
        return assets

    def update_state(self, asset: Asset, state_cached: str) -> Asset:
        asset.state_cached = state_cached
        self.db.add(asset)
        self.db.flush()
        self.db.refresh(asset)
        return asset


class RecordRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, record: Record | None = None, **fields) -> Record:
        if record is None:
            record = Record(**fields)
        self.db.add(record)
        self.db.flush()
        self.db.refresh(record)
        return record

    def create_many(self, records: Sequence[Record]) -> list[Record]:
        self.db.add_all(records)
        self.db.flush()
        for record in records:
            self.db.refresh(record)
        return list(records)

    def list_recent(self, record_type: str, limit: int = 24) -> list[Record]:
        statement = (
            select(Record)
            .where(Record.record_type == record_type)
            .order_by(Record.created_at.desc(), Record.record_id.desc())
            .limit(limit)
        )
        return list(self.db.scalars(statement).all())

    def recent_by_type(self, record_type: str, limit: int = 24) -> list[Record]:
        return self.list_recent(record_type, limit)

    def recent_alerts(self, limit: int = 10) -> list[Record]:
        return self.list_recent("alert", limit)

    def latest_telemetry(self, limit: int = 256) -> list[Record]:
        return self.list_recent("telemetry", limit)

    def count_by_type(self, record_type: str) -> int:
        statement = select(func.count()).select_from(Record).where(Record.record_type == record_type)
        return int(self.db.scalar(statement) or 0)

    def telemetry_count(self) -> int:
        return self.count_by_type("telemetry_sample")

    def latest_sample(self) -> Record | None:
        statement = (
            select(Record)
            .where(Record.record_type == "telemetry_sample")
            .order_by(Record.created_at.desc(), Record.record_id.desc())
            .limit(1)
        )
        return self.db.scalar(statement)
