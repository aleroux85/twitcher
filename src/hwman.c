#include <stdio.h>
#include <string.h>
#include "uthash.h"

#include "pico/stdlib.h"
#include "pico/multicore.h"
#include "pico/cyw43_arch.h"
#include "hardware/adc.h"
#include "hardware/pwm.h"
#include "hardware/clocks.h"

#include "hwman.h"
#include "config.h"
#include "uthash.h"

// Constants for conversion
#define ADC_TEMP_SENSOR 4        // Internal temperature sensor is connected to ADC 4
#define ADC_VREF 3.3             // Reference voltage (3.3V)
#define ADC_RESOLUTION 4095.0    // 12-bit ADC resolution (2^12 - 1)
#define TEMP_OFFSET 27.0         // Calibration temperature (27°C)
#define TEMP_SLOPE -1.721        // mV per degree change (from datasheet)

float read_internal_temperature() {
    adc_select_input(ADC_TEMP_SENSOR);
    sleep_us(10);  // Allow ADC to stabilize
    uint16_t raw = adc_read();

    float voltage = (raw * 3.3f) / 4095.0f; // Convert ADC to voltage
    float temperature = 27.0f - ((voltage - 0.706f) / 0.001721f);
    
    return temperature;
}

#define PWM_SLICE_NUM 12

typedef struct {
    uint8_t operation;
    union {
        uint8_t control_type;
        // uint8_t n_values;
    };
    uint8_t io;
    union {
        uint16_t id;
        // uint16_t param;
    };
    uint8_t value;
    // uint16_t val0;
    // uint16_t val1;
    // uint16_t clksteps;
    // float grad;
    // uint16_t offset;

    UT_hash_handle hh;
} hwop;

hwop decode_hwop(uint32_t packet) {
    hwop result;

    result.operation    = (packet >> 30) & 0x03;
    result.control_type = ((packet >> 24) & 0x1F) | 0x20;
    result.id = (packet >> 8)  & 0xFFFF;
    // result.io           = (packet >> 27) & 0xFF;
    result.value        = (packet >> 0)  & 0xFF;

    return result;
}

static hwop *packet_table = NULL;

void add_packet(hwop *op) {
    // First check if one with the same ID already exists
    hwop *existing = NULL;
    HASH_FIND(hh, packet_table, &op->id, sizeof(uint16_t), existing);
    if (existing) {
        // Replace the old packet
        HASH_DEL(packet_table, existing);
        free(existing);
    }

    // Allocate and copy
    hwop *new_op = malloc(sizeof(hwop));
    if (!new_op) return;  // handle allocation failure
    *new_op = *op;
    HASH_ADD(hh, packet_table, id, sizeof(uint16_t), new_op);
}

hwop *find_packet(uint16_t id) {
    hwop *op = NULL;
    HASH_FIND(hh, packet_table, &id, sizeof(uint16_t), op);
    return op; // may be NULL
}

void delete_all_packets() {
    hwop *current, *tmp;
    HASH_ITER(hh, packet_table, current, tmp) {
        HASH_DEL(packet_table, current);
        free(current);
    }
}

