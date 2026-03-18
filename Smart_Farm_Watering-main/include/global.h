#ifndef __GLOBAL_H__
#define __GLOBAL_H__

#include <Arduino.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/semphr.h"

#define DHT_PIN 32
#define DHT_TYPE DHT11
#define LIGHT_PIN 34
#define VOLT_PIN 35

extern float glob_temp;
extern float glob_humid;
extern float glob_light;
extern float glob_volt;


extern SemaphoreHandle_t xSensorMutex;
extern SemaphoreHandle_t xSerialMutex;
extern SemaphoreHandle_t xMqttMutex;

#endif