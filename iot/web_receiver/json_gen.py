import json
import time
import os
import paho.mqtt.client as mqtt

BROKER    = os.getenv("BROKER", "broker.hivemq.com")
PORT      = int(os.getenv("PORT", 1883))
TOPIC     = os.getenv("TOPIC", "sensors/data")
JSON_FILE = "sensors.json"

def write_json(data: dict):
    data["timestamp"] = time.strftime("%Y-%m-%d %H:%M:%S")
    with open(JSON_FILE, "w") as f:
        json.dump(data, f, indent=2)

def on_connect(client, userdata, flags, rc):
    print(f"Connected (rc={rc})")
    client.subscribe(TOPIC)

def on_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload.decode())
        write_json(data)
        print(f"[{data['timestamp']}]  "
              f"temp={data['temperature']}°C  "
              f"humid={data['humidity']}%  "
              f"light={data['light']}%  "
              f"volt={data['voltage']}V")
    except Exception as e:
        print(f"Parse error: {e}  raw: {msg.payload}")

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

client.connect(BROKER, PORT, keepalive=60)
client.loop_forever()