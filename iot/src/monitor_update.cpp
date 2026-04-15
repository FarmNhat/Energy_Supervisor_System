#include "monitor_update.h"

void monitor_update(void *pvParameter)
{
    float current_temp = 0;
    float current_humid = 0;
    float current_light = 0;
    float current_volt = 0;

    while (1)
    {
        if (xSensorMutex != NULL &&
            xSemaphoreTake(xSensorMutex, portMAX_DELAY) == pdTRUE)
        {
            current_temp = glob_temp;
            current_humid = glob_humid;
            //glob_light = 100.00 - glob_light;
            current_light = glob_light;
            current_volt = glob_volt;
            xSemaphoreGive(xSensorMutex);
        }

        if (xSerialMutex != NULL &&
            xSemaphoreTake(xSerialMutex, portMAX_DELAY) == pdTRUE)
        {
            if (isnan(current_temp) || isnan(current_humid))
            {
                Serial.println("[DHT Sensor] is disconnected !!!");
                current_temp = -1;
                current_humid = -1;
            }

            if (isnan(current_light))
            {
                Serial.println("[Light Sensor] Sensor is disconnected !!!");
            }

            Serial.print("Humidity: ");
            Serial.print(current_humid);
            Serial.print("%  Temperature: ");
            Serial.print(current_temp);
            Serial.println("°C");
            Serial.print("Light: ");
            Serial.print(current_light);
            Serial.println("%");

            Serial.print("Voltage: ");
            Serial.print(current_volt);
            Serial.println("(V)");

            Serial.print("dev1: ");
            Serial.print(device1);
            Serial.print(" dev2: ");
            Serial.print(device2);
            Serial.print(" dev3: ");
            Serial.println(device3);
            

            Serial.print("\n");
            xSemaphoreGive(xSerialMutex);
        }

        vTaskDelay(pdMS_TO_TICKS(2000)); // nên dùng pdMS_TO_TICKS cho đồng bộ
    }
}