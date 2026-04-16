from __future__ import annotations

import csv
import io
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import paho.mqtt.publish as mqtt_publish
from sqlalchemy.orm import Session

from .bootstrap import DEFAULT_RULES
from .core.settings import get_settings
from .models import Asset, Config, Record
from .repositories import AssetRepository, ConfigRepository, RecordRepository, UserRepository

settings = get_settings()

KNOWN_METRICS = ("temperature", "humidity", "light", "voltage")
CONTROL_DEVICE_KEYS = ("device1", "device2", "device3")
DEFAULT_CONTROL_STATE = {key: 0 for key in CONTROL_DEVICE_KEYS}
METRIC_DEVICE_MAP = {
    "temperature": {
        "device_key": "device1",
        "device_label": "Device 1",
        "sensor_label": "Temperature",
    },
    "humidity": {
        "device_key": "device2",
        "device_label": "Device 2",
        "sensor_label": "Humidity",
    },
    "light": {
        "device_key": "device3",
        "device_label": "Device 3",
        "sensor_label": "Light",
    },
    "voltage": {
        "device_key": "device4",
        "device_label": "Device 4",
        "sensor_label": "Voltage",
    },
}
DEVICE_TO_METRIC = {
    config["device_key"]: metric_key
    for metric_key, config in METRIC_DEVICE_MAP.items()
}
UNIT_MAP = {
    "temperature": "C",
    "humidity": "%",
    "light": "%",
    "voltage": "V",
}
BALANCED_METRICS = {"humidity", "light"}


def normalize_automation_rules(rules: dict[str, Any] | None = None) -> dict[str, dict[str, Any]]:
    normalized = {
        metric_key: dict(metric_rules)
        for metric_key, metric_rules in DEFAULT_RULES.items()
    }

    if not isinstance(rules, dict):
        return normalized

    for metric_key, metric_rules in rules.items():
        if not isinstance(metric_rules, dict):
            continue
        normalized[metric_key] = {
            **normalized.get(metric_key, {}),
            **metric_rules,
        }

    return normalized


def resolve_metric_unit(metric_key: str, value: float, rules: dict[str, Any] | None = None) -> str:
    metric_rules = normalize_automation_rules(rules).get(metric_key, {})
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


def coerce_float(value: Any, default: float = 0.0) -> float:
    if value is None:
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def resolve_metric_key(key: Any) -> str | None:
    normalized = str(key).strip().lower()
    if normalized in KNOWN_METRICS:
        return normalized
    return DEVICE_TO_METRIC.get(normalized)


