# Smart Plant Watering System with Encryption

Complete IoT plant watering system with ESP32 firmware, Node.js backend, React dashboard, and AI-powered watering predictions.

## Project Structure

```
Plant_Watering_with_Encryption/
├── src/                    # ESP32 firmware (C++)
├── include/                # Firmware headers
│   ├── credentials.h       # WiFi & MQTT config (gitignored)
│   └── credentials.h.template  # Template for credentials
├── backend/                # Node.js API + MQTT + WebSocket server
├── dashboard/              # React + Vite frontend
├── training/               # AI model training scripts
├── web_receiver/           # MQTT testing utilities
├── mqtt-config/            # Mosquitto MQTT broker config
├── platformio.ini          # PlatformIO configuration
├── docker-compose.yml      # Docker services setup
└── README.md               # This file
```

## Features

### ESP32 Firmware
- **Sensors:**
  - DHT22 (Temperature & Humidity)
  - Soil moisture sensor
  - Rain sensor
  - Water level/flow monitoring
- **Pump Control:**
  - Automatic mode (AI-driven)
  - Manual mode (user-controlled)
  - Configurable duration
- **Communication:**
  - WiFi connectivity with auto-reconnect
  - MQTT pub/sub with SHA-256 data integrity
  - Binary command protocol with hash verification
- **Security:**
  - Credentials stored separately (not committed to Git)
  - SHA-256 hash verification for commands and sensor data

### Backend Server
- RESTful API for sensor data and pump control
- Real-time WebSocket updates (Socket.IO)
- MQTT broker integration
- Binary command encoding/decoding
- SHA-256 hash generation for secure commands
- Mode switching (automatic/manual)
- CORS enabled for frontend

### Dashboard
- Real-time sensor monitoring with gauges
- Pump control interface with duration presets
- Mode switching (Auto/Manual)
- Historical data visualization
- Last watered timestamp tracking
- Responsive design (Tailwind CSS + React)

### AI Training Module
- Random Forest classifier for watering decisions
- Training data generation based on sensor thresholds
- Model persistence (joblib)
- Features: temperature, humidity, soil moisture, rain

## Prerequisites

- **Firmware:**
  - PlatformIO Core or VS Code with PlatformIO extension
  - ESP32 board (NodeMCU-32S or compatible)
  - USB cable for flashing
  - Required sensors (DHT22, soil moisture, rain sensor)

- **Backend:**
  - Node.js 18+ and npm
  - MQTT broker (Mosquitto recommended, or use HiveMQ Cloud)

- **Dashboard:**
  - Node.js 18+ and npm

- **AI Training (optional):**
  - Python 3.8+
  - pandas, scikit-learn, joblib

## Quick Start

### 1. Clone and Setup Credentials

```powershell
git clone https://github.com/long89kev/Plant_Watering_with_Encryption.git
cd Plant_Watering_with_Encryption
```

**Create credentials file for ESP32:**
```powershell
cp include\credentials.h.template include\credentials.h
```

Edit `include/credentials.h` with your WiFi and MQTT settings:
```cpp
static const char *WIFI_SSID = "YourWiFiSSID";
static const char *WIFI_PASS = "YourPassword";
static const char *MQTT_SERVER = "192.168.1.112";  // Your MQTT broker IP
static const uint16_t MQTT_PORT = 1883;
```

> **Note:** `credentials.h` is in `.gitignore` and will not be committed to Git.

### 2. Backend Setup

```powershell
cd backend
npm install
```

Create or edit `config.js`:
```javascript
export const mqttConfig = {
  brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
  topics: {
    data: process.env.MQTT_TOPIC_DATA || 'device/sensor/data',
    command: process.env.MQTT_TOPIC_COMMAND || 'device/command'
  },
  options: {
    clientId: 'smart-watering-server',
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
  }
};

```

Start backend:
```powershell
npm start
# or for development with auto-reload
npm run dev
```

Backend runs at:
- HTTP API: http://localhost:3001
- WebSocket: ws://localhost:3001

### 3. Dashboard Setup

```powershell
cd dashboard
npm install
```

Update `src/services/apiService.js` and `websocketService.js` if needed (default is `localhost:3001`).

Start dashboard:
```powershell
npm run dev
```

Dashboard runs at: http://localhost:5173

### 4. Firmware Setup

1. Open the project in VS Code with PlatformIO extension
2. Make sure `include/credentials.h` is configured (see step 1)
3. Connect ESP32 via USB
4. Build and upload:
   ```powershell
   pio run -t upload
   pio device monitor
   ```

Monitor output:
```powershell
pio device monitor
```

### 5. MQTT Broker Setup (Optional - Local Mosquitto)

**Using Docker:**
```powershell
docker-compose up -d
```

**Or install Mosquitto manually:**
```powershell
# Windows: Download from mosquitto.org
# Configure using mqtt-config/mosquitto.conf
```

## API Endpoints

### Health Check
```http
GET /api/health
```
Returns: `{ status: "OK", timestamp: ... }`

