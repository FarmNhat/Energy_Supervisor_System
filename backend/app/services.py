from __future__ import annotations

import csv
import io
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy.orm import Session

from .bootstrap import DEFAULT_RULES
from .core.settings import get_settings
from .models import Asset, Config, Record
from .repositories import AssetRepository, ConfigRepository, RecordRepository, UserRepository

settings = get_settings()

KNOWN_METRICS = ("temperature", "humidity", "light", "voltage")
UNIT_MAP = {
    "temperature": "C",
    "humidity": "%",
    "light": "%",
    "voltage": "V",
}


def resolve_metric_unit(metric_key: str, value: float, rules: dict[str, Any] | None = None) -> str:
    metric_rules = (rules or {}).get(metric_key, {})
    if metric_rules.get("unit") is not None:
        return str(metric_rules["unit"])
    if metric_key == "temperature":
        return "F" if value > 55 else "C"
    return UNIT_MAP.get(metric_key, "")


def serialize_timestamp(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.isoformat()


def serialize_asset(asset: Asset) -> dict[str, Any]:
    return {
        "asset_id": asset.asset_id,
        "user_id": asset.user_id,
        "name": asset.name,
        "asset_type": asset.asset_type,
        "location": asset.location,
        "relay_channel": asset.relay_channel,
        "hw_address": asset.hw_address,
        "state_cached": asset.state_cached,
        "is_active": asset.is_active,
    }


def serialize_record(record: Record) -> dict[str, Any]:
    return {
        "record_id": record.record_id,
        "user_id": record.user_id,
        "asset_id": record.asset_id,
        "record_type": record.record_type,
        "key": record.metric_key,
        "value": record.value,
        "unit": record.unit,
        "status": record.status,
        "payload_json": record.payload_json,
        "created_at": record.created_at.isoformat() if record.created_at else None,
    }


def serialize_alert(record: Record) -> dict[str, Any]:
    payload = record.payload_json or {}
    threshold = payload.get("threshold") or {}
    unit = record.unit or payload.get("unit")
    boundary = threshold.get("min") if record.status == "below_min" else threshold.get("max")
    title = payload.get("title")
    if title is None:
        direction = "below minimum" if record.status == "below_min" else "above maximum"
        title = f"{record.metric_key.title()} {direction}"

    detail = payload.get("detail")
    if detail is None and boundary is not None and record.value is not None:
        direction = "below" if record.status == "below_min" else "above"
        detail = (
            f"{record.metric_key.title()} is {record.value:.2f}{unit or ''}, "
            f"{direction} {boundary}{unit or ''}."
        )
    if detail is None:
        detail = payload.get("message") or "A telemetry threshold was crossed."

    return {
        "record_id": record.record_id,
        "level": "critical" if record.status in {"below_min", "above_max"} else "warning",
        "title": title,
        "detail": detail,
        "key": record.metric_key,
        "value": record.value,
        "unit": unit,
        "created_at": serialize_timestamp(record.created_at),
    }


def serialize_recent_sample(record: Record, sequence: int) -> dict[str, Any]:
    payload = record.payload_json or {}
    return {
        "sequence": sequence,
        "temperature": float(payload.get("temperature", 0.0)),
        "humidity": float(payload.get("humidity", 0.0)),
        "light": float(payload.get("light", 0.0)),
        "voltage": float(payload.get("voltage", 0.0)),
        "timestamp": payload.get("timestamp") or serialize_timestamp(record.created_at),
    }


def serialize_config(config: Config | None) -> dict[str, Any] | None:
    if config is None:
        return None
    return {
        "config_id": config.config_id,
        "user_id": config.user_id,
        "overload_enabled": config.overload_enabled,
        "threshold_w": config.threshold_w,
        "automation_rules_json": config.automation_rules_json,
        "updated_at": config.updated_at.isoformat() if config.updated_at else None,
    }


class ThresholdService:
    @staticmethod
    def _status_for_value(
        metric_key: str,
        value: float,
        rules: dict[str, Any],
    ) -> tuple[str, str, str, dict[str, Any]] | None:
        metric_rules = rules.get(metric_key)
        if not metric_rules:
            return None

        minimum = metric_rules.get("min")
        maximum = metric_rules.get("max")
        unit = resolve_metric_unit(metric_key, value, rules)

        if minimum is not None and value < minimum:
            return (
                "below_min",
                f"{metric_key.title()} below minimum",
                f"{metric_key.title()} is {value:.2f}{unit}, below {minimum}{unit}.",
                metric_rules,
            )
        if maximum is not None and value > maximum:
            return (
                "above_max",
                f"{metric_key.title()} above maximum",
                f"{metric_key.title()} is {value:.2f}{unit}, above {maximum}{unit}.",
                metric_rules,
            )
        return None

    @classmethod
    def evaluate(
        cls,
        *,
        session: Session,
        user_id: int,
        config: Config,
        asset: Asset | None,
        payload: dict[str, Any],
        metric_key: str,
        value: float,
    ) -> tuple[str, list[Record]]:
        rules = config.automation_rules_json or {}
        alert = cls._status_for_value(metric_key, value, rules)
        if alert is None:
            return ("ok", [])

        status, title, detail, threshold = alert
        record_repo = RecordRepository(session)
        alert_record = record_repo.create(
            user_id=user_id,
            asset_id=asset.asset_id if asset else None,
            record_type="alert",
            metric_key=metric_key,
            value=value,
            unit=resolve_metric_unit(metric_key, value, rules),
            status=status,
            payload_json={
                "message": detail,
                "title": title,
                "detail": detail,
                "threshold": threshold,
                "received_payload": payload,
            },
        )
        return (status, [alert_record])


class TelemetryService:
    @staticmethod
    def ingest_payload(session: Session, payload: dict[str, Any]) -> dict[str, Any]:
        user = UserRepository(session).get_first()
        if user is None:
            raise RuntimeError("No default user seeded")

        config = ConfigRepository(session).get_current()
        if config is None:
            raise RuntimeError("No default config seeded")

        asset_repo = AssetRepository(session)
        record_repo = RecordRepository(session)

        telemetry_records: list[Record] = []
        alert_records: list[Record] = []
        ingested_metrics = 0
        rules = config.automation_rules_json or DEFAULT_RULES
        timestamp = payload.get("timestamp") or datetime.now(timezone.utc).isoformat()

        sample_payload = {
            key: float(payload[key])
            for key in KNOWN_METRICS
            if key in payload
        }
        sample_payload["timestamp"] = timestamp
        if payload.get("scenario"):
            sample_payload["scenario"] = payload["scenario"]
        record_repo.create(
            user_id=user.user_id,
            asset_id=None,
            record_type="telemetry_sample",
            metric_key="snapshot",
            value=None,
            unit=None,
            status="ok",
            payload_json=sample_payload,
        )

        for metric_key in KNOWN_METRICS:
            if metric_key not in payload:
                continue
            try:
                value = float(payload[metric_key])
            except (TypeError, ValueError) as exc:
                raise ValueError(f"Invalid numeric value for {metric_key}") from exc

            asset = asset_repo.by_hw_address(metric_key)
            unit = resolve_metric_unit(metric_key, value, rules)
            status, generated_alerts = ThresholdService.evaluate(
                session=session,
                user_id=user.user_id,
                config=config,
                asset=asset,
                payload=payload,
                metric_key=metric_key,
                value=value,
            )
            if asset is not None:
                asset.state_cached = f"{value:.2f} {unit}".strip()

            telemetry_records.append(
                record_repo.create(
                    user_id=user.user_id,
                    asset_id=asset.asset_id if asset else None,
                    record_type="telemetry",
                    metric_key=metric_key,
                    value=value,
                    unit=unit,
                    status=status,
                    payload_json={
                        "metric_key": metric_key,
                        "value": value,
                        "unit": unit,
                        "timestamp": timestamp,
                        "received_payload": payload,
                    },
                )
            )
            alert_records.extend(generated_alerts)
            ingested_metrics += 1

        if ingested_metrics == 0:
            raise ValueError("Payload did not include any supported telemetry metrics")

        session.commit()
        return DashboardService.overview(session)


class DashboardService:
    @staticmethod
    def _connection_state(last_record: Record | None) -> str:
        if last_record is None or last_record.created_at is None:
            return "offline"

        now = datetime.now(timezone.utc)
        created_at = (
            last_record.created_at
            if last_record.created_at.tzinfo is not None
            else last_record.created_at.replace(tzinfo=timezone.utc)
        )
        if now - created_at > timedelta(seconds=settings.alert_stale_after_seconds):
            return "stale"
        return "live"

    @classmethod
    def _latest_metrics(cls, telemetry_records: list[Record], assets: list[Asset], config: Config | None) -> dict[str, Any]:
        latest_by_key: dict[str, Record] = {}
        asset_by_id = {asset.asset_id: asset for asset in assets}
        rules = config.automation_rules_json if config else DEFAULT_RULES

        for record in telemetry_records:
            if record.metric_key not in latest_by_key:
                latest_by_key[record.metric_key] = record

        metrics: dict[str, Any] = {}
        for metric_key in KNOWN_METRICS:
            record = latest_by_key.get(metric_key)
            if record is None:
                continue
            asset = asset_by_id.get(record.asset_id) if record.asset_id is not None else None
            metrics[metric_key] = {
                "value": record.value,
                "unit": record.unit,
                "status": record.status,
                "threshold": rules.get(metric_key),
                "asset": serialize_asset(asset) if asset is not None else None,
                "created_at": record.created_at.isoformat() if record.created_at else None,
            }
        return metrics

    @classmethod
    def overview(cls, session: Session, limit: int = 24) -> dict[str, Any]:
        config_repo = ConfigRepository(session)
        asset_repo = AssetRepository(session)
        record_repo = RecordRepository(session)

        config = config_repo.get_current()
        assets = asset_repo.list_all()
        recent_samples = record_repo.list_recent("telemetry_sample", limit)
        recent_alerts = record_repo.list_recent("alert", 10)
        last_record = recent_samples[0] if recent_samples else None

        if last_record and last_record.payload_json:
            latest_payload = last_record.payload_json
            metrics = {
                "temperature": float(latest_payload.get("temperature", 0.0)),
                "humidity": float(latest_payload.get("humidity", 0.0)),
                "light": float(latest_payload.get("light", 0.0)),
                "voltage": float(latest_payload.get("voltage", 0.0)),
                "timestamp": latest_payload.get("timestamp") or serialize_timestamp(last_record.created_at),
            }
        else:
            metrics = {
                "temperature": 0.0,
                "humidity": 0.0,
                "light": 0.0,
                "voltage": 0.0,
                "timestamp": None,
            }

        summary = {
            "connection_state": cls._connection_state(last_record),
            "last_update": metrics["timestamp"],
            "mqtt_topic": settings.mqtt_topic,
            "mqtt_host": settings.mqtt_broker_host,
            "poll_interval_seconds": settings.poll_interval_seconds,
            "stale_after_seconds": settings.alert_stale_after_seconds,
            "update_count": record_repo.telemetry_count(),
        }

        return {
            "summary": summary,
            "metrics": metrics,
            "assets": [serialize_asset(asset) for asset in assets],
            "alerts": [serialize_alert(record) for record in recent_alerts],
            "recent_samples": [
                serialize_recent_sample(record, len(recent_samples) - index)
                for index, record in enumerate(recent_samples)
            ],
            "config": serialize_config(config),
        }

    @classmethod
    def recent_records(cls, session: Session, limit: int) -> dict[str, Any]:
        records = RecordRepository(session).list_recent("telemetry_sample", limit)
        return {
            "items": [
                serialize_recent_sample(record, len(records) - index)
                for index, record in enumerate(records)
            ]
        }

    @classmethod
    def recent_alerts(cls, session: Session, limit: int) -> dict[str, Any]:
        records = RecordRepository(session).list_recent("alert", limit)
        return {"items": [serialize_alert(record) for record in records]}

    @classmethod
    def assets(cls, session: Session) -> dict[str, Any]:
        assets = AssetRepository(session).list_all()
        return {"items": [serialize_asset(asset) for asset in assets]}

    @classmethod
    def update_config(cls, session: Session, payload: dict[str, Any]) -> dict[str, Any]:
        config_repo = ConfigRepository(session)
        config = config_repo.get_current()
        if config is None:
            raise RuntimeError("No config seeded")

        if payload.get("overload_enabled") is not None:
            config.overload_enabled = payload["overload_enabled"]
        if payload.get("threshold_w") is not None:
            config.threshold_w = payload["threshold_w"]
        if payload.get("automation_rules_json") is not None:
            config.automation_rules_json = payload["automation_rules_json"]

        session.add(config)
        session.commit()
        session.refresh(config)
        return {"config_summary": serialize_config(config)}

    @classmethod
    def export_report_csv(cls, session: Session, limit: int = 240) -> str:
        records = RecordRepository(session).list_recent("telemetry_sample", limit)
        config = ConfigRepository(session).get_current()
        alerts = RecordRepository(session).list_recent("alert", limit)

        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(
            [
                "timestamp",
                "temperature",
                "humidity",
                "light",
                "voltage",
                "threshold_w",
                "alert_count",
                "note",
            ]
        )

        for record in reversed(records):
            payload = record.payload_json or {}
            writer.writerow(
                [
                    payload.get("timestamp") or serialize_timestamp(record.created_at),
                    payload.get("temperature"),
                    payload.get("humidity"),
                    payload.get("light"),
                    payload.get("voltage"),
                    config.threshold_w if config is not None else "",
                    len(alerts),
                    "Mock phase: report contains 4-sensor telemetry. Real power cost simulation can be added when the device publishes power data.",
                ]
            )

        if not records:
            writer.writerow(
                [
                    "",
                    "",
                    "",
                    "",
                    "",
                    config.threshold_w if config is not None else "",
                    0,
                    "No telemetry samples available in the selected window.",
                ]
            )

        return buffer.getvalue()
