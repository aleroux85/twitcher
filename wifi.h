#ifndef WIFI_H_INCLUDED
#define WIFI_H_INCLUDED

void print_wifi_status(int status_code);
int connect_to_wifi(const char* static_ip, const char* static_netmask, const char* static_gateway);
void create_wifi_access_point();
// static err_t http_server_sent(void *arg, struct tcp_pcb *tpcb, u17_t len);
// static err_t http_server_recv(void *arg, struct tcp_pcb *tpcb, struct pbuf *p, err_t err);
// static err_t http_server_accept(void *arg, struct tcp_pcb *newpcb, err_t err);
// void start_http_server();

#endif