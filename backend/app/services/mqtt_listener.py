from __future__ import annotations

import json
import logging
import threading

import paho.mqtt.client as mqtt
from sqlalchemy.orm import Session

from ..core.config import Settings
from ..core.database import SessionLocal
from .telemetry import TelemetryService


logger = logging.getLogger(__name__)


class MQTTListener:
    def __init__(self, settings: Settings, telemetry_service: TelemetryService) -> None:
        self.settings = settings
        self.telemetry_service = telemetry_service
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=settings.mqtt_client_id)
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.thread: threading.Thread | None = None

    def start(self) -> None:
        if self.thread and self.thread.is_alive():
            return

        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()

    def _run(self) -> None:
        try:
            self.client.connect(
                self.settings.mqtt_host,
                self.settings.mqtt_port,
                keepalive=self.settings.mqtt_keepalive,
            )
            self.client.loop_forever()
        except Exception as exc:
            logger.warning("MQTT listener stopped: %s", exc)

    def on_connect(self, client: mqtt.Client, userdata, flags, reason_code, properties) -> None:
        logger.info("MQTT connected with reason code %s", reason_code)
        client.subscribe(self.settings.mqtt_topic)

    def on_message(self, client: mqtt.Client, userdata, msg: mqtt.MQTTMessage) -> None:
        try:
            payload = json.loads(msg.payload.decode("utf-8"))
        except Exception as exc:
            logger.warning("Failed to parse MQTT payload: %s", exc)
            return

        db: Session = SessionLocal()
        try:
            self.telemetry_service.ingest_payload(db, payload)
        except Exception as exc:
            logger.exception("Failed to ingest MQTT payload: %s", exc)
        finally:
            db.close()
