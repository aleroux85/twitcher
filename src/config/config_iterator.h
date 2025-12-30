#ifndef CONFIG_ITERATOR_H_INCLUDED
#define CONFIG_ITERATOR_H_INCLUDED

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <stdbool.h>
#include <stddef.h>

typedef struct config_element_iterator {
    /* Data */
    const uint8_t *buf;
    size_t size;
    size_t pos;
    
    uint8_t  type;
    uint16_t id;
    uint8_t  len;
    const uint8_t *pay;
    
    /* "Methods" */
    bool (*has_next)(struct config_element_iterator *it);
    bool (*next)(struct config_element_iterator *it);
    void (*reset)(struct config_element_iterator *it);
} config_element_iterator;

void config_element_iterator_init(
    config_element_iterator *it,
    const uint8_t *buf,
    size_t size
);
// bool next_config_element(config_element_iterator *elms);

#endif