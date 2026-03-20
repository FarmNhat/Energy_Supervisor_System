#include "taskLCD.h"

static LiquidCrystal_I2C lcd(LCD_I2C_ADDR, LCD_COLS, LCD_ROWS);

// 3 trang hiển thị, mỗi trang 2 dòng, xoay vòng mỗi 2 giây
// Trang 0: Temp  + Humid
// Trang 1: Light + Volt
// Trang 2: IP / trạng thái WiFi (dự phòng mở rộng)

void task_LCD(void *pvParameter)
{
    Wire.begin(LCD_SDA_PIN, LCD_SCL_PIN);
    lcd.init();
    lcd.backlight();

    // Màn hình chào
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

    uint8_t page = 0;       // trang hiện tại: 0 hoặc 1
    char row0[17];          // buffer dòng trên  (16 ký tự + null)
    char row1[17];          // buffer dòng dưới

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

        // --- Build nội dung theo trang ---
        if (page == 0)
        {
            // Dòng 0: Temp
            if (isnan(current_temp))
                snprintf(row0, sizeof(row0), "Temp: ERR       ");
            else
                snprintf(row0, sizeof(row0), "Temp: %5.1f %cC   ", current_temp, 0xDF);

            // Dòng 1: Humid
            if (isnan(current_humid))
                snprintf(row1, sizeof(row1), "Humid: ERR      ");
            else
                snprintf(row1, sizeof(row1), "Humid: %5.1f %%  ", current_humid);
        }
        else
        {
            // Dòng 0: Light
            if (isnan(current_light))
                snprintf(row0, sizeof(row0), "Light: ERR      ");
            else
                snprintf(row0, sizeof(row0), "Light: %5.1f %%  ", current_light);

            // Dòng 1: Volt
            snprintf(row1, sizeof(row1), "Volt:  %5.2f V  ", current_volt);
        }

        // --- Ghi lên LCD ---
        lcd.setCursor(0, 0);
        lcd.print(row0);
        lcd.setCursor(0, 1);
        lcd.print(row1);

        // --- Chuyển trang ---
        page = (page + 1) % 2;

        vTaskDelay(pdMS_TO_TICKS(2000));
    }


    
}
