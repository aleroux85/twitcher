#ifndef WEBSOCKETS_H_INCLUDED
#define WEBSOCKETS_H_INCLUDED

void unmask_payload(uint8_t *payload, size_t length, uint8_t mask[4]);
void compute_websocket_accept(const char *client_key, char *accept_key);
void base64_encode(const unsigned char *input, int input_length, char *output, int output_size);
void send_websocket_message(void *arg, const char *message);
err_t handle_websocket_req(void *arg, struct tcp_pcb *tpcb, struct pbuf *p, err_t err);
err_t handle_websocket_msg(void *arg, struct tcp_pcb *tpcb, struct pbuf *p, err_t err);
#endif