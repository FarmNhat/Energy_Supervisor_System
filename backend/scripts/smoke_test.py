from __future__ import annotations

from pathlib import Path
import sys

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.app.bootstrap import seed_default_data
from backend.app.models import Base
from backend.app.services import TelemetryService


def main() -> None:
    db_path = Path(__file__).resolve().parents[1] / ".smoke_test.db"
    if db_path.exists():
        db_path.unlink()

    engine = create_engine(f"sqlite:///{db_path}", future=True, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, expire_on_commit=False, future=True)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        seed_default_data(db)
        overview = TelemetryService.ingest_payload(
            db,
            {
                "temperature": 28.4,
                "humidity": 48.2,
                "light": 74.0,
                "voltage": 3.3,
                "timestamp": "2026-03-22T12:00:00+00:00",
            },
        )
    finally:
        db.close()

    assert overview["metrics"]["temperature"] == 28.4
    assert overview["summary"]["update_count"] >= 1
    assert any(alert["key"] == "temperature" for alert in overview["alerts"]), "temperature alert missing"
    print("smoke_test: ok")


if __name__ == "__main__":
    main()
