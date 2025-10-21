#ifndef CONFIG_H_INCLUDED
#define CONFIG_H_INCLUDED

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
//     Control* controls;
//     size_t count;
// } ControlList;

// ControlList* unmarshal_controls(const uint8_t* data, size_t length);
void unmarshal_controls(const uint8_t* data, size_t length);
void apply_store(const uint8_t* data, size_t length);
uint16_t retrieve_store(uint8_t* data_buffer);

#endif