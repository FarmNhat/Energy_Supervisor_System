#include "light_sensor.h"

void light_sensor(void *pvParameter)
{
    int light_val = 0;
    int normalized_light = 0;

    while (1)
    {
        light_val = analogRead(LIGHT_PIN);
        normalized_light = map(light_val, 4095, 0, 0, 100);

        if (xSensorMutex != NULL &&
            xSemaphoreTake(xSensorMutex, portMAX_DELAY) == pdTRUE)
        {
            glob_light = normalized_light;
            xSemaphoreGive(xSensorMutex);
        }
        vTaskDelay(pdMS_TO_TICKS(2000));
    }
}