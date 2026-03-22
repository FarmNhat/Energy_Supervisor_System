from __future__ import annotations

import json
import logging

import paho.mqtt.client as mqtt

from .core.settings import get_settings
from .db import SessionLocal
from .realtime import build_realtime_message, connection_manager
from .services import DashboardService, TelemetryService

logger = logging.getLogger(__name__)
settings = get_settings()


class MQTTSubscriber:
    def __init__(self) -> None:
        self.client = mqtt.Client(
            callback_api_version=mqtt.CallbackAPIVersion.VERSION1,
            client_id=settings.mqtt_client_id,
        )
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message

    def start(self) -> None:
        if settings.disable_mqtt:
            logger.info("MQTT subscriber disabled by configuration")
            return
        try:
            self.client.connect(settings.mqtt_broker_host, settings.mqtt_broker_port, settings.mqtt_keepalive)
            self.client.loop_start()
            logger.info("MQTT subscriber connected to %s:%s", settings.mqtt_broker_host, settings.mqtt_broker_port)
        except Exception as exc:
            logger.warning("MQTT subscriber failed to connect: %s", exc)

    def stop(self) -> None:
        try:
            self.client.loop_stop()
            self.client.disconnect()
        except Exception:
            return

    def _on_connect(self, client, userdata, flags, rc):  # noqa: ANN001
        if rc == 0:
            client.subscribe(settings.mqtt_topic)
            logger.info("Subscribed to MQTT topic %s", settings.mqtt_topic)
        else:
            logger.warning("MQTT connection failed with rc=%s", rc)

    def _on_message(self, client, userdata, msg):  # noqa: ANN001
        try:
            payload = json.loads(msg.payload.decode("utf-8"))
            with SessionLocal() as session:
                TelemetryService.ingest_payload(session, payload)
                overview = DashboardService.overview(session, limit=10)
                connection_manager.broadcast_from_thread(
                    build_realtime_message(
                        snapshot=overview["metrics"],
                        alerts=overview["alerts"],
                        summary=overview["summary"],
                        recent_records=overview["recent_samples"],
                    )
                )
        except Exception as exc:
            logger.exception("Failed to ingest MQTT payload: %s", exc)


mqtt_subscriber = MQTTSubscriber()
