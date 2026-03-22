from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class AuthRequest(BaseModel):
    username: str
    password: str


class UserRead(BaseModel):
    user_id: int
    username: str
    created_at: str | None = None


class AuthResponse(BaseModel):
    access_token: str
    user: UserRead


class ConfigUpdateRequest(BaseModel):
    overload_enabled: bool | None = None
    threshold_w: float | None = None
    automation_rules_json: dict[str, Any] | None = None


class TelemetryIngestRequest(BaseModel):
    temperature: float
    humidity: float
    light: float
    voltage: float
    timestamp: str | None = None
    scenario: str | None = None


class HealthResponse(BaseModel):
    status: str
    database: str
    mqtt_enabled: bool
    topic: str


class RealtimeMessage(BaseModel):
    event: str
    snapshot: dict[str, Any]
    alerts: list[dict[str, Any]]
    summary: dict[str, Any]
    recent_records: list[dict[str, Any]] = Field(default_factory=list)
    sent_at: datetime