def coerce_enabled(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    if isinstance(value, str):
        return value.strip().lower() not in {"0", "false", "off", "disabled", "no"}
    return bool(value)


def resolve_sensor_enabled(payload: dict[str, Any]) -> dict[str, bool]:
    enabled_by_metric = {metric_key: True for metric_key in KNOWN_METRICS}
    sensor_enabled = payload.get("sensor_enabled")
    enabled_sensors = payload.get("enabled_sensors")
    disabled_sensors = payload.get("disabled_sensors") or payload.get("sensor_disabled")

    if isinstance(enabled_sensors, list):
        enabled_by_metric = {metric_key: False for metric_key in KNOWN_METRICS}
        for key in enabled_sensors:
            metric_key = resolve_metric_key(key)
            if metric_key is not None:
                enabled_by_metric[metric_key] = True

    if isinstance(sensor_enabled, dict):
        for key, value in sensor_enabled.items():
            metric_key = resolve_metric_key(key)
            if metric_key is not None:
                enabled_by_metric[metric_key] = coerce_enabled(value)

    if isinstance(disabled_sensors, list):
        for key in disabled_sensors:
            metric_key = resolve_metric_key(key)
            if metric_key is not None:
                enabled_by_metric[metric_key] = False

    for metric_key in KNOWN_METRICS:
        flat_metric_key = f"{metric_key}_enabled"
        device_key = METRIC_DEVICE_MAP[metric_key]["device_key"]
        flat_device_key = f"{device_key}_enabled"
        if flat_metric_key in payload:
            enabled_by_metric[metric_key] = coerce_enabled(payload[flat_metric_key])
        if flat_device_key in payload:
            enabled_by_metric[metric_key] = coerce_enabled(payload[flat_device_key])

    return enabled_by_metric


def metric_source(metric_key: str) -> dict[str, str]:
    source = METRIC_DEVICE_MAP.get(metric_key)
    if source is None:
        return {
            "device_key": "unknown",
            "device_label": "Unknown device",
            "sensor_label": metric_key.title(),
        }
    return source


def metric_state_from_threshold(
    *,
    metric_key: str,
    value: float | None,
    enabled: bool,
    rules: dict[str, Any] | None,
) -> dict[str, str]:
    if not enabled:
        return {"state": "disabled", "status_label": "Disabled", "severity": "warning"}

    if value is None:
        return {"state": "unknown", "status_label": "Stable", "severity": "healthy"}

    metric_rules = normalize_automation_rules(rules).get(metric_key, {})
    minimum = metric_rules.get("min")
    maximum = metric_rules.get("max")

    if minimum is not None and value < minimum:
        return {"state": "low", "status_label": "Low", "severity": "warning"}
    if maximum is not None and value > maximum:
        return {"state": "high", "status_label": "High", "severity": "critical"}

    return {
        "state": "balanced" if metric_key in BALANCED_METRICS else "stable",
        "status_label": "Balanced" if metric_key in BALANCED_METRICS else "Stable",
        "severity": "healthy",
    }


def build_sensor_status(
    enabled_by_metric: dict[str, bool],
    values_by_metric: dict[str, float | None] | None = None,
    rules: dict[str, Any] | None = None,
) -> dict[str, dict[str, Any]]:
    values = values_by_metric or {}
    return {
        metric_key: {
            **metric_source(metric_key),
            "metric_key": metric_key,
            "enabled": bool(enabled_by_metric.get(metric_key, True)),
            **metric_state_from_threshold(
                metric_key=metric_key,
                value=values.get(metric_key),
                enabled=bool(enabled_by_metric.get(metric_key, True)),
                rules=rules,
            ),
        }
        for metric_key in KNOWN_METRICS
    }


def default_sensor_status() -> dict[str, dict[str, Any]]:
    return build_sensor_status({metric_key: True for metric_key in KNOWN_METRICS})


def payload_has_sensor_enabled_fields(payload: dict[str, Any]) -> bool:
    if any(key in payload for key in ("sensor_enabled", "enabled_sensors", "disabled_sensors", "sensor_disabled")):
        return True
    return any(
        f"{metric_key}_enabled" in payload
        or f"{METRIC_DEVICE_MAP[metric_key]['device_key']}_enabled" in payload
        for metric_key in KNOWN_METRICS
    )


def build_sensor_status_from_payload(
    payload: dict[str, Any],
    rules: dict[str, Any] | None,
) -> dict[str, dict[str, Any]]:
    stored_status = payload.get("sensor_status")
    stored_status = stored_status if isinstance(stored_status, dict) else {}

    if payload_has_sensor_enabled_fields(payload):
        sensor_enabled = resolve_sensor_enabled(payload)
    else:
        sensor_enabled = {
            metric_key: bool(
                (stored_status.get(metric_key) or {}).get("enabled", True)
                if isinstance(stored_status.get(metric_key), dict)
                else True
            )
            for metric_key in KNOWN_METRICS
        }

    values_by_metric = {
        metric_key: coerce_float(payload.get(metric_key))
        for metric_key in KNOWN_METRICS
        if metric_key in payload and payload[metric_key] is not None
    }
    return build_sensor_status(sensor_enabled, values_by_metric, rules)


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
    source = payload.get("source") or metric_source(record.metric_key)
    unit = record.unit or payload.get("unit")
    boundary = threshold.get("min") if record.status == "below_min" else threshold.get("max")
    title = payload.get("title")
    if title is None:
        direction = "below minimum" if record.status == "below_min" else "above maximum"
        title = f"{source['device_label']} · {record.metric_key.title()} {direction}"

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
        "device_key": source.get("device_key"),
        "device_label": source.get("device_label"),
        "sensor_label": source.get("sensor_label"),
        "source_label": f"{source.get('device_label')} · {source.get('sensor_label')}",
        "created_at": serialize_timestamp(record.created_at),
    }


def serialize_recent_sample(record: Record, sequence: int) -> dict[str, Any]:
    payload = record.payload_json or {}
    return {
        "sequence": sequence,
        "temperature": coerce_float(payload.get("temperature")),
        "humidity": coerce_float(payload.get("humidity")),
        "light": coerce_float(payload.get("light")),
        "voltage": coerce_float(payload.get("voltage")),
        "timestamp": payload.get("timestamp") or serialize_timestamp(record.created_at),
        "sensor_status": payload.get("sensor_status") or default_sensor_status(),
    }