### Sensors
```http
GET /api/sensors
```
Returns:
```json
{
  "temp": 24.5,
  "hum": 65.0,
  "soil": 60.0,
  "level": 56.0,
  "flow": 0.0,
  "timestamp": 1234567890
}
```

### System Status
```http
GET /api/status
```
Returns:
```json
{
  "pumpRunning": false,
  "mode": "manual",
  "lastStartTime": null,
  "plannedDuration": 0
}
```

### Mode Control
```http
GET /api/mode
POST /api/mode
```
Request body:
```json
{ "mode": "automatic" }  // or "manual"
```

### Pump Control
```http
POST /api/pump/start
```
Request body:
```json
{ "duration": 10 }  // seconds
```

```http
POST /api/pump/stop
```

## MQTT Communication Protocol

### ESP32 → Backend (Sensor Data)
- **Topic:** `device/sensor/data`
- **Format:** Binary (52 bytes total)
  - Bytes 0-3: Temperature (float)
  - Bytes 4-7: Humidity (float)
  - Bytes 8-11: Soil moisture (float)
  - Bytes 12-15: Total water (float)
  - Bytes 16-19: Rain level (float)
  - Bytes 20-51: SHA-256 hash (32 bytes)

**Legacy JSON Format (if enabled):**
```json
{
  "temp": 24.5,
  "hum": 65.0,
  "soil": 60.0,
  "rain": 0.0,
  "water_ml": 1500.0
}
```

### Backend → ESP32 (Commands)
- **Topic:** `device/command`
- **Format:** Binary (38 bytes total)
  - Byte 0: Pump control (0=stop, 1=start)
  - Bytes 1-4: Duration (uint32_t, milliseconds)
  - Byte 5: Mode (0=manual, 1=automatic)
  - Bytes 6-37: SHA-256 hash (32 bytes)

**Hash Calculation:**
- Hash is computed over first 6 bytes (pump_control + duration + mode)
- ESP32 verifies hash before executing command
- Invalid hash = command rejected

### MQTT Topics Summary
| Direction | Topic | Format | Purpose |
|-----------|-------|--------|---------|
| ESP32 → Backend | `device/sensor/data` | Binary/JSON | Sensor readings |
| Backend → ESP32 | `device/command` | Binary | Pump control commands |

## Development Workflow

### Running Everything Locally

1. **Terminal 1 - MQTT Broker (if using local):**
   ```powershell
   docker-compose up
   # or run Mosquitto manually
   ```

2. **Terminal 2 - Backend:**
   ```powershell
   cd backend
   npm run dev
   ```

3. **Terminal 3 - Dashboard:**
   ```powershell
   cd dashboard
   npm run dev
   ```

4. **Terminal 4 - Firmware Monitor:**
   ```powershell
   pio device monitor
   ```

Access:
- Dashboard: http://localhost:5173
- Backend API: http://localhost:3001/api
- MQTT Broker: mqtt://localhost:1883

### Testing Without Hardware

**Test Backend API:**
```powershell
# Test sensor endpoint
curl http://localhost:3001/api/sensors

# Test mode switch
curl -X POST http://localhost:3001/api/mode -H "Content-Type: application/json" -d "{\"mode\":\"automatic\"}"

# Test pump start
curl -X POST http://localhost:3001/api/pump/start -H "Content-Type: application/json" -d "{\"duration\":10}"
```

**Simulate Sensor Data (Python):**
```powershell
cd web_receiver
python test.py
```

### AI Model Training

**Generate training data:**
```powershell
cd training
pip install -r requirement.txt
python pre_train.py
```

**Train the model:**
```powershell
python training.py
```

This creates `model.pkl` which can be integrated with the backend for automatic watering decisions.

## Configuration

### Credentials Management

**IMPORTANT:** Never commit `include/credentials.h` to Git!

1. Copy the template:
   ```powershell
   cp include\credentials.h.template include\credentials.h
   ```

2. Edit `include/credentials.h`:
   ```cpp
   static const char *WIFI_SSID = "YourNetworkName";
   static const char *WIFI_PASS = "YourPassword";
   static const char *MQTT_SERVER = "192.168.1.100";
   static const uint16_t MQTT_PORT = 1883;
   ```

3. The file is automatically ignored by Git (listed in `.gitignore`)

### Switching MQTT Broker

**ESP32 Firmware** (`include/credentials.h`):
```cpp
static const char *MQTT_SERVER = "broker.hivemq.com";  // Public broker
// or
static const char *MQTT_SERVER = "192.168.1.100";     // Local broker
```

**Backend** (`backend/config.js`):
```javascript
export const mqttConfig = {
  brokerUrl: 'mqtt://broker.hivemq.com:1883',  // Public broker
  // or
  brokerUrl: 'mqtt://192.168.1.100:1883',      // Local broker
};
```

### Communication Protocol Modes

In `src/taskMqtt.cpp`, choose between:

**Binary Mode (Current - Recommended):**
```cpp
//#define ENCRYPTION
#define NON_ENCRYPTION
```
- Uses binary protocol with SHA-256 hash verification
- More efficient and secure
- Backend automatically handles binary payloads

