#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>

#include "pico/stdlib.h"
#include "pico/flash.h"
#include "hardware/flash.h"
#include "pico/multicore.h"
#include "config.h"
// #include "wifi.h"

#define PREFIX "neoGraph-"
#define PREFIX_LEN 9
#define NAME_LEN   4
#define MAC_LEN    6

#define FLASH_SIZE 0x1000
#define SECURE_FLASH_SIZE 0x100

#define FLASH_TARGET_OFFSET (PICO_FLASH_SIZE_BYTES - FLASH_SIZE)
#define SECURE_FLASH_TARGET_OFFSET (PICO_FLASH_SIZE_BYTES - FLASH_SIZE-SECURE_FLASH_SIZE)

void read_secrets(uint8_t* buffer, size_t len) {
    const uint8_t *flash_target_contents = (const uint8_t *)(XIP_BASE + SECURE_FLASH_TARGET_OFFSET);
    memcpy(buffer, flash_target_contents, len);
}

void read_config(uint8_t* buffer, size_t len) {
    const uint8_t *flash_target_contents = (const uint8_t *)(XIP_BASE + FLASH_TARGET_OFFSET);
    memcpy(buffer, flash_target_contents, len);
}

void apply_store(const uint8_t* data, size_t length) {
    printf("storing config to rom\n");
    uint32_t ints = save_and_disable_interrupts();

    flash_range_erase(FLASH_TARGET_OFFSET, FLASH_SIZE);
    flash_range_program(FLASH_TARGET_OFFSET, data, length+3);
    restore_interrupts(ints);
    printf("unmarshalling config\n");
    unmarshal_controls(data+3,length);
}

void write_secrets(const uint8_t* data, size_t length) {
    printf("storing config to rom\n");
    uint32_t ints = save_and_disable_interrupts();

    flash_range_erase(SECURE_FLASH_TARGET_OFFSET, SECURE_FLASH_SIZE);
    flash_range_program(SECURE_FLASH_TARGET_OFFSET, data, length);
    restore_interrupts(ints);
}

void write_config(const uint8_t* data, size_t length) {
    printf("storing config to rom\n");
    uint32_t ints = save_and_disable_interrupts();

    flash_range_erase(FLASH_TARGET_OFFSET, FLASH_SIZE);
    flash_range_program(FLASH_TARGET_OFFSET, data, length);
    restore_interrupts(ints);
}

typedef struct {
    uint8_t *buf;
    uint8_t *pay;
    size_t pos;
    size_t size;
    uint8_t type;
    uint16_t id;
    uint8_t len;
} config_element_iterator;

bool next_config_element(config_element_iterator *elms) {
    if (elms->pos >= elms->size) return false;

    if (elms->pos == 0 && elms->pay == NULL) {
        if (elms->type == 0x0A) {
            elms->pos = 3;
        }
    } else {
        elms->pos =+ (elms->pos + 5 + elms->len);
    }

    if (elms->pos >= elms->size) {
        elms->pay = NULL;
        return true;
    }
    elms->type = elms->buf[elms->pos];
    elms->id = elms->buf[elms->pos+2]<<8 | elms->buf[elms->pos+3];
    elms->len = elms->buf[elms->pos+4];
    elms->pay = elms->buf+elms->pos+5;

    printf("debug pos:%d, size:%d, type:%X, id:%d, len:%d\n",elms->pos,elms->size,elms->type,elms->id,elms->len);
}

void mac_to_name(const uint8_t mac[6], char out[5]) {
    // Simple 32-bit hash from the 6 MAC bytes
    uint32_t hash = 0x811C9DC5; // FNV-1a offset basis
    for (int i = 0; i < 6; i++) {
        hash ^= mac[i];
        hash *= 0x01000193; // FNV-1a prime
    }

    out[0] = LETTERS[hash % 26];
    hash /= 26;

    // Convert hash to 4 base-36 characters
    for (int i = 1; i < 4; i++) {
        uint32_t index = hash % 36;
        out[i] = ALPHABET[index];
        hash /= 36;
    }

    out[4] = '\0';
}

size_t build_secrets(uint8_t *buf, const char name[5], const uint8_t *mac) {
    uint8_t *p = buf;

    // --- 0xB3 block #2 ---
    *p++ = 0xB3;
    *p++ = 0x00; // reserved
    *p++ = 0x00; // elm ID H
    *p++ = 0x00; // elm ID L
    *p++ = 0x0A; // elm Len
    *p++ = 0x03; // field 0x03=pass
    memcpy(p, "neoGraph", 8);
    p += 8;
    // memcpy(p, name, NAME_LEN);
    // p += NAME_LEN;
    *p++ = 0x00;

    return (size_t)(p - buf);
}

