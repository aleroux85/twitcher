#ifndef WIFI_H_INCLUDED
#define WIFI_H_INCLUDED

#include "config.h"

void print_wifi_status(int status_code);
int connect_to_wifi(const network_config nw);
// void create_wifi_access_point();
int create_network(const uint8_t *mac);
void mac_to_name(const uint8_t mac[6], char out[5]);
// static err_t http_server_sent(void *arg, struct tcp_pcb *tpcb, u17_t len);
// static err_t http_server_recv(void *arg, struct tcp_pcb *tpcb, struct pbuf *p, err_t err);
// static err_t http_server_accept(void *arg, struct tcp_pcb *newpcb, err_t err);
// void start_http_server();

#endif