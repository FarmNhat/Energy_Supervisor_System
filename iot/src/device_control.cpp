#include "device_control.h"


void task_Device(void *pvParameter)
{
    while (1)
    {
        if (xSensorMutex != NULL &&
            xSemaphoreTake(xSensorMutex, portMAX_DELAY) == pdTRUE)
        {
            digitalWrite(25, device1);
            digitalWrite(26, device2);
            digitalWrite(27, device3);

            xSemaphoreGive(xSensorMutex);
        }

        vTaskDelay(pdMS_TO_TICKS(500));
    }
}