size_t build_config(uint8_t *buf, const char name[5], const uint8_t *mac) {
    uint8_t *p = buf;

    // --- 0xB0 block ---
    *p++ = 0xB0;
    *p++ = 0x00; // reserved
    *p++ = 0x00; // elm ID H
    *p++ = 0x00; // elm ID L
    *p++ = 0x07; // elm Len
    *p++ = 0x00; // field 0x00=mac
    memcpy(p, mac, MAC_LEN);
    p += MAC_LEN;

    // --- 0xB1 block #1 ---
    *p++ = 0xB1;
    *p++ = 0x00; // reserved
    *p++ = 0x00; // elm ID H
    *p++ = 0x00; // elm ID L
    *p++ = 0x06; // elm Len
    *p++ = 0x01; // field 0x01=name
    memcpy(p, name, NAME_LEN);
    p += NAME_LEN;
    *p++ = 0x00;

    // --- 0xB1 block #2 ---
    *p++ = 0xB1;
    *p++ = 0x00; // reserved
    *p++ = 0x00; // elm ID H
    *p++ = 0x00; // elm ID L
    *p++ = 0x03; // elm Len
    *p++ = 0x02; // field 0x02=network
    *p++ = 0x00; // ref network elm ID H
    *p++ = 0x00; // ref network elm ID L

    // --- 0xB2 block ---
    *p++ = 0xB2;
    *p++ = 0x00; // reserved
    *p++ = 0x00; // elm ID H
    *p++ = 0x00; // elm ID L
    *p++ = 0x00; // elm Len

    // --- 0xB3 block #1 ---
    *p++ = 0xB3;
    *p++ = 0x00; // reserved
    *p++ = 0x00; // elm ID H
    *p++ = 0x00; // elm ID L
    *p++ = 0x06; // elm Len
    *p++ = 0x01; // field 0x01=name
    memcpy(p, name, NAME_LEN);
    p += NAME_LEN;
    *p++ = 0x00;

    // --- 0xB3 block #2 ---
    *p++ = 0xB3;
    *p++ = 0x00; // reserved
    *p++ = 0x00; // elm ID H
    *p++ = 0x00; // elm ID L
    *p++ = 0x0F; // elm Len
    *p++ = 0x02; // field 0x02=ssid
    memcpy(p, PREFIX, PREFIX_LEN);
    p += PREFIX_LEN;
    memcpy(p, name, NAME_LEN);
    p += NAME_LEN;
    *p++ = 0x00;

    return (size_t)(p - buf);
}

size_t wrap_secrets(uint8_t *out, const char name[5], const uint8_t *mac) {
    uint8_t inner[SECURE_FLASH_SIZE];
    size_t inner_len = build_secrets(inner, name, mac);

    uint8_t *p = out;

    *p++ = 0x0A;
    *p++ = (inner_len >> 8) & 0xFF;
    *p++ = inner_len & 0xFF;
    memcpy(p, inner, inner_len);
    p += inner_len;

    return (size_t)(p - out);
}

size_t wrap_config(uint8_t *out, const char name[5], const uint8_t *mac) {
    uint8_t inner[FLASH_SIZE];
    size_t inner_len = build_config(inner, name, mac);

    uint8_t *p = out;

    *p++ = 0x0A;
    *p++ = (inner_len >> 8) & 0xFF;
    *p++ = inner_len & 0xFF;
    memcpy(p, inner, inner_len);
    p += inner_len;

    return (size_t)(p - out);
}

