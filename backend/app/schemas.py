from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class UserBase(BaseModel):
    username: str


class UserCreate(UserBase):
    password: str


class UserLogin(UserBase):
    password: str


class AuthRequest(UserBase):
    password: str


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)
    user_id: int
    created_at: datetime | None = None


class LoginResponse(BaseModel):
    access_token: str
    user: UserRead


AuthResponse = LoginResponse


class ConfigUpdateRequest(BaseModel):
    overload_enabled: bool | None = None
    threshold_w: float | None = None
    automation_rules_json: dict[str, Any] | None = None


class TelemetryIngestRequest(BaseModel):
    temperature: float | None = None
    humidity: float | None = None
    light: float | None = None
    voltage: float | None = None
    timestamp: str | None = None
    scenario: str | None = None
    sensor_enabled: dict[str, bool | int | str] | None = None
    enabled_sensors: list[str] | None = None
    disabled_sensors: list[str] | None = None


class DeviceControlRequest(BaseModel):
    device1: int | None = Field(default=None, ge=0, le=1)
    device2: int | None = Field(default=None, ge=0, le=1)
    device3: int | None = Field(default=None, ge=0, le=1)


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
