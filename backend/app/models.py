from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    config: Mapped[Config | None] = relationship(back_populates="user", uselist=False)
    assets: Mapped[list[Asset]] = relationship(back_populates="user")
    records: Mapped[list[Record]] = relationship(back_populates="user")


class Config(Base):
    __tablename__ = "configs"

    config_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), unique=True, nullable=False)
    overload_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    threshold_w: Mapped[float] = mapped_column(Float, default=1800.0, nullable=False)
    automation_rules_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped[User] = relationship(back_populates="config")


class Asset(Base):
    __tablename__ = "assets"

    asset_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    asset_type: Mapped[str] = mapped_column(String(80), nullable=False)
    location: Mapped[str | None] = mapped_column(String(120))
    relay_channel: Mapped[int | None] = mapped_column(Integer)
    hw_address: Mapped[str | None] = mapped_column(String(120), unique=True)
    state_cached: Mapped[str | None] = mapped_column(String(120))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    user: Mapped[User] = relationship(back_populates="assets")
    records: Mapped[list[Record]] = relationship(back_populates="asset")


class Record(Base):
    __tablename__ = "records"

    record_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.user_id"))
    asset_id: Mapped[int | None] = mapped_column(ForeignKey("assets.asset_id"))
    record_type: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    metric_key: Mapped[str] = mapped_column("key", String(80), nullable=False, index=True)
    value: Mapped[float | None] = mapped_column(Float)
    unit: Mapped[str | None] = mapped_column(String(32))
    status: Mapped[str | None] = mapped_column(String(64))
    payload_json: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    user: Mapped[User | None] = relationship(back_populates="records")
    asset: Mapped[Asset | None] = relationship(back_populates="records")
