#ifndef PROTOCOL_H
#define PROTOCOL_H

#include <stdint.h>

/* 
 * Communication Protocol Definition (UART/USB/TCP)
 * Frame Format: [HEADER][CMD][LEN][DATA...][CHECKSUM][FOOTER]
 */

#define PROTOCOL_HEADER 0xAA
#define PROTOCOL_FOOTER 0x55

typedef enum {
    CMD_GET_STATUS = 0x01,
    CMD_MOVE_ABS   = 0x02,
    CMD_MOVE_REL   = 0x03,
    CMD_SET_OBJ    = 0x04,
    CMD_SET_MODE   = 0x05,
    CMD_ROI_ADD    = 0x06,
    CMD_ROI_CLEAR  = 0x07,
    CMD_SHUTTER    = 0x08,
    CMD_ERROR      = 0xEE,
    CMD_ACK        = 0xFF
} Command_t;

#pragma pack(push, 1)
typedef struct {
    uint8_t header;    // 0xAA
    uint8_t command;   // Command_t
    uint8_t length;    // Payload length
    uint8_t payload[32];
    uint8_t checksum;  // Simple XOR or Sum
    uint8_t footer;    // 0x55
} Packet_t;
#pragma pack(pop)

/**
 * @brief Calculate a simple checksum for the packet.
 */
uint8_t Protocol_CalculateChecksum(const Packet_t* p) {
    uint8_t sum = p->command + p->length;
    for (int i = 0; i < p->length; i++) {
        sum += p->payload[i];
    }
    return sum;
}

#endif /* PROTOCOL_H */
