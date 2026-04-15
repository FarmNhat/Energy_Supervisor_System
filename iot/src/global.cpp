#include "global.h"

float glob_temp = 0;
float glob_humid = 0;
float glob_light= 0;
float glob_volt = 0;
int device1 = 0;
int device2 = 0;
int device3 = 0;
//float glob_total_ml = 0;
//bool glob_pump_running = false;

SemaphoreHandle_t xSensorMutex = NULL;
SemaphoreHandle_t xSerialMutex = NULL;
SemaphoreHandle_t xMqttMutex = NULL;