def serialize_config(config: Config | None) -> dict[str, Any] | None:
    if config is None:
        return None
    return {
        "config_id": config.config_id,
        "user_id": config.user_id,
        "overload_enabled": config.overload_enabled,
        "threshold_w": config.threshold_w,
        "automation_rules_json": normalize_automation_rules(config.automation_rules_json),
        "updated_at": config.updated_at.isoformat() if config.updated_at else None,
    }


class DeviceControlService:
    @staticmethod
    def _control_path() -> Path:
        configured_path = Path(settings.device_control_file)
        if configured_path.is_absolute():
            return configured_path

        repo_root = Path(__file__).resolve().parents[2]
        return repo_root / configured_path

    @staticmethod
    def _normalize_state(payload: dict[str, Any]) -> dict[str, int]:
        normalized = DEFAULT_CONTROL_STATE.copy()

        for key in CONTROL_DEVICE_KEYS:
            if key not in payload:
                continue
            normalized[key] = 1 if int(payload[key]) else 0

        return normalized

    @classmethod
    def read_state(cls) -> dict[str, Any]:
        path = cls._control_path()

        if not path.exists():
            state = DEFAULT_CONTROL_STATE.copy()
        else:
            try:
                with path.open("r", encoding="utf-8") as control_file:
                    state = cls._normalize_state(json.load(control_file))
            except (OSError, json.JSONDecodeError, TypeError, ValueError):
                state = DEFAULT_CONTROL_STATE.copy()

        return {
            **state,
            "control_file": str(path),
            "topic": settings.mqtt_control_topic,
            "published": False,
            "publish_error": None,
            "updated_at": serialize_timestamp(datetime.now(timezone.utc)),
        }

    @classmethod
    def update_state(cls, payload: dict[str, Any]) -> dict[str, Any]:
        current_payload = cls.read_state()
        current = {key: current_payload.get(key, DEFAULT_CONTROL_STATE[key]) for key in CONTROL_DEVICE_KEYS}
        updates = {
            key: value
            for key, value in payload.items()
            if key in CONTROL_DEVICE_KEYS and value is not None
        }
        next_state = cls._normalize_state({**current, **updates})
        path = cls._control_path()
        path.parent.mkdir(parents=True, exist_ok=True)

        with path.open("w", encoding="utf-8") as control_file:
            json.dump(next_state, control_file, indent=2)
            control_file.write("\n")

        published = False
        publish_error = None
        if not settings.disable_mqtt:
            try:
                mqtt_publish.single(
                    settings.mqtt_control_topic,
                    payload=json.dumps(next_state),
                    hostname=settings.mqtt_broker_host,
                    port=settings.mqtt_broker_port,
                )
                published = True
            except Exception as exc:  # noqa: BLE001 - return the control-file write even if MQTT fails.
                publish_error = str(exc)

        return {
            **next_state,
            "control_file": str(path),
            "topic": settings.mqtt_control_topic,
            "published": published,
            "publish_error": publish_error,
            "updated_at": serialize_timestamp(datetime.now(timezone.utc)),
        }


