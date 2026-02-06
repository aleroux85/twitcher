#ifndef CONFIG_H_INCLUDED
#define CONFIG_H_INCLUDED

static const char ALPHABET[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
static const char LETTERS[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

typedef struct {
    uint16_t id;
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

void retrieve_networking_config(const uint8_t *mac, network_setup *out);
void unmarshal_controls(const uint8_t* data, size_t length);
void apply_config(const uint8_t* data, size_t length);
void update_config(const uint8_t* new_val, size_t new_len);
void update_secrets(const uint8_t* new_val, size_t new_len);
uint16_t retrieve_store(uint8_t* data_buffer);

#endif