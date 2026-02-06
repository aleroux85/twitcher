#ifndef _MBEDTLS_CONFIG_H
#define _MBEDTLS_CONFIG_H

#if LIB_PICO_SHA1
// Enable hardware acceleration
#define MBEDTLS_SHA1_ALT
#else
#define MBEDTLS_SHA1_C
#endif

#endif