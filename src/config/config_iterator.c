// #include <stdio.h>
// #include <stdlib.h>
// #include <stdint.h>
// #include <string.h>
// #include <stdbool.h>
// #include <stddef.h>

#include "config_iterator.h"

// bool next_config_element(config_element_iterator *elms) {
//     // if (elms->pos >= elms->size) return false;

//     // if (elms->pos == 0 && elms->pay == NULL) {
//     //     if (elms->type == 0x0A) {
//     //         elms->pos = 3;
//     //     }
//     // } else {
//         elms->pos += (elms->pos + 5 + elms->len);
//     // }

//     // if (elms->pos >= elms->size) {
//     //     elms->pay = NULL;
//     //     return true;
//     // }
//     elms->type = elms->buf[elms->pos];
//     elms->id = elms->buf[elms->pos+2]<<8 | elms->buf[elms->pos+3];
//     elms->len = elms->buf[elms->pos+4];
//     // elms->pay = elms->buf+elms->pos+5;
//     // memcpy(elms->pay, elms->buf+elms->pos+5, elms->len);

//     // printf("debug pos:%d, size:%d, type:%X, id:%d, len:%d\n",elms->pos,elms->size,elms->type,elms->id,elms->len);
//     return true;
// }

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>
#include <string.h>

static bool cei_has_next(config_element_iterator *it)
{
    /* Need at least header bytes */
    if (it->pos + 5 > it->size)
        return false;

    uint8_t len = it->buf[it->pos + 4];

    /* Full message must fit */
    return (it->pos + 5 + len) <= it->size;
}

static bool cei_next(config_element_iterator *it)
{
    if (!cei_has_next(it))
        return false;

    const uint8_t *p = &it->buf[it->pos];
    
    // printf("here has next %02X %02X %02X %02X\n",p[0],p[1],p[2],p[3]);
    it->type = p[0];

    // /* Element ID (example: big-endian) */
    it->id = (uint16_t)p[2] << 8 | p[3];

    it->len = p[4];
    it->pay = &p[5];

    /* Advance iterator */
    it->pos += 5 + it->len;

    return true;
}

static void cei_reset(config_element_iterator *it)
{
    it->pos = 0;
}

void config_element_iterator_init(
    config_element_iterator *it,
    const uint8_t *buf,
    size_t size
) {
    it->buf  = buf;
    it->size = size;
    it->pos  = 0;

    it->has_next = cei_has_next;
    it->next     = cei_next;
    it->reset    = cei_reset;
}