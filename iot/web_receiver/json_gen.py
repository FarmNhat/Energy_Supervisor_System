import json
import time
import os
import paho.mqtt.client as mqtt

# Configuration from environment variables for flexible deployment
# MOCK: Use localhost and port 1883 for local testing
# REAL: Change BROKER to your external MQTT broker (e.g., broker.hivemq.com)
BROKER    = os.getenv("BROKER", "localhost")
PORT      = int(os.getenv("PORT", "1883"))
TOPIC     = os.getenv("TOPIC", "sensors/data")
JSON_FILE = os.getenv("JSON_FILE", "sensors.json")

def write_json(data: dict):
    # Ensure timestamp is present for frontend synchronization
    if "timestamp" not in data:
        data["timestamp"] = time.strftime("%Y-%m-%d %H:%M:%S")
    
    try:
        with open(JSON_FILE, "w") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Failed to write JSON: {e}")

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"Connected successfully to {BROKER}:{PORT}")
        client.subscribe(TOPIC)
        print(f"Subscribed to topic: {TOPIC}")
    else:
        print(f"Connection failed with code {rc}")

def on_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload.decode())
        write_json(data)
        # Unified log format for tracking telemetry
        ts = data.get("timestamp", time.strftime("%H:%M:%S"))
        print(f"[{ts}]  "
              f"temp={data.get('temperature')}°C  "
              f"humid={data.get('humidity')}%  "
              f"light={data.get('light')}%  "
              f"volt={data.get('voltage')}V")
    except Exception as e:
        print(f"Parse error: {e} | raw: {msg.payload}")

# Use VERSION1 for paho-mqtt 1.x compatibility if needed, 
# but paho-mqtt 2.x supports callback_api_version
try:
    client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION1)
except AttributeError:
    # Fallback for older paho-mqtt versions
    client = mqtt.Client()

client.on_connect = on_connect
client.on_message = on_message

print(f"Starting bridge. Listening for {TOPIC} on {BROKER}...")

# Retry logic for connection
connected = False
while not connected:
    try:
        client.connect(BROKER, PORT, keepalive=60)
        connected = True
    except Exception as e:
        print(f"Connection error: {e}. Retrying in 5 seconds...")
        print(f"Hint: Ensure Mosquitto is running (docker-compose up -d mosquitto)")
        time.sleep(5)

client.loop_forever()
