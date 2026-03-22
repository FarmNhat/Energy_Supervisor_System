import paho.mqtt.publish as publish
import time
import json
import random
import os

BROKER = os.getenv("BROKER", "broker.hivemq.com")
TOPIC = os.getenv("TOPIC", "sensors/data")
INTERVAL_SECONDS = float(os.getenv("INTERVAL_SECONDS", "2"))

SCENARIOS = [
    {
        "name": "stable_window",
        "temperature": (22.4, 24.8),
        "humidity": (44.0, 54.0),
        "light": (46.0, 72.0),
        "voltage": (3.24, 3.42),
    },
    {
        "name": "heat_rise",
        "temperature": (27.4, 31.8),
        "humidity": (54.0, 63.0),
        "light": (70.0, 82.0),
        "voltage": (3.28, 3.46),
    },
    {
        "name": "humidity_surge",
        "temperature": (23.4, 25.6),
        "humidity": (66.0, 79.0),
        "light": (42.0, 67.0),
        "voltage": (3.18, 3.36),
    },
    {
        "name": "glare_spike",
        "temperature": (24.6, 27.0),
        "humidity": (46.0, 57.0),
        "light": (84.0, 98.0),
        "voltage": (3.30, 3.50),
    },
    {
        "name": "voltage_drop",
        "temperature": (22.0, 24.2),
        "humidity": (41.0, 52.0),
        "light": (36.0, 60.0),
        "voltage": (2.74, 2.96),
    },
    {
        "name": "critical_event",
        "temperature": (29.8, 33.8),
        "humidity": (69.0, 84.0),
        "light": (88.0, 100.0),
        "voltage": (3.82, 4.08),
    },
]


def sample_metric(bounds):
    return round(random.uniform(bounds[0], bounds[1]), 1)

print(f"Starting mock device. Publishing to {TOPIC} on {BROKER}...")

tick = 0
while True:
    scenario = SCENARIOS[tick % len(SCENARIOS)]
    data = {
        "temperature": sample_metric(scenario["temperature"]),
        "humidity": sample_metric(scenario["humidity"]),
        "light": sample_metric(scenario["light"]),
        "voltage": round(random.uniform(scenario["voltage"][0], scenario["voltage"][1]), 2),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "scenario": scenario["name"],
    }

    payload = json.dumps(data)
    print(f"Publishing {scenario['name']}: {payload}")

    try:
        publish.single(TOPIC, payload=payload, hostname=BROKER)
    except Exception as e:
        print(f"Failed to publish: {e}")

    tick += 1
    time.sleep(INTERVAL_SECONDS)
