# Energy Supervisor System

## 1. Start Backend Services

From the repository root:

```bash
docker compose -f backend/docker-compose.yml up -d --build db mosquitto backend
```

This starts:

- PostgreSQL on `localhost:5432`
- Mosquitto on `localhost:1883`
- FastAPI on `http://localhost:8000`


Key API endpoints:

- `GET http://localhost:8000/health`
- `POST http://localhost:8000/api/auth/register`
- `POST http://localhost:8000/api/auth/login`
- `GET http://localhost:8000/api/dashboard/overview`
- `POST http://localhost:8000/api/telemetry/ingest`
- `GET http://localhost:8000/api/assets`
- `GET http://localhost:8000/api/alerts/recent`
- `GET http://localhost:8000/api/reports/export`
- `PUT http://localhost:8000/api/config/current`

Default seeded operator:

- Username: `operator`
- Password: `operator123`

## 2. Start IoT

### Linux / macOS

Install the IoT Python dependency once with `uv`:

```bash
uv venv .venv-iot
uv pip install --python .venv-iot/bin/python -r iot/requirements.txt
```

Start the MQTT-to-JSON bridge:

```bash
cd iot/web_receiver
BROKER=localhost PORT=1883 TOPIC=sensors/data uv run --python ../../.venv-iot/bin/python json_gen.py
```

Serve the fallback JSON endpoint:

```bash
cd iot/web_receiver
uv run --python ../../.venv-iot/bin/python server.py
```

Publish mock sensor data:

```bash
cd iot/web_receiver
BROKER=localhost TOPIC=sensors/data uv run --python ../../.venv-iot/bin/python mock_device.py
```

### Windows (PowerShell)

Ensure you have `uv` installed (`pip install uv`). Install the IoT dependencies:

```powershell
uv venv .venv-iot
uv pip install --python .venv-iot/Scripts/python.exe -r iot/requirements.txt
```

Start the MQTT-to-JSON bridge:

```powershell
cd iot/web_receiver
$env:BROKER="localhost"; $env:PORT="1883"; $env:TOPIC="sensors/data"; uv run --python ../../.venv-iot/Scripts/python.exe json_gen.py
```

Serve the fallback JSON endpoint:

```powershell
cd iot/web_receiver
uv run --python ../../.venv-iot/Scripts/python.exe server.py
```

Publish mock sensor data:

```powershell
cd iot/web_receiver
$env:BROKER="localhost"; $env:TOPIC="sensors/data"; uv run --python ../../.venv-iot/Scripts/python.exe mock_device.py
```

---

The fallback receiver is then available at `http://localhost:8080/sensors.json`.

When the real ESP32 device is ready, publish the same MQTT payload shape to `sensors/data` and the backend/frontend can use it without further changes. The current mock payload is:

```json
{
  "temperature": 23.7,
  "humidity": 45.2,
  "light": 68.4,
  "voltage": 3.3,
  "timestamp": "2026-03-22T14:45:00"
}
```

## 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Default Thresholds

- Temperature: `20.0` to `26.0 C`
- Humidity: `40.0` to `60.0 %`
- Light: `30.0` to `80.0 %`
- Voltage: `3.0` to `3.6 V`

Update thresholds with:

```bash
curl -X PUT http://localhost:8000/api/config/current \
  -H "Content-Type: application/json" \
  -d '{
    "automation_rules_json": {
      "temperature": { "min": 19.0, "max": 29.0, "unit": "C" },
      "humidity": { "min": 30.0, "max": 65.0, "unit": "%" },
      "light": { "min": 20.0, "max": 90.0, "unit": "%" },
      "voltage": { "min": 3.0, "max": 3.6, "unit": "V" }
    }
  }'
```

## Local Verification

### Linux / macOS

Backend:

```bash
uv venv backend/.venv
uv pip install --python backend/.venv/bin/python -r backend/requirements.txt
uv run --python backend/.venv/bin/python backend/scripts/smoke_test.py
uv run --python backend/.venv/bin/python backend/scripts/verify_backend.py
```

### Windows (PowerShell)

Backend:

```powershell
uv venv backend/.venv
uv pip install --python backend/.venv/Scripts/python.exe -r backend/requirements.txt
uv run --python backend/.venv/Scripts/python.exe backend/scripts/smoke_test.py
uv run --python backend/.venv/Scripts/python.exe backend/scripts/verify_backend.py
```

---

Frontend:

```bash
cd frontend
npm run build
```
