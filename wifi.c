#include <stdio.h>
#include <string.h>
#include "pico/stdlib.h"
#include "pico/cyw43_arch.h"
#include "lwip/ip4_addr.h"
#include "lwip/netif.h"
#include "lwip/apps/lwiperf.h"
#include "lwip/dhcp.h"
#include "lwip/pbuf.h"
#include "lwip/tcp.h"
#include "wifi.h"
#include "config.h"

// Connection retry parameters
#define MAX_RETRIES 5
#define RETRY_DELAY_MS 5000

// WiFi credentials - replace with your own
#define WIFI_SSID "RMC"
#define WIFI_PASSWORD "password"

void print_wifi_status(int status_code) {
    printf("WiFi status code: %d - ", status_code);
    switch(status_code) {
        case CYW43_LINK_DOWN:
            printf("Link down\n");
            break;
        case CYW43_LINK_JOIN:
            printf("Joining\n");
            break;
        case CYW43_LINK_NOIP:
            printf("Joined but no IP\n");
            break;
        case CYW43_LINK_UP:
            printf("Connected with IP\n");
            break;
        case CYW43_LINK_FAIL:
            printf("Connection failed\n");
            break;
        case CYW43_LINK_NONET:
            printf("Network not found\n");
            break;
        case CYW43_LINK_BADAUTH:
            printf("Authentication failed\n");
            break;
        default:
            printf("Unknown status\n");
    }
}

void create_wifi_access_point(const network_config nc) {

    printf("\nStarting access point...\n");
    // const char *ssid = "neoGraph-";
    // char ssid[16]; 
    // snprintf(ssid, sizeof(ssid), "neoGraph-%s", name);
    // const char *password = "neoGraph";

    cyw43_arch_enable_ap_mode(nc.ssid, nc.pass, CYW43_AUTH_WPA2_AES_PSK);

    printf("Access point started with SSID: %s\n", nc.ssid);
}

int create_network(const uint8_t *mac) {
    network_setup ns;
    retrieve_networking_config(mac, &ns);

    printf("\nMAC address: ");
    for (int i = 0; i < 6; i++) {
        printf("%02X", mac[i]);
        if (i < 5) printf(":");
    }
    printf("\nDevice name: %s\n",ns.device.name);
    printf("Network name: %s\n",ns.network.name);
    printf("Network ssid: %s\n",ns.network.ssid);
    printf("Network opts: %d\n",ns.network.opts);

    // char name[] = "ABCD";
    if ((ns.network.opts&1) == 0) {
        printf("Create network access point\n");
    create_wifi_access_point(ns.network);
    } else {
        printf("Connect to WiFi\n");
        return connect_to_wifi(ns.network);
    }
    return 0;
}

int connect_to_wifi(const network_config nw) {
    const char* static_ip = NULL;
    const char* static_netmask = NULL;
    const char* static_gateway = NULL;

    cyw43_arch_enable_sta_mode();

    printf("Connecting to WiFi, SSID: %s\n", nw.ssid);
    int result = cyw43_arch_wifi_connect_timeout_ms(nw.ssid, nw.pass, CYW43_AUTH_WPA2_AES_PSK, 10000);
    print_wifi_status(result);

    int retries = 0;
    while (result && retries < MAX_RETRIES) {
        printf("Connection failed, waiting %d ms before retrying...\n", RETRY_DELAY_MS);
        sleep_ms(RETRY_DELAY_MS);

        printf("Retrying connection (attempt %d of %d)...\n", retries + 1, MAX_RETRIES);
        result = cyw43_arch_wifi_connect_timeout_ms(nw.ssid, nw.pass, CYW43_AUTH_WPA2_AES_PSK, 10000);
        
        retries++;
    }
    
    if (result) {
        printf("Failed to connect to WiFi after %d attempts\n", MAX_RETRIES);
        // cyw43_arch_deinit();
        return 1;
    }
    print_wifi_status(result);

    if (static_ip != NULL) {
        ip4_addr_t ip, netmask, gateway;
        dhcp_stop(netif_list);
        
        // Parse IP addresses
        if (!ip4addr_aton(static_ip, &ip)) {
            printf("Error: Invalid static IP address format: %s\n", static_ip);
            return 3;
        }

        // Use default netmask if not provided
        if (static_netmask != NULL) {
            if (!ip4addr_aton(static_netmask, &netmask)) {
                printf("Error: Invalid netmask format: %s\n", static_netmask);
                return 3;
            }
        } else {
            // Default to 255.255.255.0
            IP4_ADDR(&netmask, 255, 255, 255, 0);
        }
        
        // Use default gateway if not provided
        if (static_gateway != NULL) {
            if (!ip4addr_aton(static_gateway, &gateway)) {
                printf("Error: Invalid gateway format: %s\n", static_gateway);
                return 3;
            }
        } else {
            // Try to use the router's IP (usually .1 in the same subnet)
            gateway = ip;
            ip4_addr_set_u32(&gateway, (ip4_addr_get_u32(&ip) & ip4_addr_get_u32(&netmask)) | PP_HTONL(1));
        }
        
        printf("Setting static IP configuration:\n");
        printf("  IP: %s\n", ip4addr_ntoa(&ip));
        printf("  Netmask: %s\n", ip4addr_ntoa(&netmask));
        printf("  Gateway: %s\n", ip4addr_ntoa(&gateway));
        
        // Set the static IP configuration
        netif_set_addr(netif_list, &ip, &netmask, &gateway);
        
        // Verify the configuration was applied
        sleep_ms(1000);
        ip4_addr_t current_ip = netif_list->ip_addr;
        if (!ip4_addr_cmp(&current_ip, &ip)) {
            printf("Warning: Static IP may not have been set correctly\n");
            printf("Expected: %s, Got: %s\n", ip4addr_ntoa(&ip), ip4addr_ntoa(&current_ip));
        } else {
            printf("Static IP configuration applied successfully!\n");
        }
    } else {
        printf("Connected to WiFi successfully!\n");
        ip4_addr_t gw = netif_list->gw;
        printf("Gateway address: %s\n", ip4addr_ntoa(&gw));
        
        printf("Ensuring DHCP is complete...\n");
        sleep_ms(2000);
        
        // Get and print the IP address
        ip4_addr_t ip = netif_list->ip_addr;
        printf("IP address: %s\n", ip4addr_ntoa(&ip));
        
        // Check if we have a valid IP (not 0.0.0.0)
        if (ip4_addr_isany_val(ip)) {
            printf("Error: No valid IP address assigned. DHCP may have failed.\n");
            
            // Try to manually renew DHCP
            printf("Attempting to renew DHCP lease...\n");
            dhcp_renew(netif_list);
            
            // Wait for DHCP to complete
            sleep_ms(5000);
            
            // Check IP again
            ip = netif_list->ip_addr;
            printf("IP address after DHCP renewal: %s\n", ip4addr_ntoa(&ip));
            
            if (ip4_addr_isany_val(ip)) {
                printf("Still no valid IP address. Please check your router settings.\n");
                return 2;
            }
        }
    }
    
    return 0;
}