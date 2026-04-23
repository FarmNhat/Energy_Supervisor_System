import json
import time
import paho.mqtt.client as mqtt

BROKER    = "broker.hivemq.com"
PORT      = 1883
TOPIC     = "devices/control"
JSON_FILE = "input.json"

client = mqtt.Client()

def connect():
    client.connect(BROKER, PORT, 60)

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
        time.sleep(2)

if __name__ == "__main__":
    main()