void core1_worker() {
    printf("(core1) started\n");
    
    adc_init();
    adc_set_temp_sensor_enabled(true);

    absolute_time_t start = get_absolute_time();
    uint64_t next_uptime_timeout = 5;
    uint64_t next_coretm_timeout = 6;

    while(1) {
        int64_t up_time_elapsed = absolute_time_diff_us(start, get_absolute_time())/1200000;
        if (up_time_elapsed >= next_uptime_timeout) {
            multicore_fifo_push_blocking(0);
            multicore_fifo_push_blocking((uint32_t)up_time_elapsed);
            next_uptime_timeout = up_time_elapsed + 5;
        }

        uint32_t op;
        if (multicore_fifo_pop_timeout_us(1000, &op)) {
            hwop decop = decode_hwop(op);
            // printf("hw opp %d type %d, io %d\n",decop.operation, decop.control_type, decop.io);
            
            switch (decop.operation) {
            case CONFIG_OPERATION_TYPE_SETUP:
                switch (decop.control_type) {
                case CONTROL_TYPE_GPO:
                    uint32_t io;
                    multicore_fifo_pop_timeout_us(1000, &io);
                    decop.io = io & 0xFF;

                    gpio_init(decop.io);
                    gpio_set_dir(decop.io, GPIO_OUT);
                    break;
                
                // case CONTROL_TYPE_PWM:
                //     gpio_set_function(decop.io, GPIO_FUNC_PWM);
                //     uint slice_num = pwm_gpio_to_slice_num(decop.io);
                //     uint channel = pwm_gpio_to_channel(decop.io);

                //     uint32_t frqval = multicore_fifo_pop_blocking();
                //     uint16_t freq = (frqval>>24)&0xFF | (frqval>>16)&0xFF;
                //     int16_t valx = (frqval>>8)&0xFF | frqval&0xFF;

                //     uint32_t mappoint0 = multicore_fifo_pop_blocking();
                //     uint16_t dc0 = (mappoint0>>24)&0xFF | (mappoint0>>16)&0xFF;
                //     decop.val0 = (mappoint0>>8)&0xFF | mappoint0&0xFF;

                //     uint32_t mappoint1 = multicore_fifo_pop_blocking();
                //     uint16_t dc1 = (mappoint1>>24)&0xFF | (mappoint1>>16)&0xFF;
                //     decop.val1 = (mappoint1>>8)&0xFF | mappoint1&0xFF;

                //     pwm_set_clkdiv(slice_num, 100.0f);
                //     decop.clksteps = ((clock_get_hz(clk_sys)/100)/freq);
                //     // pwm freq = clock freq / (clkdiv*(wrap+1))
                //     // the -1 below comes from the +1 after the wrap
                //     pwm_set_wrap(slice_num, decop.clksteps-1);

                //     decop.grad = (float)(dc1-dc0)/(decop.val1-decop.val0);
                //     decop.offset = dc0;

                //     if (valx < decop.val0) {valx = decop.val0;}
                //     if (valx > decop.val1) {valx = decop.val1;}

                //     float dcx = (valx-decop.val0)*decop.grad + decop.offset;
                //     uint32_t lvl = (uint32_t)((dcx/100.0f)*decop.clksteps);

                //     pwm_set_chan_level(slice_num, channel, lvl);
                //     pwm_set_enabled(slice_num, true);
                //     break;
                
                default:
                    break;
                }

                add_packet(&decop);
                printf("hw man adding control type %02X on ID %i\n",decop.control_type,decop.id);
                break;

            case CONFIG_OPERATION_TYPE_CLEAN_SETUP:
                delete_all_packets();
                for (uint gpio = 0; gpio < 30; gpio++) {
                    gpio_set_function(gpio, GPIO_FUNC_SIO);
                    gpio_set_dir(gpio, GPIO_IN);
                    gpio_disable_pulls(gpio);
                }
                for (uint slice_num = 0; slice_num < PWM_SLICE_NUM; slice_num++) {
                    pwm_set_enabled(slice_num, false);
                    pwm_set_wrap(slice_num, 0xFFFF);
                    pwm_set_chan_level(slice_num, PWM_CHAN_A, 0);
                    pwm_set_chan_level(slice_num, PWM_CHAN_B, 0);
                }
            case CONFIG_OPERATION_CONTROL_ACTION:
                // msg = multicore_fifo_pop_blocking();
                printf("hw man buffer %02X %02X %02X %02X\n",op>>24&0xFF,op>>16&0xFF,op>>8&0xFF,op&0xFF);
                // hwop decop = decode_hwop(msg);
                
                // uint32_t values[decop.n_values];
                // for (size_t iValue = 0; iValue < decop.n_values; iValue++) {
                //     values[iValue] = multicore_fifo_pop_blocking();
                // }

                printf("hw man finding ID %d\n",decop.id);
                
                hwop *stored_op = find_packet(decop.id);
                printf("hw man found type %02X with ID %d\n",stored_op->control_type,stored_op->id);
                if (stored_op) {
                    switch (stored_op->control_type) {
                    case CONTROL_TYPE_LED:
                        printf("switch LED, value:%i\n",decop.value);
                        multicore_fifo_push_blocking(2);
                        multicore_fifo_push_blocking(decop.value);
                        break;
                    
                    case CONTROL_TYPE_GPO:
                        printf("switch GPO %d, value:%i\n",decop.io, decop.value);
                        gpio_put(decop.io,decop.value);
                        break;
                    
                    // case CONTROL_TYPE_PWM:
                    //     // printf("control PWM, value:%i\n",values[0]);
                    //     if (values[0] < pkt->val0) {values[0] = pkt->val0;}
                    //     if (values[0] > pkt->val1) {values[0] = pkt->val1;}
                    //     float dcx = (values[0]-pkt->val0)*pkt->grad + pkt->offset;
                    //     uint32_t lvl = (uint32_t)((dcx/100.0f)*pkt->clksteps);

                    //     uint slice_num = pwm_gpio_to_slice_num(pkt->io);
                    //     uint channel = pwm_gpio_to_channel(pkt->io);
                    //     pwm_set_chan_level(slice_num, channel, lvl);
                    //     break;

                    default:
                        break;
                    }
                } else {
                    // Not found, handle gracefully
                }
            }
        }

        int64_t core_time_elapsed = absolute_time_diff_us(start, get_absolute_time())/1200000;
        if (core_time_elapsed >= next_coretm_timeout) {
            float temperature = read_internal_temperature();
            multicore_fifo_push_blocking(1);
            uint32_t data;
            memcpy(&data, &temperature, sizeof(float));
            multicore_fifo_push_blocking(data);
            next_coretm_timeout = core_time_elapsed + 5;
        }
    }
}