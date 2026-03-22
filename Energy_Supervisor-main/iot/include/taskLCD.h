#ifndef __TASK_LCD_H__
#define __TASK_LCD_H__

#include "global.h"
#include <LiquidCrystal_I2C.h>

// I2C LCD config
#define LCD_I2C_ADDR  0x27   // Địa chỉ I2C phổ biến (thử 0x3F nếu không hiện)
#define LCD_COLS      16
#define LCD_ROWS      2

// ESP32 I2C default pins
#define LCD_SDA_PIN   21
#define LCD_SCL_PIN   22

void task_LCD(void *pvParameter);

#endif
