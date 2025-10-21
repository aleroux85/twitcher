#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>

#include "pico/stdlib.h"
#include "pico/flash.h"
#include "hardware/flash.h"
#include "pico/multicore.h"
#include "config.h"

// #define FLASH_TARGET_OFFSET (1 * 1024 * 1024)
#define FLASH_TARGET_OFFSET (PICO_FLASH_SIZE_BYTES - 0x1000)

// const uint8_t *flash_target_contents = (const uint8_t *) (XIP_BASE + FLASH_TARGET_OFFSET);

static void call_flash_range_erase(void *param) {
    uint32_t offset = (uint32_t)param;
    flash_range_erase(offset, FLASH_SECTOR_SIZE);
}

static void call_flash_range_program(void *param) {
    uint32_t offset = ((uintptr_t*)param)[0];
    const uint8_t *data = (const uint8_t *)((uintptr_t*)param)[1];
    flash_range_program(offset, data, FLASH_PAGE_SIZE);
}

void read_settings(uint8_t* buffer, size_t len) {
    const uint8_t *flash_target_contents = (const uint8_t *)(XIP_BASE + FLASH_TARGET_OFFSET);
    memcpy(buffer, flash_target_contents, len);
}

void apply_store(const uint8_t* data, size_t length) {
    printf("storing config to rom\n");
    uint32_t ints = save_and_disable_interrupts();

    flash_range_erase(FLASH_TARGET_OFFSET, 0x1000);
    flash_range_program(FLASH_TARGET_OFFSET, data, length+3);
    restore_interrupts(ints);
    printf("unmarshalling config\n");
    unmarshal_controls(data+3,length);
}

uint16_t retrieve_store(uint8_t* data_buffer) {
    printf("retrieving config from rom\n");
    uint32_t ints = save_and_disable_interrupts();

    uint8_t header_buffer[3];
    read_settings(header_buffer,3);
    if (header_buffer[0] != 10) {
        restore_interrupts(ints);
        printf("retrieved %d %d %d, no config stored\n", header_buffer[0], header_buffer[1], header_buffer[2]);
        return 0;
    }
    uint16_t data_length = (header_buffer[1] << 8) | header_buffer[2];

    read_settings(data_buffer,data_length+3);
    restore_interrupts(ints);
    printf("retrieved %d bytes from rom\n", data_length);
    unmarshal_controls(data_buffer+3,data_length);

    return data_length;
}

// ControlList* unmarshal_controls(const uint8_t* data, size_t length) {
void unmarshal_controls(const uint8_t* data, size_t length) {
    // ControlList *list = calloc(1,sizeof(ControlList));
    size_t offset = 0;
    size_t capacity = 4;

    // list->controls = malloc(capacity * sizeof(Control));
    // if (!list->controls) {
    //     printf("Memory allocation failed\n");
    //     exit(1);
    // }

    while (offset + 4 <= length) {
        Control control = {0};
        control.type = data[offset++];
        offset++;
        control.id = (data[offset] << 8) | data[offset + 1];
        offset += 2;

        if (control.type < 0x20 || control.type > 0x3F) {
            printf("Unsupported control type: 0x%02X, skipping %i\n", control.type,data[offset]);
            offset += data[offset++];
            continue;
        }
            
    // printf("control type %02X, offset %i, length %i\n",control.type,offset,length);
        uint32_t control_setup_msg;
        switch (control.type) {
            case CONTROL_TYPE_LED:
                if (offset + 1 > length) break;  // bounds check
                // control.payload_type = PAYLOAD_ID_REF;
                // control.ref_id = (data[offset] << 8) | data[offset + 1];
                offset += 1;

                control_setup_msg = (CONFIG_OPERATION_TYPE_SETUP << 24)
                    | (CONTROL_TYPE_LED << 16)
                    | control.id;
                // printf("send %X\n",control_setup_msg);
                multicore_fifo_push_blocking(control_setup_msg);
                break;
        
            case CONTROL_TYPE_GPIO:
                if (offset + 1 > length) break;  // bounds check
                offset += 1;

                control_setup_msg = (CONFIG_OPERATION_TYPE_SETUP << 24)
                    | (CONTROL_TYPE_GPIO << 16)
                    | (data[offset++] << 27)
                    | control.id;
                // printf("send %X\n",control_setup_msg);
                multicore_fifo_push_blocking(control_setup_msg);
                break;
        
            case CONTROL_TYPE_PWM:
                if (offset + 1 > length) break;  // bounds check
                offset += 1;

                control_setup_msg = (CONFIG_OPERATION_TYPE_SETUP << 24)
                    | (CONTROL_TYPE_PWM << 16)
                    | (data[offset++] << 27)
                    | control.id;
                // printf("send %X\n",control_setup_msg);
                multicore_fifo_push_blocking(control_setup_msg);

                control_setup_msg = (data[offset++] << 24)
                    | (data[offset++] << 16)
                    | (data[offset++] << 8)
                    | data[offset++];
                // printf("send %X\n",control_setup_msg);
                multicore_fifo_push_blocking(control_setup_msg);

                control_setup_msg = (data[offset++] << 24)
                    | (data[offset++] << 16)
                    | (data[offset++] << 8)
                    | data[offset++];
                // printf("send %X\n",control_setup_msg);
                multicore_fifo_push_blocking(control_setup_msg);

                control_setup_msg = (data[offset++] << 24)
                    | (data[offset++] << 16)
                    | (data[offset++] << 8)
                    | data[offset++];
                // printf("send %X\n",control_setup_msg);
                multicore_fifo_push_blocking(control_setup_msg);

                break;

            // case 0xA0:
            //     if (offset + 1 > length) break;  // bounds check
            //     // control.payload_type = PAYLOAD_STRING;
            //     control.string_payload.length = data[offset++];
            //     if (offset + control.string_payload.length > length) break;
        
            //     control.string_payload.str = malloc(control.string_payload.length + 1);
            //     memcpy(control.string_payload.str, data + offset, control.string_payload.length);
            //     control.string_payload.str[control.string_payload.length] = '\0';  // null-terminate
            //     offset += control.string_payload.length;
            //     break;
        
            default:
                printf("skipping control type %02X\n",control.payload_type);
                // control.payload_type = PAYLOAD_NONE;
                break;
        }

        // if (list->count >= capacity) {
        //     capacity *= 2;
        //     Control* new_controls = realloc(list->controls, capacity * sizeof(Control));
        //     if (!new_controls) {
        //         fprintf(stderr, "Memory reallocation failed\n");
        //         free(list->controls);
        //         exit(1);
        //     }
        //     list->controls = new_controls;
        // }

        // list->controls[list->count++] = control;
    }

    // return list;
}