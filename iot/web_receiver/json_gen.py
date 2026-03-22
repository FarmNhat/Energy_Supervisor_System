import json
import os
import time
from pathlib import Path

import paho.mqtt.client as mqtt

BROKER = os.getenv("BROKER", "broker.hivemq.com")
PORT = int(os.getenv("PORT", "1883"))
TOPIC = os.getenv("TOPIC", "sensors/data")
JSON_FILE = Path(__file__).resolve().parent / "sensors.json"

def write_json(data: dict):
    data["timestamp"] = time.strftime("%Y-%m-%d %H:%M:%S")
    with JSON_FILE.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def on_connect(client, userdata, flags, reason_code, properties=None):
    print(f"Connected (rc={reason_code})")
    client.subscribe(TOPIC)

def on_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload.decode())
        write_json(data)
        print(
            f"[{data['timestamp']}]  "
            f"temp={data['temperature']}°C  "
            f"humid={data['humidity']}%  "
            f"light={data['light']}%  "
            f"volt={data['voltage']}V"
        )
    except Exception as e:
        print(f"Parse error: {e}  raw: {msg.payload}")

def run_receiver():
    while True:
        client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
        client.on_connect = on_connect
        client.on_message = on_message

        try:
            print(f"Connecting to MQTT broker {BROKER}:{PORT} on topic {TOPIC}...")
            client.connect(BROKER, PORT, keepalive=60)
            client.loop_forever()
        except KeyboardInterrupt:
            raise
        except Exception as exc:
            print(f"MQTT connection failed: {exc}")
            print(
                "Start the broker first with "
                "`docker compose -f backend/docker-compose.yml up -d mosquitto` "
                "or point BROKER/PORT to a running MQTT service.",
            )
            time.sleep(2)
        finally:
            try:
                client.loop_stop()
                client.disconnect()
            except Exception:
                pass


if __name__ == "__main__":
    run_receiver()
