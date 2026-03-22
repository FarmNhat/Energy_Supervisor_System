from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

os.environ.setdefault("DATABASE_URL", f"sqlite:///{Path('backend_verify.db').resolve()}")
os.environ.setdefault("DISABLE_MQTT", "1")

from backend.app.api import assets, dashboard_overview, healthcheck, ingest_telemetry, login_user, recent_alerts, recent_records, register_user, update_config  # noqa: E402
from backend.app.bootstrap import seed_default_data  # noqa: E402
from backend.app.db import SessionLocal, engine  # noqa: E402
from backend.app.models import Base  # noqa: E402
from backend.app.realtime import build_realtime_message  # noqa: E402
from backend.app.schemas import AuthRequest, ConfigUpdateRequest, TelemetryIngestRequest  # noqa: E402
from backend.app.services import DashboardService, TelemetryService  # noqa: E402
from backend.app.main import app  # noqa: E402


async def main() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        seed_default_data(session)
        TelemetryService.ingest_payload(
            session,
            {
                "temperature": 31.2,
                "humidity": 48.5,
                "light": 67.0,
                "voltage": 3.3,
            },
        )

    async with app.router.lifespan_context(app):
        response = healthcheck()
        assert response.status == "ok"
        assert response.database == "ok"

        with SessionLocal() as session:
            registered = register_user(AuthRequest(username="mock@example.com", password="secret123"), session=session)
            assert registered.user.username == "mock@example.com"

            logged_in = login_user(AuthRequest(username="mock@example.com", password="secret123"), session=session)
            assert logged_in.access_token

            overview = dashboard_overview(limit=4, session=session)
            assert "summary" in overview and "metrics" in overview
            assert overview["summary"]["update_count"] >= 1
            assert overview["metrics"]["temperature"] == 31.2
            assert len(overview["assets"]) == 4
            assert len(overview["recent_samples"]) >= 1

            records_payload = recent_records(limit=4, session=session)
            assert len(records_payload["items"]) >= 1

            assets_payload = assets(session=session)
            assert len(assets_payload["items"]) == 4

            alerts_payload = recent_alerts(limit=4, session=session)
            assert len(alerts_payload["items"]) >= 1

            ingested = ingest_telemetry(
                payload=TelemetryIngestRequest(
                    temperature=29.1,
                    humidity=44.0,
                    light=62.0,
                    voltage=3.2,
                    timestamp="2026-03-22T14:33:00+00:00",
                ),
                session=session,
            )
            assert ingested["metrics"]["temperature"] == 29.1

            updated = update_config(
                payload=ConfigUpdateRequest(
                    automation_rules_json={
                        "temperature": {"min": 19.0, "max": 29.0, "unit": "C"},
                        "humidity": {"min": 30.0, "max": 65.0, "unit": "%"},
                        "light": {"min": 20.0, "max": 90.0, "unit": "%"},
                        "voltage": {"min": 3.0, "max": 3.6, "unit": "V"},
                    }
                ),
                session=session,
            )
            assert updated["config_summary"]["automation_rules_json"]["temperature"]["max"] == 29.0

            report_payload = DashboardService.export_report_csv(session, limit=10)
            assert "timestamp,temperature,humidity,light,voltage" in report_payload

            realtime_message = build_realtime_message(
                snapshot=overview["metrics"],
                alerts=overview["alerts"],
                summary=overview["summary"],
                recent_records=overview["recent_samples"],
            )
            assert realtime_message.event == "telemetry.update"
            assert realtime_message.summary["connection_state"] in {"live", "stale", "offline"}

    print("Backend verification passed.")


if __name__ == "__main__":
    asyncio.run(main())
