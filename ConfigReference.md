# Configuration Reference

## The Format

Each control starts with two bytes specifying the type of the control and the length of the ID.
The rest of the message contains the ID, the parameters and ends with a zero byte.

|-type1-|-type2-|-ID-|-parameters-|0x00|

## Types

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