#ifndef __TASK_MQTT_H__
#define __TASK_MQTT_H__

#include "global.h"
#include <PubSubClient.h>
#include <WiFi.h>

#define MQTT_BROKER   "broker.hivemq.com"  // hoặc IP broker của bạn
#define MQTT_PORT     1883
#define MQTT_TOPIC    "sensors/data"
#define MQTT_CLIENT_ID "esp32_sensor_01"

void task_MQTT(void *pvParameter);

#endif
