#include "voltage_sensor.h"

void voltage_sensor(void *pvParameter)
{
    pinMode(VOLT_PIN, INPUT);

    while (1)
    {
        int volt_val = analogRead(VOLT_PIN);
        if (xSensorMutex != NULL &&
            xSemaphoreTake(xSensorMutex, portMAX_DELAY) == pdPASS)
        {
            glob_volt = volt_val;
            xSemaphoreGive(xSensorMutex);
        }
        vTaskDelay(pdMS_TO_TICKS(2000));
    }
}