int unmarshal_network_config(
    uint8_t *buf,
    size_t size, 
    const uint8_t *target_mac,
    network_setup *out
) {
    // memset(out->device.name, 0, sizeof(out->device.name));
    // memset(out->network.name, 0, sizeof(out->network.name));

    config_element_iterator itr = {
        .buf = buf,
        .pay = NULL,
        .pos = 0,
        .size = size
    };

    while (next_config_element(&itr)) {
        if (itr.type == 0xB0) {
            // printf("got B0\n");
            if (memcmp(itr.pay+1, target_mac, MAC_LEN) == 0) {
                // printf("match MAC\n");
                out->device.id = itr.id;
                break;
            }
        }
    }

    itr.pos = 0;
    itr.pay = NULL;

    while (next_config_element(&itr)) {
        if (itr.type == 0xB1) {
            // printf("got B1\n");
            if (itr.id != out->device.id) continue;
            uint8_t field_number = itr.pay[0];
            if (field_number == 0x01) {
                // printf("match device name\n");
                memcpy(out->device.name, itr.pay+1, itr.len-1);
                // printf("debug name:%s\n", out->device.name);
                continue;
            }

            if (field_number == 0x02) {
                // printf("match device network\n");
                out->network.id = itr.pay[1]<<8 | itr.pay[2];
                continue;
            }
        }
    }

    itr.pos = 0;
    itr.pay = NULL;

    while (next_config_element(&itr)) {
        if (itr.type == 0xB3) {
            // printf("got B3\n");
            if (itr.id != out->network.id) continue;
            uint8_t field_number = itr.pay[0];

            if (field_number == 0x01) {
                // printf("match network name\n");
                memcpy(out->network.name, itr.pay+1, itr.len-1);
                // printf("debug name:%s\n", out->network.name);
                continue;
            }

            if (field_number == 0x02) {
                // printf("match network ssid\n");
                memcpy(out->network.ssid, itr.pay+1, itr.len-1);
                // printf("debug ssid:%s\n", out->network.ssid);
                continue;
            }

            if (field_number == 0x03) {
                memcpy(out->network.pass, itr.pay+1, itr.len-1);
                continue;
            }
        }
    }

    return 1;
}

static char log_buf[256];
static size_t log_pos = 0;

void log_appendf(const char *fmt, ...) {
    va_list args;
    va_start(args, fmt);
    log_pos += vsnprintf(&log_buf[log_pos], sizeof(log_buf) - log_pos, fmt, args);
    va_end(args);
}

void retrieve_networking_config(const uint8_t *mac, network_setup *out) {
    printf("reading networking config from rom\n");
    // uint32_t ints = save_and_disable_interrupts();

    uint8_t header_buffer[3];
    read_config(header_buffer,3);
    if (header_buffer[0] != 10) {
        printf("no networking config found, creating default config\n");

        char name[NAME_LEN+1];
        mac_to_name(mac, name);

        uint8_t config[FLASH_SIZE];
        size_t config_length = wrap_config(config, name, mac);
        printf("debug config_length %d\n",config_length);
        write_config(config, config_length);

        for (int i = 0; i < config_length; i++) {
            printf("%02X", config[i]);
            printf(" ");
        }
        printf("\n");

        uint8_t secrets[SECURE_FLASH_SIZE];
        size_t secrets_length = wrap_secrets(secrets, name, mac);
        printf("debug secrets_length %d\n",secrets_length);
        write_secrets(secrets, secrets_length);

        for (int i = 0; i < secrets_length; i++) {
            printf("%02X", secrets[i]);
            printf(" ");
        }
        printf("\n");
    }
    read_config(header_buffer,3);
    uint16_t data_length = (header_buffer[1] << 8) | header_buffer[2];
    printf("debug: header %02X %02X %02X length %d \n",header_buffer[0],header_buffer[1],header_buffer[2],data_length);

    uint8_t config_buffer[FLASH_SIZE];
    read_config(config_buffer,data_length+3);
    printf("retrieved config (%d bytes) from rom\n", data_length);

    unmarshal_network_config(config_buffer+3,data_length,mac,out);

    read_secrets(header_buffer,3);
    data_length = (header_buffer[1] << 8) | header_buffer[2];
    printf("debug: header %02X %02X %02X length %d \n",header_buffer[0],header_buffer[1],header_buffer[2],data_length);

    uint8_t secrets_buffer[SECURE_FLASH_SIZE];
    read_secrets(secrets_buffer,data_length+3);
    printf("retrieved secrets (%d bytes) from rom\n", data_length);

    unmarshal_network_config(secrets_buffer+3,data_length,mac,out);
}

uint16_t retrieve_store(uint8_t* data_buffer) {
    printf("retrieving config from rom\n");
    uint32_t ints = save_and_disable_interrupts();

    uint8_t header_buffer[3];
    read_config(header_buffer,3);
    if (header_buffer[0] != 10) {
        restore_interrupts(ints);
        printf("retrieved %d %d %d, no config stored\n", header_buffer[0], header_buffer[1], header_buffer[2]);
        return 0;
    }
    uint16_t data_length = (header_buffer[1] << 8) | header_buffer[2];

    read_config(data_buffer,data_length+3);
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