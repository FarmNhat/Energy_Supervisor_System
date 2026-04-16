import paho.mqtt.publish as publish
import time
import json
import random
import os

# Configuration from environment variables
# MOCK: Defaults to localhost for local Mosquitto
# REAL: Set BROKER=broker.hivemq.com to test against external broker
BROKER = os.getenv("BROKER", "localhost")
TOPIC = os.getenv("TOPIC", "sensors/data")
INTERVAL_SECONDS = float(os.getenv("INTERVAL_SECONDS", "2"))
DISABLED_SENSORS = {
    item.strip().lower()
    for item in os.getenv("MOCK_DISABLED_SENSORS", "").split(",")
    if item.strip()
}
ROTATE_DISABLED = os.getenv("MOCK_ROTATE_DISABLED", "0").strip().lower() in {"1", "true", "yes", "on"}
SENSOR_KEYS = ("temperature", "humidity", "light", "voltage")

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

def disabled_for_tick(tick):
    disabled = set(DISABLED_SENSORS)
    if ROTATE_DISABLED:
        disabled.add(SENSOR_KEYS[tick % len(SENSOR_KEYS)])
    return disabled

print(f"Starting mock device. Publishing to {TOPIC} on {BROKER}...")
if DISABLED_SENSORS:
    print(f"Static disabled sensors: {', '.join(sorted(DISABLED_SENSORS))}")
if ROTATE_DISABLED:
    print("Rotating disabled sensor mode is enabled.")

tick = 0
while True:
    scenario = SCENARIOS[tick % len(SCENARIOS)]
    disabled_sensors = disabled_for_tick(tick)
    sensor_enabled = {
        sensor_key: sensor_key not in disabled_sensors
        for sensor_key in SENSOR_KEYS
    }
    readings = {
        "temperature": sample_metric(scenario["temperature"]),
        "humidity": sample_metric(scenario["humidity"]),
        "light": sample_metric(scenario["light"]),
        "voltage": round(random.uniform(scenario["voltage"][0], scenario["voltage"][1]), 2),
    }
    data = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "scenario": scenario["name"],
        "sensor_enabled": sensor_enabled,
        "disabled_sensors": sorted(disabled_sensors),
    }
    data.update({
        sensor_key: value
        for sensor_key, value in readings.items()
        if sensor_enabled[sensor_key]
    })

    payload = json.dumps(data)
    print(f"Publishing {scenario['name']}: {payload}")

    try:
        publish.single(TOPIC, payload=payload, hostname=BROKER)
    except Exception as e:
        print(f"Failed to publish: {e}")

    tick += 1
    time.sleep(INTERVAL_SECONDS)
