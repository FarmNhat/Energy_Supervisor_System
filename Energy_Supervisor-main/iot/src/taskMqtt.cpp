#include "taskMqtt.h"

static WiFiClient   espClient;
static PubSubClient mqttClient(espClient);

static void mqtt_reconnect()
{
    while (!mqttClient.connected())
    {
        Serial.print("[MQTT] Connecting...");
        if (mqttClient.connect(MQTT_CLIENT_ID))
        {
            Serial.println(" connected!");
        }
        else
        {
            Serial.print(" failed, rc=");
            Serial.println(mqttClient.state());
            vTaskDelay(pdMS_TO_TICKS(3000));
        }
    }
}

void task_MQTT(void *pvParameter)
{
    mqttClient.setServer(MQTT_BROKER, MQTT_PORT);

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

        // Đọc global variables
        if (xSensorMutex != NULL &&
            xSemaphoreTake(xSensorMutex, portMAX_DELAY) == pdTRUE)
        {
            current_temp  = glob_temp;
            current_humid = glob_humid;
            current_light = glob_light;
            current_volt  = glob_volt;
            xSemaphoreGive(xSensorMutex);
        }

        // Build JSON string
        char payload[128];
        snprintf(payload, sizeof(payload),
            "{\"temperature\":%.2f,\"humidity\":%.2f,\"light\":%.2f,\"voltage\":%.2f}",
            current_temp, current_humid, current_light, current_volt);

        // Publish
        if (xMqttMutex != NULL &&
            xSemaphoreTake(xMqttMutex, portMAX_DELAY) == pdTRUE)
        {
            mqttClient.publish(MQTT_TOPIC, payload);
            xSemaphoreGive(xMqttMutex);
        }

        vTaskDelay(pdMS_TO_TICKS(2000));
    }
}
