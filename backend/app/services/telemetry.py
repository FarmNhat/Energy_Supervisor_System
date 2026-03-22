from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from ..core.config import Settings
from ..models import Asset, Record
from ..repositories import AssetRepository, ConfigRepository, RecordRepository, UserRepository
from ..schemas import AlertRead, DashboardOverview, MetricSnapshot, RecentSample, SummaryRead, UserRead
from .connection_manager import ConnectionManager


DEFAULT_THRESHOLD_RULES = {
    "temperature": {"min": 20.0, "max": 26.0, "unit": "°C"},
    "humidity": {"min": 40.0, "max": 60.0, "unit": "%"},
    "light": {"min": 30.0, "max": 80.0, "unit": "%"},
    "voltage": {"min": 3.0, "max": 3.6, "unit": "V"},
}

DEFAULT_ASSETS = [
    {
        "name": "Temperature Sensor",
        "asset_type": "sensor.temperature",
        "location": "Main Room",
        "relay_channel": None,
        "hw_address": "esp32:temperature",
    },
    {
        "name": "Humidity Sensor",
        "asset_type": "sensor.humidity",
        "location": "Main Room",
        "relay_channel": None,
        "hw_address": "esp32:humidity",
    },
    {
        "name": "Light Sensor",
        "asset_type": "sensor.light",
        "location": "Main Room",
        "relay_channel": None,
        "hw_address": "esp32:light",
    },
    {
        "name": "Voltage Channel",
        "asset_type": "sensor.voltage",
        "location": "Power Rail",
        "relay_channel": None,
        "hw_address": "esp32:voltage",
    },
]


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def serialize_dt(value: datetime | None) -> str | None:
    if value is None:
        return None

    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)

    return value.isoformat()


def infer_unit(metric_key: str, metric_value: float) -> str:
    if metric_key == "temperature":
        return "°F" if metric_value > 55 else "°C"
    if metric_key == "humidity":
        return "%"
    if metric_key == "light":
        return "%"
    if metric_key == "voltage":
        return "ADC" if metric_value > 20 else "V"
    return ""


def build_alert_read(record: Record) -> AlertRead:
    payload = record.payload_json or {}
    unit = record.unit or payload.get("unit")
    value = record.value if record.value is not None else payload.get("value")
    title = payload.get("title") or f"{record.key.title()} alert"
    detail = payload.get("detail") or "A threshold rule was violated."
    level = "critical" if record.status == "critical" else "warning"
    return AlertRead(
        record_id=record.record_id,
        level=level,
        title=title,
        detail=detail,
        key=record.key,
        value=value,
        unit=unit,
        created_at=record.created_at,
    )


