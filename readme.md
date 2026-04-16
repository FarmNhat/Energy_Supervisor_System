# Energy Supervisor System

Fixed 4-sensor energy supervisor with:

- FastAPI backend on `http://localhost:8000`
- PostgreSQL database on `localhost:5432`
- Mosquitto MQTT broker on `localhost:1883`
- React/Vite frontend on `http://localhost:5173`
- Mock IoT publisher for local telemetry testing
- Device control flow through `iot/web_receiver/input.json` and MQTT topic `devices/control`

## 1. Prerequisites

Install these before running the project:

- Docker and Docker Compose
- Node.js 20+
- `uv`

Check versions:

```bash
docker --version
docker compose version
node --version
uv --version
```

## 2. Local Deploy

Run all backend-side services from the repository root:

```bash
docker compose -f backend/docker-compose.yml up -d --build db mosquitto backend
```

This starts:

- PostgreSQL: `localhost:5432`
- Mosquitto MQTT: `localhost:1883`
- FastAPI backend: `http://localhost:8000`

Check containers:

```bash
docker compose -f backend/docker-compose.yml ps
```

Check backend health:

```bash
curl -sS http://localhost:8000/health
```

Expected result:

```json
{
  "status": "ok",
  "database": "ok",
  "mqtt_enabled": true,
  "topic": "sensors/data"
}
```

Default operator login:

- Username: `operator`
- Password: `operator123`

## 3. Backend API Quick Test

Main endpoints:

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/dashboard/overview`
- `POST /api/telemetry/ingest`
- `GET /api/assets`
- `GET /api/alerts/recent`
- `GET /api/control/devices`
- `PUT /api/control/devices`
- `GET /api/reports/export`
- `PUT /api/config/current`
- `ws://localhost:8000/ws/realtime`

Login test:

```bash
curl -sS -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"operator","password":"operator123"}'
```

Dashboard API test:

```bash
curl -sS http://localhost:8000/api/dashboard/overview
```

Recent alerts test:

```bash
curl -sS http://localhost:8000/api/alerts/recent
```

## 4. Local IoT Setup

Create the IoT virtual environment once from the repository root:

```bash
uv venv .venv-iot
uv pip install --python .venv-iot/bin/python -r iot/requirements.txt
```

Important broker rule:

- Backend container connects to Mosquitto using `MQTT_BROKER_HOST=mosquitto`.
- Host-side scripts connect to the same Mosquitto broker using `BROKER=localhost`.
- Real ESP32 devices must connect to your computer LAN IP, not `localhost`.

## 5. Local Mock Telemetry Test

The backend subscribes directly to `sensors/data`, so the main local telemetry test only needs the mock publisher.

Start the mock device publisher:

```bash
cd iot/web_receiver
BROKER=localhost TOPIC=sensors/data uv run --python ../../.venv-iot/bin/python mock_device.py
```

Test with one or more disabled sensors:

```bash
cd iot/web_receiver
MOCK_DISABLED_SENSORS=humidity BROKER=localhost TOPIC=sensors/data uv run --python ../../.venv-iot/bin/python mock_device.py
```

Test rotating disabled sensors:

```bash
cd iot/web_receiver
MOCK_ROTATE_DISABLED=1 BROKER=localhost TOPIC=sensors/data uv run --python ../../.venv-iot/bin/python mock_device.py
```

The mock publisher sends telemetry to:

```text
sensors/data
```

The telemetry payload shape is:

```json
{
  "temperature": 28.5,
  "humidity": 72.0,
  "light": 91.5,
  "voltage": 3.85,
  "timestamp": "2026-04-16T14:30:00",
  "scenario": "critical_event",
  "sensor_enabled": {
    "temperature": true,
    "humidity": true,
    "light": true,
    "voltage": true
  },
  "disabled_sensors": []
}
```

Sensor-to-device mapping used by backend alerts and the Live monitor:

- Temperature: `device1`
- Humidity: `device2`
- Light: `device3`
- Voltage: `device4`

When a sensor is disabled, the backend keeps it visible in the snapshot but skips threshold alerts for that channel.

After the mock starts, verify the backend is receiving data:

```bash
curl -sS http://localhost:8000/api/dashboard/overview
curl -sS http://localhost:8000/api/alerts/recent
```

If alerts do not appear immediately, wait for a few mock packets. The mock cycles through normal and abnormal sensor scenarios.

Optional: run the MQTT-to-JSON bridge only if you also want to update `iot/web_receiver/sensors.json` for fallback/debug testing:

```bash
cd iot/web_receiver
BROKER=localhost PORT=1883 TOPIC=sensors/data uv run --python ../../.venv-iot/bin/python json_gen.py
```

## 6. Device Control Test

The frontend device toggles call the backend, and the backend does two things:

- Writes the latest control state to `iot/web_receiver/input.json`
- Publishes the same control state to MQTT topic `devices/control`

Control file:

```text
iot/web_receiver/input.json
```

Control payload:

```json
{
  "device1": 0,
  "device2": 1,
  "device3": 1
}
```

Read current control state:

```bash
curl -sS http://localhost:8000/api/control/devices
```

Change device state:

```bash
curl -sS -X PUT http://localhost:8000/api/control/devices \
  -H "Content-Type: application/json" \
  -d '{"device1":1,"device2":0,"device3":1}'
```

Check that the file changed:

```bash
cat iot/web_receiver/input.json
```

Optional: run the standalone control publisher only if you want to repeatedly publish the file contents without using the backend API:

```bash
cd iot/web_receiver
BROKER=localhost PORT=1883 TOPIC=devices/control uv run --python ../../.venv-iot/bin/python mqtt_publish.py
```

Normal local development does not need this optional process because the backend already publishes control messages when the dashboard toggles a device.

