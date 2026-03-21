#include "global.h"
#include "temp_humid_sensor.h"
#include "monitor_update.h"
#include "light_sensor.h"
#include "voltage_sensor.h"
#include "taskWiFi.h"
#include "taskMqtt.h"
#include "taskLCD.h"              // Thêm module LCD

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

  // Priority thấp hơn sensor, cao hơn monitor Serial
  xTaskCreate(monitor_update,     "Task Printing",      2048, NULL, 1, NULL);
  xTaskCreate(temp_humid_sensor,  "Task DHT",           4096, NULL, 2, NULL);
  xTaskCreate(light_sensor,       "Task Light Sensor",  4096, NULL, 2, NULL);
  xTaskCreate(voltage_sensor,     "Task Rain Sensor",   2048, NULL, 2, NULL);
  xTaskCreate(task_WiFi,          "Task WiFi",          4096, NULL, 3, NULL);
  xTaskCreate(task_MQTT,          "Task MQTT",          4096, NULL, 3, NULL);
  xTaskCreate(task_LCD,           "Task LCD",           4096, NULL, 1, NULL); // Thêm LCD task
}

void loop() {}


// #include <Wire.h>
// #include <LiquidCrystal_I2C.h>

// LiquidCrystal_I2C lcd(0x27, 16, 2); // đổi 0x27 nếu scanner báo khác

// void setup() {
//   Wire.begin(21, 22);
//   lcd.init();
//   lcd.backlight();
//   lcd.setBacklight(80);
//   lcd.setCursor(0, 0);
//   lcd.print("Hello World!");
//   lcd.setCursor(0, 1);
//   lcd.print("ESP32 OK");
// }

// void loop() {}