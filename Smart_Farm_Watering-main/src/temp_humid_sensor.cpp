#include "temp_humid_sensor.h"

static DHT dht(DHT_PIN, DHT_TYPE);

void temp_humid_sensor(void *pvParameter)
{
    dht.begin();

    float current_temp = 0;
    float current_humid = 0;
    while (1)
    {
        current_temp = dht.readTemperature();
        current_humid = dht.readHumidity();
        if (xSensorMutex != NULL &&
            xSemaphoreTake(xSensorMutex, portMAX_DELAY) == pdTRUE)
        {
            glob_temp = current_temp;
            glob_humid = current_humid;
            xSemaphoreGive(xSensorMutex);
        }
        vTaskDelay(pdMS_TO_TICKS(2000));
    }
}