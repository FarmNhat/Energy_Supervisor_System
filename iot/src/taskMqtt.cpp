#include "taskMqtt.h"
#include "global.h"
#include <ArduinoJson.h>

static WiFiClient   espClient;
static PubSubClient mqttClient(espClient);

#define SUB_TOPIC "devices/control"
#define PUB_TOPIC "sensors/data"

// ================= MQTT CALLBACK =================
void mqtt_callback(char* topic, byte* payload, unsigned int length)
{
    char msg[128];

    memcpy(msg, payload, length);
    msg[length] = '\0';

    Serial.print("[MQTT RX] ");
    Serial.println(msg);

    StaticJsonDocument<128> doc;
    DeserializationError err = deserializeJson(doc, msg);

    if (err)
    {
        Serial.println("JSON parse failed!");
        return;
    }

    if (xSensorMutex != NULL &&
        xSemaphoreTake(xSensorMutex, portMAX_DELAY) == pdTRUE)
    {
        device1 = doc["device1"] | 0;
        device2 = doc["device2"] | 0;
        device3 = doc["device3"] | 0;

        xSemaphoreGive(xSensorMutex);
    }

    Serial.printf("Updated: d1=%d d2=%d d3=%d\n", device1, device2, device3);
}

// ================= RECONNECT =================
static void mqtt_reconnect()
{
    while (!mqttClient.connected())
    {
        Serial.print("[MQTT] Connecting...");

        if (mqttClient.connect(MQTT_CLIENT_ID))
        {
            Serial.println(" connected!");

            mqttClient.subscribe(SUB_TOPIC);   // 👈 subscribe control
        }
        else
        {
            Serial.print(" failed, rc=");
            Serial.println(mqttClient.state());
            vTaskDelay(pdMS_TO_TICKS(3000));
        }
    }
}

// ================= TASK =================
void task_MQTT(void *pvParameter)
{
    mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
    mqttClient.setCallback(mqtt_callback);

    float current_temp  = 0;
    float current_humid = 0;
    float current_light = 0;
    float current_volt  = 0;

    while (1)
    {
        if (WiFi.status() != WL_CONNECTED)
        {
            vTaskDelay(pdMS_TO_TICKS(1000));
            continue;
        }

        if (!mqttClient.connected())
            mqtt_reconnect();

        mqttClient.loop();

        // ===== READ SENSOR =====
        if (xSensorMutex != NULL &&
            xSemaphoreTake(xSensorMutex, portMAX_DELAY) == pdTRUE)
        {
            current_temp  = glob_temp;
            current_humid = glob_humid;
            current_light = glob_light;
            current_volt  = glob_volt;
            xSemaphoreGive(xSensorMutex);
        }

        // ===== BUILD JSON =====
        char payload[128];
        snprintf(payload, sizeof(payload),
            "{\"temperature\":%.2f,\"humidity\":%.2f,\"light\":%.2f,\"voltage\":%.2f}",
            current_temp, current_humid, current_light, current_volt);

        // ===== PUBLISH SENSOR =====
        if (xMqttMutex != NULL &&
            xSemaphoreTake(xMqttMutex, portMAX_DELAY) == pdTRUE)
        {
            mqttClient.publish(PUB_TOPIC, payload);
            xSemaphoreGive(xMqttMutex);
        }

        vTaskDelay(pdMS_TO_TICKS(2000));
    }
}