class ThresholdService:
    @staticmethod
    def _status_for_value(
        metric_key: str,
        value: float,
        rules: dict[str, Any],
    ) -> tuple[str, str, str, dict[str, Any]] | None:
        rules = normalize_automation_rules(rules)
        metric_rules = rules.get(metric_key)
        if not metric_rules:
            return None

        minimum = metric_rules.get("min")
        maximum = metric_rules.get("max")
        unit = resolve_metric_unit(metric_key, value, rules)
        source = metric_source(metric_key)
        source_label = f"{source['device_label']} · {source['sensor_label']}"

        if minimum is not None and value < minimum:
            return (
                "below_min",
                f"{source_label} below minimum",
                f"{source_label} reports {value:.2f}{unit}, below {minimum}{unit}.",
                metric_rules,
            )
        if maximum is not None and value > maximum:
            return (
                "above_max",
                f"{source_label} above maximum",
                f"{source_label} reports {value:.2f}{unit}, above {maximum}{unit}.",
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
        rules = normalize_automation_rules(config.automation_rules_json)
        alert = cls._status_for_value(metric_key, value, rules)
        if alert is None:
            return ("ok", [])

        status, title, detail, threshold = alert
        record_repo = RecordRepository(session)
        source = metric_source(metric_key)
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
                "source": source,
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
        rules = normalize_automation_rules(config.automation_rules_json)
        timestamp = payload.get("timestamp") or datetime.now(timezone.utc).isoformat()
        sensor_enabled = resolve_sensor_enabled(payload)
        sensor_status = build_sensor_status_from_payload(payload, rules)

        sample_payload = {
            key: float(payload[key])
            for key in KNOWN_METRICS
            if key in payload and payload[key] is not None
        }
        sample_payload["timestamp"] = timestamp
        sample_payload["sensor_status"] = sensor_status
        if payload.get("scenario"):
            sample_payload["scenario"] = payload["scenario"]
        if payload.get("disabled_sensors"):
            sample_payload["disabled_sensors"] = payload["disabled_sensors"]
        if payload.get("sensor_enabled"):
            sample_payload["sensor_enabled"] = payload["sensor_enabled"]
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
            enabled = sensor_enabled.get(metric_key, True)
            asset = asset_repo.by_hw_address(metric_key)
            if asset is not None:
                asset.is_active = enabled

            if not enabled:
                unit = resolve_metric_unit(metric_key, coerce_float(payload.get(metric_key)), rules)
                value = coerce_float(payload.get(metric_key)) if payload.get(metric_key) is not None else None
                if asset is not None:
                    asset.state_cached = "disabled"

                telemetry_records.append(
                    record_repo.create(
                        user_id=user.user_id,
                        asset_id=asset.asset_id if asset else None,
                        record_type="telemetry",
                        metric_key=metric_key,
                        value=value,
                        unit=unit,
                        status="disabled",
                        payload_json={
                            "metric_key": metric_key,
                            "value": value,
                            "unit": unit,
                            "timestamp": timestamp,
                            "source": metric_source(metric_key),
                            "sensor_status": sensor_status.get(metric_key),
                            "received_payload": payload,
                        },
                    )
                )
                ingested_metrics += 1
                continue

            if metric_key not in payload or payload[metric_key] is None:
                continue
            try:
                value = float(payload[metric_key])
            except (TypeError, ValueError) as exc:
                raise ValueError(f"Invalid numeric value for {metric_key}") from exc

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
                        "source": metric_source(metric_key),
                        "sensor_status": sensor_status.get(metric_key),
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
        rules = normalize_automation_rules(config.automation_rules_json if config else None)

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
        rules = normalize_automation_rules(config.automation_rules_json if config else None)

        if last_record and last_record.payload_json:
            latest_payload = last_record.payload_json
            sensor_status = build_sensor_status_from_payload(latest_payload, rules)
            metrics = {
                "temperature": coerce_float(latest_payload.get("temperature")),
                "humidity": coerce_float(latest_payload.get("humidity")),
                "light": coerce_float(latest_payload.get("light")),
                "voltage": coerce_float(latest_payload.get("voltage")),
                "timestamp": latest_payload.get("timestamp") or serialize_timestamp(last_record.created_at),
                "sensor_status": sensor_status,
            }
        else:
            sensor_status = default_sensor_status()
            metrics = {
                "temperature": 0.0,
                "humidity": 0.0,
                "light": 0.0,
                "voltage": 0.0,
                "timestamp": None,
                "sensor_status": sensor_status,
            }

        active_sensors = sum(
            1
            for metric_key in KNOWN_METRICS
            if (sensor_status.get(metric_key) or {}).get("enabled", True)
        )
        summary = {
            "connection_state": cls._connection_state(last_record),
            "last_update": metrics["timestamp"],
            "mqtt_topic": settings.mqtt_topic,
            "mqtt_host": settings.mqtt_broker_host,
            "poll_interval_seconds": settings.poll_interval_seconds,
            "stale_after_seconds": settings.alert_stale_after_seconds,
            "update_count": record_repo.telemetry_count(),
            "active_sensors": active_sensors,
            "disabled_sensors": [
                metric_key
                for metric_key in KNOWN_METRICS
                if not (sensor_status.get(metric_key) or {}).get("enabled", True)
            ],
            "sensor_device_map": METRIC_DEVICE_MAP,
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
    def current_config(cls, session: Session) -> dict[str, Any]:
        config = ConfigRepository(session).get_current()
        return {"config_summary": serialize_config(config)}

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
            current_rules = normalize_automation_rules(config.automation_rules_json)
            for metric_key, rule in payload["automation_rules_json"].items():
                if not isinstance(rule, dict):
                    continue
                current_rules[metric_key] = {
                    **current_rules.get(metric_key, {}),
                    **rule,
                }
            config.automation_rules_json = current_rules

        session.add(config)
        session.commit()
        session.refresh(config)
        return {"config_summary": serialize_config(config)}

    @classmethod
    def export_report_csv(cls, session: Session, limit: int = 240) -> str:
        records = RecordRepository(session).list_recent("telemetry_sample", limit)

        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(
            [
                "timestamp",
                "temperature",
                "humidity",
                "light",
                "voltage",
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
                ]
            )

        return buffer.getvalue()
