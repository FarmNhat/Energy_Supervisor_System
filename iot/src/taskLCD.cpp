#include "taskLCD.h"

static LiquidCrystal_I2C lcd(LCD_I2C_ADDR, LCD_COLS, LCD_ROWS);

void task_LCD(void *pvParameter)
{
    Wire.begin(LCD_SDA_PIN, LCD_SCL_PIN);
    lcd.init();
    lcd.backlight();

    lcd.setCursor(2, 0);
    lcd.print("ENV MONITOR");
    lcd.setCursor(3, 1);
    lcd.print("Starting...");
    vTaskDelay(pdMS_TO_TICKS(2000));
    lcd.clear();

    float current_temp  = 0;
    float current_humid = 0;
    float current_light = 0;
    float current_volt  = 0;

    uint8_t page = 0;       
    char row0[17];
    char row1[17];

    while (1)
    {
        // --- Đọc sensor ---
        if (xSensorMutex != NULL &&
            xSemaphoreTake(xSensorMutex, portMAX_DELAY) == pdTRUE)
        {
            current_temp  = glob_temp;
            current_humid = glob_humid;
            current_light = glob_light;
            current_volt  = glob_volt;
            xSemaphoreGive(xSensorMutex);
        }

        // --- Build nội dung ---
        if (page == 0)
        {
            // Temp
            if (isnan(current_temp))
                snprintf(row0, sizeof(row0), "Temp: ERR       ");
            else
                snprintf(row0, sizeof(row0), "Temp: %5.1f %cC   ", current_temp, 0xDF);

            // Humid
            if (isnan(current_humid))
                snprintf(row1, sizeof(row1), "Humid: ERR      ");
            else
                snprintf(row1, sizeof(row1), "Humid: %5.1f %%  ", current_humid);
        }
        else if (page == 1)
        {
            // Light
            if (isnan(current_light))
                snprintf(row0, sizeof(row0), "Light: ERR      ");
            else
                snprintf(row0, sizeof(row0), "Light: %5.1f %%  ", current_light);

            // Volt
            snprintf(row1, sizeof(row1), "Volt:  %5.2f V  ", current_volt);
        }
        else if (page == 2)
        {
            // Device status

            snprintf(row0, sizeof(row0),
                "D1:%-3s D2:%-3s  ",
                device1 ? "ON" : "OFF",
                device2 ? "ON" : "OFF");

            snprintf(row1, sizeof(row1),
                "D3:%-3s        ",   
                device3 ? "ON" : "OFF");
        }

        // --- Ghi LCD ---
        lcd.setCursor(0, 0);
        lcd.print(row0);
        lcd.setCursor(0, 1);
        lcd.print(row1);

        // --- Chuyển trang ---
        page = (page + 1) % 3;   
        vTaskDelay(pdMS_TO_TICKS(2000));
    }
}