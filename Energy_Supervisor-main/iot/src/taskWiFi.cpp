#include "taskWiFi.h"

void task_WiFi(void *pvParameter)
{
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    while (WiFi.status() != WL_CONNECTED)
    {
        vTaskDelay(pdMS_TO_TICKS(500));
        Serial.print(".");
    }

    Serial.println("\nWiFi connected: " + WiFi.localIP().toString());

    while (1)
    {
        if (WiFi.status() != WL_CONNECTED)
        {
            Serial.println("[WiFi] Reconnecting...");
            WiFi.reconnect();
        }
        vTaskDelay(pdMS_TO_TICKS(5000));
    }
}
