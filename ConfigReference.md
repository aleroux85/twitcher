# Protocol Reference

This describes the protocol between the hardware device and the web interface
once the websocket has been opened. It describes the format of the configuration
that is setup on the interface and sent to the hardware. The hardware stores the
config and uses it to setup its IOs. The hardware can the recieve commands that
is the second part of this protocol and know how to handle the commands.

When a websocket connection is opened the device will check for an existing
configuration. If a configuration has already been stored on the device it will
configure itself and send the configuration to the web interface where it is
restored as well.

## The Configuration Format

The payload of the configuration message always start with 0x0A (the message type).
It is then followed by two bytes indicating the length of the message. The length
includes the type and 2 lenght bytes.

+---------+------------------------+-----------------------------+
|  Byte   |        Field           |       Description           |
+---------+------------------------+-----------------------------+
|   0     | Message Type           | 1 byte                      |
| 1 – 2   | Length (LE: LSB→MSB)   | 2 bytes = payload size      |
|   3..   | Payload                | Length bytes                |
+---------+------------------------+-----------------------------+

### Configuration Elements

The message payload consists of a sequential list of configuration elements. Each element begins with a 1-byte Element Type field indicating how the element should be interpreted, followed by a 1-byte Reserved field currently unused. This is followed by a 2-byte Element ID (endianness defined by the protocol), which uniquely identifies the element. Next is a 1-byte Element Length that specifies the size of the element’s payload in bytes. The remainder of the element consists of the Element Payload, whose structure and meaning depend on the Element Type. Elements are packed back-to-back in the message payload with no padding.

+---------+------------------------+---------------------------------------------+
|  Byte   |        Field           |                 Description                 |
+---------+------------------------+---------------------------------------------+
|   0     | Element Type           | 1 byte — defines how payload is interpreted |
|   1     | Reserved               | 1 byte — currently unused                   |
| 2 – 3   | Element ID             | 2 bytes — unique identifier (LE or BE)      |
|   4     | Element Length         | 1 byte — size of Element Payload in bytes   |
| 5..N    | Element Payload        | Variable — depends on Element Type          |
+---------+------------------------+---------------------------------------------+

### Element Types

0x01: UI input button
0x02: UI input switch
0x03: UI input slider
0x04: UI input dial
0x05: UI input 2D slider
0x06: UI input multi slider
0x07: UI input timer

0x10: UI output gauge
0x11: UI output indicator
0x12: UI output graph

0x20: HW input Core
0x21: HW input GPI
0x22: HW input ADC

0x30: HW output LED
0x31: HW output GPO
0x32: HW output PWM

0xA0: string

### UI Input Button

1|type 1
1|type 2
2|ID
1|options
4|RGBA
2|name ID

### HW Output LED

1|type 1
1|type 2
2|ID
2|input ID

## Config data

A config is either sent from the client or loaded from the controller ROM and sent to the client.

| cf rv cl |
| 0A 00 19 |

| et | rv | el-id | el | tx-id | rf-id |
| 01 | 00 | 00 01 | 04 | 00 02 | 00 03 |

| et | rv | el-id | el | payload: "Button" |
| A0 | 00 | 00 02 | 06 | 42 75 74 74 6F 6E |

| et | rv | el-id | el |
| 30 | 00 | 00 03 | 00 |