## 7. Frontend Deploy

Install dependencies once:

```bash
cd frontend
npm install
```

Run the frontend:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

Login with:

- Username: `operator`
- Password: `operator123`

Frontend checks:

- Dashboard shows 4 fixed sensor cards: temperature, humidity, light, voltage.
- Live monitor updates when `mock_device.py` publishes data.
- Alert stream updates when sensor values cross thresholds.
- Device control panel shows `device1`, `device2`, and `device3`.
- Toggling a device updates `iot/web_receiver/input.json`.

Build test:

```bash
cd frontend
npm run build
```

## 8. Real ESP32 Test

Use this when replacing `mock_device.py` with a real device.

### 8.1 Find Your Computer IP

On Linux:

```bash
hostname -I
```

Pick the LAN IP, for example:

```text
192.168.1.50
```

Do not use `localhost` or `127.0.0.1` on the ESP32. On the ESP32, those addresses mean the ESP32 itself.

### 8.2 ESP32 MQTT Settings

Set the ESP32 MQTT config to:

```text
MQTT broker host: <your-computer-lan-ip>
MQTT broker port: 1883
Telemetry publish topic: sensors/data
Control subscribe topic: devices/control
```

Example:

```text
MQTT broker host: 192.168.1.50
MQTT broker port: 1883
Telemetry publish topic: sensors/data
Control subscribe topic: devices/control
```

### 8.3 ESP32 Telemetry Payload

The ESP32 should publish JSON to `sensors/data`:

```json
{
  "temperature": 25.4,
  "humidity": 51.2,
  "light": 64.0,
  "voltage": 3.31,
  "timestamp": "2026-04-16T14:30:00"
}
```

Required fields:

- `temperature`: number, Celsius
- `humidity`: number, percent
- `light`: number, relative percent
- `voltage`: number, volts

Optional fields:

- `timestamp`: ISO-like string
- `scenario`: debug label

If the ESP32 cannot provide a timestamp, the backend/bridge can still process the packet, but sending one is better for debugging.

### 8.4 ESP32 Control Payload

The ESP32 should subscribe to `devices/control` and parse:

```json
{
  "device1": 1,
  "device2": 0,
  "device3": 1
}
```

Expected meaning:

- `1`: turn the output ON
- `0`: turn the output OFF

Recommended GPIO mapping if using the current teammate convention:

- `device1`: GPIO 25
- `device2`: GPIO 26
- `device3`: GPIO 27

If your real board uses different pins, keep the JSON keys the same and only change the ESP32 pin mapping.

### 8.5 What To Change For Real Device

If the ESP32 and backend use the local Docker Mosquitto broker, keep backend config unchanged:

```yaml
MQTT_BROKER_HOST: mosquitto
MQTT_BROKER_PORT: 1883
MQTT_TOPIC: sensors/data
MQTT_CONTROL_TOPIC: devices/control
```

Only change the ESP32 broker host to your computer LAN IP.

If using an external cloud broker, change `backend/docker-compose.yml`:

```yaml
MQTT_BROKER_HOST: broker.hivemq.com
MQTT_BROKER_PORT: 1883
MQTT_TOPIC: sensors/data
MQTT_CONTROL_TOPIC: devices/control
```

Then restart backend:

```bash
docker compose -f backend/docker-compose.yml up -d --build backend
```

Also change the ESP32 to use the same external broker host and topics.

### 8.6 Real Device End-To-End Test

1. Start Docker services:

```bash
docker compose -f backend/docker-compose.yml up -d --build db mosquitto backend
```

2. Start frontend:

```bash
cd frontend
npm run dev
```

3. Flash/run ESP32 with:

```text
broker=<your-computer-lan-ip>
port=1883
publish=sensors/data
subscribe=devices/control
```

4. Open frontend:

```text
http://localhost:5173
```

5. Confirm telemetry appears on the dashboard.

6. Toggle `device1`, `device2`, or `device3` in the dashboard.

7. Confirm the physical output changes on the ESP32.

8. Confirm backend state:

```bash
curl -sS http://localhost:8000/api/control/devices
cat iot/web_receiver/input.json
```

## 9. Troubleshooting

Connection refused on MQTT port `1883`:

```bash
docker compose -f backend/docker-compose.yml up -d mosquitto
docker compose -f backend/docker-compose.yml logs -f mosquitto
```

Backend is unreachable:

```bash
docker compose -f backend/docker-compose.yml logs -f backend
curl -sS http://localhost:8000/health
```

Frontend login fails:

- Confirm backend is running.
- Use username `operator` and password `operator123`.
- Rebuild backend if schemas or auth code changed:

```bash
docker compose -f backend/docker-compose.yml up -d --build backend
```

ESP32 cannot connect to MQTT:

- Confirm ESP32 and computer are on the same Wi-Fi/LAN.
- Confirm the ESP32 uses your computer LAN IP, not `localhost`.
- Confirm port `1883` is not blocked by firewall.
- Confirm Mosquitto is running with `docker compose -f backend/docker-compose.yml ps`.

Dashboard receives no live data:

- Confirm `mock_device.py` or the ESP32 is publishing to `sensors/data`.
- Confirm backend health shows `"mqtt_enabled": true`.
- Check backend logs:

```bash
docker compose -f backend/docker-compose.yml logs -f backend
```

Device toggles update the UI but not the real output:

- Confirm ESP32 subscribes to `devices/control`.
- Confirm ESP32 parses `device1`, `device2`, and `device3` as integers.
- Confirm backend control API reports `"published": true`:

```bash
curl -sS http://localhost:8000/api/control/devices
```

Stop all services:

```bash
docker compose -f backend/docker-compose.yml down
```

Stop services and delete local database volume:

```bash
docker compose -f backend/docker-compose.yml down -v
```
