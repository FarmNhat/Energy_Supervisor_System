#include "global.h"
#include "temp_humid_sensor.h"
#include "monitor_update.h"
#include "light_sensor.h"
#include "voltage_sensor.h"
#include "taskWiFi.h"
#include "taskMqtt.h"

void setup()
{
  Serial.begin(115200);

  xSensorMutex = xSemaphoreCreateMutex();
  xSerialMutex = xSemaphoreCreateMutex();
  xMqttMutex   = xSemaphoreCreateMutex();

  if (xSensorMutex == NULL || xSerialMutex == NULL || xMqttMutex == NULL)
  {
    Serial.println("Failed to create mutex!");
  }

  xTaskCreate(monitor_update,     "Task Printing",      2048, NULL, 1, NULL);
  xTaskCreate(temp_humid_sensor,  "Task DHT",           4096, NULL, 2, NULL);
  xTaskCreate(light_sensor,       "Task Light Sensor",  4096, NULL, 2, NULL);
  xTaskCreate(voltage_sensor,     "Task Rain Sensor",   2048, NULL, 2, NULL);
  xTaskCreate(task_WiFi,          "Task WiFi",          4096, NULL, 3, NULL);
  xTaskCreate(task_MQTT,          "Task MQTT",          4096, NULL, 3, NULL);
}

void loop() {}