class TelemetryService:
    def __init__(self, settings: Settings, manager: ConnectionManager, loop: asyncio.AbstractEventLoop | None = None) -> None:
        self.settings = settings
        self.manager = manager
        self.loop = loop

    def attach_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self.loop = loop

    def default_threshold_rules(self) -> dict[str, dict[str, float | str]]:
        return DEFAULT_THRESHOLD_RULES

    def ensure_default_data(self, db: Session) -> None:
        user_repo = UserRepository(db)
        config_repo = ConfigRepository(db)
        asset_repo = AssetRepository(db)
        from ..core.security import hash_password

        user = user_repo.get_by_username(self.settings.seed_username)
        if user is None:
            user = user_repo.create(
                username=self.settings.seed_username,
                password_hash=hash_password(self.settings.seed_password),
            )

        config = config_repo.get_by_user_id(user.user_id)
        if config is None:
            config_repo.create(
                user_id=user.user_id,
                overload_enabled=True,
                threshold_w=1200.0,
                automation_rules_json=self.default_threshold_rules(),
            )

        existing_assets = asset_repo.list_by_user(user.user_id)
        if existing_assets:
            return

        asset_repo.create_many(
            [
                Asset(
                    user_id=user.user_id,
                    state_cached="unknown",
                    is_active=True,
                    **asset_data,
                )
                for asset_data in DEFAULT_ASSETS
            ]
        )

    def _asset_key_map(self, db: Session, user_id: int) -> dict[str, Asset]:
        assets = AssetRepository(db).list_by_user(user_id)
        mapping = {
            "sensor.temperature": "temperature",
            "sensor.humidity": "humidity",
            "sensor.light": "light",
            "sensor.voltage": "voltage",
        }
        return {mapping[asset.asset_type]: asset for asset in assets if asset.asset_type in mapping}

    def _evaluate_status(self, rules: dict[str, Any], key: str, value: float) -> tuple[str, AlertRead | None]:
        rule = rules.get(key, {})
        min_value = rule.get("min")
        max_value = rule.get("max")
        unit = infer_unit(key, value)

        if min_value is not None and value < float(min_value):
            return (
                "critical",
                AlertRead(
                    record_id=0,
                    level="critical",
                    title=f"{key.title()} below minimum",
                    detail=f"{key.title()} is {value:.2f}{unit}, below {min_value}{unit}.",
                    key=key,
                    value=value,
                    unit=unit,
                    created_at=now_utc(),
                ),
            )

        if max_value is not None and value > float(max_value):
            return (
                "critical",
                AlertRead(
                    record_id=0,
                    level="critical",
                    title=f"{key.title()} above maximum",
                    detail=f"{key.title()} is {value:.2f}{unit}, above {max_value}{unit}.",
                    key=key,
                    value=value,
                    unit=unit,
                    created_at=now_utc(),
                ),
            )

        return ("normal", None)

    def ingest_payload(self, db: Session, payload: dict[str, Any]) -> DashboardOverview:
        self.ensure_default_data(db)

        user_repo = UserRepository(db)
        config_repo = ConfigRepository(db)
        record_repo = RecordRepository(db)
        asset_repo = AssetRepository(db)

        user = user_repo.get_by_username(self.settings.seed_username)
        assert user is not None
        config = config_repo.get_by_user_id(user.user_id)
        assert config is not None

        thresholds = config.automation_rules_json or self.default_threshold_rules()
        asset_map = self._asset_key_map(db, user.user_id)
        timestamp = payload.get("timestamp") or now_utc().isoformat()

        sample_record = Record(
            user_id=user.user_id,
            asset_id=None,
            record_type="telemetry_sample",
            key="snapshot",
            value=None,
            unit=None,
            status="normal",
            payload_json={
                "temperature": float(payload["temperature"]),
                "humidity": float(payload["humidity"]),
                "light": float(payload["light"]),
                "voltage": float(payload["voltage"]),
                "timestamp": timestamp,
            },
        )
        record_repo.create(sample_record)

        alert_records: list[Record] = []
        metric_records: list[Record] = []

        for metric_key in ("temperature", "humidity", "light", "voltage"):
            metric_value = float(payload[metric_key])
            unit = infer_unit(metric_key, metric_value)
            status, alert = self._evaluate_status(thresholds, metric_key, metric_value)
            asset = asset_map.get(metric_key)

            if asset is not None:
                asset_repo.update_state(asset, f"{metric_value:.2f}{unit}")

            metric_records.append(
                Record(
                    user_id=user.user_id,
                    asset_id=asset.asset_id if asset else None,
                    record_type="telemetry_metric",
                    key=metric_key,
                    value=metric_value,
                    unit=unit,
                    status=status,
                    payload_json={
                        "timestamp": timestamp,
                        "value": metric_value,
                        "unit": unit,
                    },
                )
            )

            if alert is not None:
                alert_records.append(
                    Record(
                        user_id=user.user_id,
                        asset_id=asset.asset_id if asset else None,
                        record_type="alert",
                        key=metric_key,
                        value=metric_value,
                        unit=unit,
                        status=alert.level,
                        payload_json={
                            "title": alert.title,
                            "detail": alert.detail,
                            "value": metric_value,
                            "unit": unit,
                            "timestamp": timestamp,
                        },
                    )
                )

        record_repo.create_many(metric_records)
        if alert_records:
            record_repo.create_many(alert_records)

        overview = self.build_overview(db)
        recent_sample = overview.recent_samples[0] if overview.recent_samples else None
        if self.loop and recent_sample is not None:
            payload = {
                "type": "telemetry",
                "summary": overview.summary.model_dump(mode="json"),
                "metrics": overview.metrics.model_dump(mode="json"),
                "alerts": [alert.model_dump(mode="json") for alert in overview.alerts[:5]],
                "recent_sample": recent_sample.model_dump(mode="json"),
            }
            asyncio.run_coroutine_threadsafe(self.manager.broadcast_json(payload), self.loop)

        return overview

    def build_overview(self, db: Session) -> DashboardOverview:
        self.ensure_default_data(db)

        user_repo = UserRepository(db)
        config_repo = ConfigRepository(db)
        asset_repo = AssetRepository(db)
        record_repo = RecordRepository(db)

        user = user_repo.get_by_username(self.settings.seed_username)
        assert user is not None
        config = config_repo.get_by_user_id(user.user_id)
        assert config is not None

        latest_sample = record_repo.latest_sample()
        recent_samples = self.get_recent_samples(db, limit=24)
        recent_alerts = [build_alert_read(record) for record in record_repo.recent_alerts(limit=10)]

        if latest_sample and latest_sample.payload_json:
            metrics_payload = latest_sample.payload_json
            metrics = MetricSnapshot(
                temperature=float(metrics_payload["temperature"]),
                humidity=float(metrics_payload["humidity"]),
                light=float(metrics_payload["light"]),
                voltage=float(metrics_payload["voltage"]),
                timestamp=str(metrics_payload.get("timestamp") or serialize_dt(latest_sample.created_at)),
            )
        else:
            metrics = MetricSnapshot(
                temperature=0.0,
                humidity=0.0,
                light=0.0,
                voltage=0.0,
                timestamp=now_utc().isoformat(),
            )

        if latest_sample is None:
            connection_state = "offline"
            last_update = None
        else:
            created_at = latest_sample.created_at
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            age_seconds = (now_utc() - created_at).total_seconds()
            connection_state = "stale" if age_seconds > self.settings.stale_after_seconds else "live"
            last_update = metrics.timestamp

        summary = SummaryRead(
            connection_state=connection_state,
            last_update=last_update,
            mqtt_topic=self.settings.mqtt_topic,
            mqtt_host=self.settings.mqtt_host,
            poll_interval_seconds=self.settings.poll_interval_seconds,
            stale_after_seconds=self.settings.stale_after_seconds,
            update_count=record_repo.telemetry_count(),
        )

        return DashboardOverview(
            user=UserRead.model_validate(user),
            config=config,
            summary=summary,
            metrics=metrics,
            assets=asset_repo.list_by_user(user.user_id),
            alerts=recent_alerts,
            recent_samples=recent_samples,
        )

    def get_recent_samples(self, db: Session, limit: int = 24) -> list[RecentSample]:
        records = RecordRepository(db).recent_by_type("telemetry_sample", limit=limit)
        samples: list[RecentSample] = []
        total = len(records)
        for index, record in enumerate(records):
            payload = record.payload_json or {}
            samples.append(
                RecentSample(
                    sequence=total - index,
                    temperature=float(payload.get("temperature", 0)),
                    humidity=float(payload.get("humidity", 0)),
                    light=float(payload.get("light", 0)),
                    voltage=float(payload.get("voltage", 0)),
                    timestamp=str(payload.get("timestamp") or serialize_dt(record.created_at)),
                )
            )
        return samples
