from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Energy Supervisor Backend"
    database_url: str = "sqlite:///./backend/energy_supervisor.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    mqtt_broker_host: str = "broker.hivemq.com"
    mqtt_broker_port: int = 1883
    mqtt_topic: str = "sensors/data"
    mqtt_client_id: str = "energy-supervisor-backend"
    mqtt_keepalive: int = 60
    poll_interval_seconds: int = 2
    alert_stale_after_seconds: int = 10
    seed_username: str = "operator"
    seed_password: str = "operator123"
    disable_mqtt: bool = False

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
