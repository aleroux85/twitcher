#ifndef CONFIG_H_INCLUDED
#define CONFIG_H_INCLUDED

#include "pico/unique_id.h"

#define FLASH_SIZE 0x1000
#define SECURE_FLASH_SIZE 0x100

#define FLASH_TARGET_OFFSET (PICO_FLASH_SIZE_BYTES - FLASH_SIZE)
#define SECURE_FLASH_TARGET_OFFSET (PICO_FLASH_SIZE_BYTES - FLASH_SIZE - SECURE_FLASH_SIZE)

static const char ALPHABET[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
static const char LETTERS[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

typedef struct {
    uint16_t id;
    uint8_t did[PICO_UNIQUE_BOARD_ID_SIZE_BYTES];
    char name[32];
    uint16_t network;
} device_config;

typedef struct {
    uint16_t id;
    uint8_t opts;
    char name[32];
    char ssid[32];
    char pass[32];
} network_config;

typedef struct {
    device_config device;
    network_config network;
} network_setup;

typedef enum {
    CONFIG_OPERATION_CONTROL_ACTION = 1,
    CONFIG_OPERATION_TYPE_SETUP = 2,
    CONFIG_OPERATION_TYPE_CLEAN_SETUP = 3
} ConfigOpType;

typedef enum {
    CONTROL_TYPE_LED = 0x30,
    CONTROL_TYPE_GPIO = 0x31,
    CONTROL_TYPE_PWM = 0x32
} PayloadType;

typedef struct {
    uint8_t type;
    uint16_t id;
    PayloadType payload_type;

    union {
        uint16_t ref_id;     // for type 0x01
        struct {
            uint8_t length;
            char* str;
        } string_payload;    // for type 0xA0
    };
} Control;

// typedef struct {
//     const uint8_t *buf;
//     uint8_t *pay;
//     size_t pos;
//     size_t size;
//     uint8_t type;
//     uint16_t id;
//     uint8_t len;
// } config_element_iterator;

// typedef struct {
//     Control* controls;
//     size_t count;
// } ControlList;

void retrieve_networking_config(network_setup *out);
void unmarshal_controls(const uint8_t* data, size_t length);
void apply_config(const uint8_t* data, size_t length);
void update_config(const uint8_t* new_val, size_t new_len);
void update_secrets(const uint8_t* new_val, size_t new_len);
uint16_t retrieve_store(uint8_t* data_buffer);

#endif