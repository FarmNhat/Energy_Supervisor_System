from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import register_routes
from .bootstrap import seed_default_data
from .core.settings import get_settings
from .db import SessionLocal, engine
from .models import Base
from .mqtt_listener import mqtt_subscriber
from .realtime import connection_manager

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        seed_default_data(session)

    connection_manager.attach_loop(asyncio.get_running_loop())
    mqtt_subscriber.start()
    try:
        yield
    finally:
        mqtt_subscriber.stop()


app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
register_routes(app)
