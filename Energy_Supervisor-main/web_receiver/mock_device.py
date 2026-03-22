import paho.mqtt.publish as publish
import time
import json
import random

BROKER = "broker.hivemq.com"
TOPIC = "sensors/data"

print(f"Starting mock device. Publishing to {TOPIC} on {BROKER}...")

while True:
    data = {
        "temperature": round(random.uniform(68.0, 74.0), 1),
        "humidity": round(random.uniform(40.0, 50.0), 1),
        "light": round(random.uniform(60.0, 90.0), 1),
        "voltage": 3.3
    }
    
    payload = json.dumps(data)
    print(f"Publishing: {payload}")
    
    try:
        publish.single(TOPIC, payload=payload, hostname=BROKER)
    except Exception as e:
        print(f"Failed to publish: {e}")
        
    time.sleep(2)
