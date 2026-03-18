import json
import paho.mqtt.client as mqtt

BROKER    = "broker.hivemq.com"   # phải trùng với ESP32
PORT      = 1883
TOPIC     = "sensors/data"

def on_connect(client, userdata, flags, rc):
    print(f"Connected (rc={rc})")
    client.subscribe(TOPIC)

def on_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload.decode())
        print(f"[{msg.topic}]  temp={data['temperature']}°C  "
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