**JSON Mode (Legacy):**
```cpp
#define ENCRYPTION
//#define NON_ENCRYPTION
```
- Uses JSON format for commands
- Easier to debug but less secure
- Requires backend modifications to send JSON commands

## Security Features

### Data Integrity
- **SHA-256 Hash Verification:** All commands and sensor data include hash verification
- **Binary Protocol:** Reduces attack surface compared to plain JSON
- **Credential Isolation:** WiFi and MQTT credentials stored separately and gitignored

## Architecture Overview

```
┌─────────────┐         MQTT          ┌──────────────┐
│   ESP32     │◄─────────────────────►│   Backend    │
│  (Firmware) │  device/sensor/data   │  (Node.js)   │
│             │  device/command       │              │
└─────────────┘                       └──────┬───────┘
      │                                      │
      │                               WebSocket
      │ Sensors                              │
      ▼                                      ▼
┌─────────────┐                       ┌──────────────┐
│   DHT22     │                       │  Dashboard   │
│   Soil      │                       │   (React)    │
│   Rain      │                       │              │
│   Water     │                       └──────────────┘
│   Pump      │                       HTTP API (REST)
└─────────────┘
```

### Data Flow

1. **Sensor Reading:**
   - ESP32 reads sensors every 5 seconds
   - Computes SHA-256 hash of sensor data
   - Publishes binary payload to MQTT topic `device/sensor/data`

2. **Backend Processing:**
   - Receives sensor data via MQTT
   - Verifies hash integrity
   - Updates in-memory sensor state
   - Broadcasts to all WebSocket clients

3. **Dashboard Display:**
   - Receives real-time updates via WebSocket
   - Displays sensor values in gauges
   - Allows user to control pump

4. **Pump Control:**
   - User clicks button in dashboard
   - Dashboard sends HTTP POST to backend API
   - Backend creates binary command with SHA-256 hash
   - Publishes to MQTT topic `device/command`
   - ESP32 receives, verifies hash, executes command

## Production Deployment

### Backend
```powershell
# Install PM2 process manager
npm install -g pm2

# Start backend
cd backend
pm2 start server.js --name smart-watering

# Enable startup on boot
pm2 startup
pm2 save
```

### Dashboard
```powershell
cd dashboard
npm run build

# Serve with nginx or Apache
# Build output is in dashboard/dist/
```

### Firmware
- Set secure credentials in `include/credentials.h`
- Use local MQTT broker with authentication
- Enable TLS if possible
- Implement OTA updates for remote management
- Consider hardware security (secure boot, flash encryption)

### Infrastructure
- Use reverse proxy (nginx) for backend and dashboard
- Enable HTTPS with Let's Encrypt certificates
- Set up firewall rules (only allow necessary ports)
- Use VPN for remote access to local network
- Regular backups of configuration and data

## Hardware Requirements

### ESP32 Module
- ESP32-WROOM-32 or NodeMCU-32S
- Minimum 4MB flash
- WiFi capability

### Sensors
- **DHT22:** Temperature and humidity (±0.5°C, ±2-5% RH)
- **Soil Moisture:** Capacitive or resistive sensor
- **Rain Sensor:** Digital or analog rain detection module
- **Water Level/Flow:** Ultrasonic or flow meter sensor

### Actuator
- **Water Pump:** 5V/12V DC pump with relay module
- **Relay Module:** 5V relay (1-channel minimum)

### Power Supply
- 5V/2A USB power adapter for ESP32
- Separate 12V adapter if using 12V pump

### Wiring
Refer to pinout in source files:
- DHT22: GPIO pin (check `temp_humid_sensor.cpp`)
- Soil sensor: Analog pin
- Rain sensor: Digital/analog pin
- Pump relay: GPIO output pin

## Project Timeline & Development

This project was developed for the CO3091 course and includes:
- Embedded systems programming (FreeRTOS tasks)
- IoT communication protocols (MQTT, WebSocket)
- Full-stack web development (React + Node.js)
- Machine learning integration (Random Forest)
- Security implementation (SHA-256, secure credentials)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. **Never commit** `include/credentials.h` (it's gitignored)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Authors

- **Long Nguyen** - [long89kev](https://github.com/long89kev)
- **Nhat Pham** - [FarmNhat](https://github.com/FarmNhat)
- **Thang Tran** - [quocthangtrann](https://github.com/quocthangtrann)
- **V.Trung Nguyen** - [callmechung](https://github.com/callmechung)
- **H.Trung Nguyen** - [Texax1405](https://github.com/Texax1405)

## Acknowledgments

- ESP32 Arduino Framework
- PubSubClient MQTT library
- Socket.IO for real-time communication
- React and Vite for modern frontend
- Scikit-learn for ML capabilities

## Support & Contact

For issues and questions:
- Open an issue on GitHub
- Review Serial Monitor output for firmware debugging
- Monitor browser DevTools for frontend issues
