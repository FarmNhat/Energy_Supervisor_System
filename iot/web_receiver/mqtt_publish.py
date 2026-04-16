import json
import os
import time
import paho.mqtt.client as mqtt

BROKER = os.getenv("BROKER", "localhost")
PORT = int(os.getenv("PORT", "1883"))
TOPIC = os.getenv("TOPIC", "devices/control")
JSON_FILE = os.getenv("JSON_FILE", "input.json")
INTERVAL_SECONDS = float(os.getenv("INTERVAL_SECONDS", "2"))

try:
    client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION1)
except AttributeError:
    client = mqtt.Client()

def connect():
    while True:
        try:
            client.connect(BROKER, PORT, 60)
            print(f"Connected to {BROKER}:{PORT}. Publishing {JSON_FILE} to {TOPIC}.")
            return
        except Exception as exc:
            print(f"Connection error: {exc}. Retrying in 5 seconds...")
            time.sleep(5)

def publish_from_file():
    try:
        with open(JSON_FILE, "r") as f:
            data = json.load(f)

        payload = json.dumps(data)
        client.publish(TOPIC, payload)
        print("Published:", payload)

    except Exception as e:
        print("Error:", e)

def main():
    connect()
    while True:
        publish_from_file()
        time.sleep(INTERVAL_SECONDS)

if __name__ == "__main__":
    main()
