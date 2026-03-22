from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from fastapi import WebSocket

from .schemas import RealtimeMessage


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: list[WebSocket] = []
        self._loop: asyncio.AbstractEventLoop | None = None

    def attach_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self._connections = [connection for connection in self._connections if connection != websocket]

    async def broadcast(self, message: RealtimeMessage) -> None:
        stale_connections: list[WebSocket] = []
        for connection in self._connections:
            try:
                await connection.send_json(message.model_dump(mode="json"))
            except Exception:
                stale_connections.append(connection)

        for connection in stale_connections:
            self.disconnect(connection)

    def broadcast_from_thread(self, message: RealtimeMessage) -> None:
        if self._loop is None:
            return
        asyncio.run_coroutine_threadsafe(self.broadcast(message), self._loop)


connection_manager = ConnectionManager()


def build_realtime_message(
    *,
    snapshot: dict,
    alerts: list[dict],
    summary: dict,
    recent_records: list[dict],
) -> RealtimeMessage:
    return RealtimeMessage(
        event="telemetry.update",
        snapshot=snapshot,
        alerts=alerts,
        summary=summary,
        recent_records=recent_records,
        sent_at=datetime.now(timezone.utc),
    )
