# Protocol Reference

This document defines the communication protocol used between the hardware
device (HW) and the browser user interface (UI) once a WebSocket connection has been
established. It specifies the binary message formats used for transferring
network settings and control configuration as well as runtime commands and
control data.

The hardware device stores its
configuration locally and uses it to initialize and manage its networking, I/O pins,
peripherals, and control logic. When a WebSocket connection is opened, the device
transmits the stored configuration to the UI.

All data communication is sent in, what is called in this reference, a "packet".
The packet header contains a packet type and a length of the packet payload.

```none
+---------+------------------------+---------------------------------------------+
|  Byte   |        Field           |                 Description                 |
+---------+------------------------+---------------------------------------------+
|   0     | Packet Type            | 1 byte — defines what messages are sent     |
| 1 – 2   | Payload Length         | 2 bytes — the packet payload length         |
| 3..N    | Packet Payload         | Variable — the payload of the packet        |
+---------+------------------------+---------------------------------------------+
```

Every packet have a packet type that specifies whether it is a configuration
carrying packet, a data value packet or a command packet. The packet type is
a single byte and always transmitted in the first byte.

```none
+-----+------+-----------------------+--------------+
| Dec | Hex  | Type                  | Use Messages |
+-----+------+-----------------------+--------------+
|  1  | 0x01 | Command               | Yes          |
|  2  | 0x02 | Data Value            | No           |
| 10  | 0x0A | Configuration         | Yes          |
| 11  | 0x0B | Update Config Field/s | Yes          |
| 12  | 0x0C | Update Secret Field/s | Yes          |
| 13  | 0x0D | Send HW DID to UI     | No           |
+-----+------+-----------------------+--------------+
```

A "message", refered to in the last column of the table above, is one common pattern.
Some packets use messages and others not as indicated the table above.

## Common Patterns

There are a few patterns that are reused. The most common example is the message
pattern that can be used in the packet payload. It can thus be warpped as follows.

```none
Packet
┌───────────────────────────────────────────────┐
│ Packet Type (1 byte)                          │
│ Payload Length (2 bytes)                      │
│                                               │
│   Message 1                                   │
│   ┌───────────────────────────────────────┐   │
│   │ Message Type (1)                      │   │
│   │ Reserved (1)                          │   │
│   │ Element ID (2)                        │   │
│   │ Payload Length (1)                    │   │
│   │ Message Payload (N)                   │   │
│   └───────────────────────────────────────┘   │
│                                               │
│   Message 2                                   │
│   ┌───────────────────────────────────────┐   │
│   │ ...                                   │   │
│   └───────────────────────────────────────┘   │
└───────────────────────────────────────────────┘
```

### Messages

The Packet payload can contains multiple messages that has the following protocol.

```none
+---------+------------------------+---------------------------------------------+
|  Byte   |        Field           |                 Description                 |
+---------+------------------------+---------------------------------------------+
|   0     | Message Type           | 1 byte — defines how payload is interpreted |
|   1     | Reserved               | 1 byte — currently unused                   |
| 2 – 3   | Element ID             | 2 bytes — unique identifier (big endian)    |
|   4     | Payload Length         | 1 byte — size of Message payload in bytes   |
| 5..N    | Message Payload        | Variable — depends on Message type          |
+---------+------------------------+---------------------------------------------+
```

Each message begins with a 1-byte Message Type field indicating how the message
should be interpreted, followed by a 1-byte Reserved field currently unused.
This is followed by a 2-byte Element ID (in big endian),
which uniquely identifies the element.

The term 'Element' is introduced to refer to configuration and control elements
that can be defined with messages. Some messages will use the Element ID to specify
a unique ID for a network, device, IO configuration, etc. Others will use the
Element ID to refer to a previously configured ID.

Next is a 1-byte Payload Length that
specifies the size of the message payload in bytes. The remainder of the
message consists of the Message Payload, whose structure and meaning depend on
the Message Type.

### Elements

The concept of elements refers to individual IO (and other) components like
a button, a GPIO or even a string containg a label of another element.
Each element has an element ID attached that can be used to refer to.

### IDs

IDs are 2 byte numbers in big endian and is mostly used to identify and reference elements.

## Message Types

The first byte in the message is the message type and is used to show how the message payload
should be parsed. The Message Type field is 8 bits wide. When bits 7 and 6 are both 0,
the Message Type represents an I/O Type.

```none
Bit Layout (MSB → LSB)

  7   6   5   4   3   2   1   0
+---+---+---+---+---------------+
| 0 | 0 | L | D |   Type ID     |
+---+---+---+---+---------------+

+-----+---------------+---------------------------------------------+
| Bit | Name          | Description                                 |
+-----+---------------+---------------------------------------------+
| 7   | Class         | MUST be 0 for I/O types                     |
| 6   | Class         | MUST be 0 for I/O types                     |
| 5   | Location (L)  | 0 = Hardware device, 1 = UI (Web Interface) |
| 4   | Direction (D) | 0 = Output element, 1 = Input element       |
| 3–0 | Type ID       | 4-bit subtype identifier                    |
+-----+---------------+---------------------------------------------+
```

### Control Elements

Control elements are UI and HW, input and output elements.

#### UI Output

UI output elements are meant to display events and data on the UI.

```none
+-----+------+---------------------+
| Dec | Hex  | Type                |
+-----+------+---------------------+
|   0 | 0x00 | UI output gauge     |
|   1 | 0x01 | UI output indicator |
|   2 | 0x02 | UI output graph     |
+-----+------+---------------------+
```

#### UI Input

UI input elements are meant to control and send events from the UI.

```none
+-----+------+-----------------------+
| Dec | Hex  | Type                  |
+-----+------+-----------------------+
|  16 | 0x10 | UI input button       |
|  17 | 0x11 | UI input switch       |
|  18 | 0x12 | UI input slider       |
|  19 | 0x13 | UI input 2D slider    |
|  20 | 0x14 | UI input multi slider |
|  21 | 0x15 | UI input dial         |
|  22 | 0x16 | UI input timer        |
+-----+------+-----------------------+
```

#### HW Output

HW output elements are meant to output signals on the GPIO pins.

```none
+-----+------+---------------------+
| Dec | Hex  | Type                |
+-----+------+---------------------+
|  32 | 0x20 | HW output LED       |
|  33 | 0x21 | HW output GPO       |
|  34 | 0x22 | HW output PWM       |
+-----+------+---------------------+
```

#### HW Input

HW input elements are meant to read input signals on the GPIO pins.

```none
+-----+------+---------------------+
| Dec | Hex  | Type                |
+-----+------+---------------------+
|  48 | 0x30 | HW input Core       |
|  49 | 0x31 | HW input GPI        |
|  50 | 0x32 | HW input ADC        |
+-----+------+---------------------+
```

### Supporting Elements

```none
+-----+------+--------------+
| Dec | Hex  | Type         |
+-----+------+--------------+
| 160 | 0xA0 | String       |
+-----+------+--------------+
```

### Networking Elements

```none
+-----+------+----------------+
| Dec | Hex  | Type           |
+-----+------+----------------+
| 176 | 0xB0 | Device IDs     |
| 177 | 0xB1 | Device Fields  |
| 178 | 0xB2 | Network IDs    |
| 179 | 0xB3 | Network Fields |
+-----+------+----------------+
```

## Commands

Commands (package type 0x01) are used to send a command (mostly UI to HW)
to perform an action. A typical example is if the user presses a button on
the UI and the HW toggles a GPIO pin.

```none
+---------+------------------------+---------------------------------------------+
|  Byte   |        Field           |                 Description                 |
+---------+------------------------+---------------------------------------------+
|   0     | Message Type           | Defines how command payload is interpreted  |
|   1     | Reserved               | Currently unused                            |
| 2 – 3   | Element ID             | Identifier of initiating element            |
|   4     | Payload Length         | Size of command payload in bytes            |
| 5..N    | Message Payload        | Command payload                             |
+---------+------------------------+---------------------------------------------+
```

### Button Payload

```none
+---------+------------------------+---------------------------------------------+
|  Byte   |        Field           |                 Description                 |
+---------+------------------------+---------------------------------------------+
| 0 – 1   | Button Value           | 2 bytes — the value, 0 or 1 (big endian)    |
+---------+------------------------+---------------------------------------------+
```

## Configuration

### Control Configuration

#### UI Input Elements

```none
Button Payload

+---------+------------------------+-----------------------------------------------------------+
|  Byte   |        Field           |                         Description                       |
+---------+------------------------+-----------------------------------------------------------+
| 0 – 1   | Label ID               | 2 bytes — reference to string element holding label text  |
| 2 – 3   | X value                | 2 bytes — X value on UI                                   |
| 4 – 5   | Y value                | 2 bytes — Y value on UI                                   |
|   6     | Button style options   | 1 byte — how the button should look                       |
+---------+------------------------+-----------------------------------------------------------+
```

#### HW Output Elements

```none
LED Payload

+---------+------------------------+----------------------------------------+
|  Byte   |        Field           |            Description                 |
+---------+------------------------+----------------------------------------+
| 0 – 1   | Source Element ID      | 2 bytes — reference to source element  |
+---------+------------------------+----------------------------------------+
```

### Networking Config Elements

The network config elements utilize message types 0xB0-0xB3. Types 0xB2 and 0xB3 define networks and network fields. Types 0xB0 and 0xB1 define devices and device fields. The payload of these types
start with a field type number followed by a field value.

```none
+---------+------------------------+---------------------------------------------+
|  Byte   |        Field           |                 Description                 |
+---------+------------------------+---------------------------------------------+
|   0     | Message Type           | 1 byte — 0xB0 to 0xB3                       |
|   1     | Reserved               | 1 byte — currently unused                   |
| 2 – 3   | Element ID             | 2 bytes — unique identifier (LE or BE)      |
|   4     | Payload Length         | 1 byte — size of Element Payload in bytes   |
|   5     | Field ID               | 1 byte — the Field ID (part of Payload)     |
| 6..N    | Field Value            | Variable — Field value                      |
+---------+------------------------+---------------------------------------------+
```

Types 0xB2 and oxB0 list the existing networks and devices respectively. The element IDs in these messages are the unique ID for a specific network or device. Types 0xB3 and 0xB1 reference these IDs to link the element values to the relevant network or device.

#### Network Listing and Fields

A network can be defined with a message type 0xB2 and multiple 0xB3 messages. Here is
an example of such a network definition.

```none
+---------+------------------------+---------------------------------------------+
|  Byte   |        Field           |                 Description                 |
+---------+------------------------+---------------------------------------------+
|   0     | Message Type           | 1 byte — 0xB2                               |
|   1     | Reserved               | 1 byte — currently unused                   |
| 2 – 3   | Element ID             | 2 bytes — 0x0000 (the unique network ID)    |
|   4     | Payload Length         | 1 byte — 0x02 (payload length 2)            |
|   5     | Field Type             | 1 byte — 0x00 (the options field)           |
|   6     | Field Value            | 1 byte — 0x00 (the options value)           |
+---------+------------------------+---------------------------------------------+
```

Note that the 0xB2 message above had a Field Type 0x00. It can actually have any field or
even no field at all. More fields are set in additional 0xB3 messages as follows.

```none
+---------+------------------------+---------------------------------------------+
|  Byte   |        Field           |                 Description                 |
+---------+------------------------+---------------------------------------------+
|   0     | Message Type           | 1 byte — 0xB3                               |
|   1     | Reserved               | 1 byte — currently unused                   |
| 2 – 3   | Element ID             | 2 bytes — 0x0000 (the network ID defined)   |
|   4     | Payload Length         | 1 byte — 0x04 (payload length 4)            |
|   5     | Field Type             | 1 byte — 0x01 (the name field)              |
| 6 – 9   | Field Value            | 3 bytes — "ABC" (the name of the network)   |
+---------+------------------------+---------------------------------------------+
```

The 0xB3 message can be repeated to set every field of the example network "ABC" (Element ID 0x0000). The posible network field types are:

```none
+-----+------+----------------+
| Dec | Hex  | Type           |
+-----+------+----------------+
|  0  | 0x00 | Options        |
|  1  | 0x01 | Name           |
|  2  | 0x02 | SSID           |
|  3  | 0x03 | Password       |
+-----+------+----------------+
```

#### Device Listing and Fields

A device can be defined with a message type 0xB0 and multiple 0xB1 messages. Here is
an example of such a device definition.

```none
+---------+------------------------+---------------------------------------------+
|  Byte   |        Field           |                 Description                 |
+---------+------------------------+---------------------------------------------+
|   0     | Message Type           | 1 byte — 0xB0                               |
|   1     | Reserved               | 1 byte — currently unused                   |
| 2 – 3   | Element ID             | 2 bytes — 0x0000 (the unique device ID)     |
|   4     | Payload Length         | 1 byte — 0x07 (payload length 7)            |
|   5     | Field Type             | 1 byte — 0x00 (the MAC field)               |
|   6     | Field Value            | 1 byte — 0x00 (the MAC value)               |
+---------+------------------------+---------------------------------------------+
```

Note again that the 0xB0 message above had a Field Type 0x00. It can actually have any field or even no field at all.More fields are set in additional 0xB3 messages as follows.

```none
+---------+------------------------+---------------------------------------------+
|  Byte   |        Field           |                 Description                 |
+---------+------------------------+---------------------------------------------+
|   0     | Message Type           | 1 byte — 0xB3                               |
|   1     | Reserved               | 1 byte — currently unused                   |
| 2 – 3   | Element ID             | 2 bytes — 0x0000 (the device ID defined)    |
|   4     | Payload Length         | 1 byte — 0x04 (payload length 4)            |
|   5     | Field Type             | 1 byte — 0x01 (the name field)              |
| 6 – 9   | Field Value            | 3 bytes — "XYZ" (the name of the device)    |
+---------+------------------------+---------------------------------------------+
```

The 0xB1 message can be repeated to set every field of the example device "XYZ" (Element ID 0x0000). The posible device field types are:

```none
+-----+------+-----------------------------------------------+
| Dec | Hex  | Type                                          |
+-----+------+-----------------------------------------------+
|  0  | 0x00 | DID - a unique Device ID                      |
|  1  | 0x01 | Name                                          |
|  2  | 0x02 | The Network Element ID this device is part of |
+-----+------+-----------------------------------------------+
```

### Config Data Example

A config is either sent from the client or loaded from the controller ROM and sent to the client.

| cf rv cl |
| 0A 00 19 |

| et | rv | el-id | el | tx-id | rf-id |
| 01 | 00 | 00 01 | 04 | 00 02 | 00 03 |

| et | rv | el-id | el | payload: "Button" |
| A0 | 00 | 00 02 | 06 | 42 75 74 74 6F 6E |

| et | rv | el-id | el |
| 30 | 00 | 00 03 | 00 |

## EBNF

```EBNF

(* Packet structure *)
packet = packet header, packet body ;

packet header = packet type, packet length ;

packet type = data value | full config | config field ;
data value = "01" ;
full config = "0A" ;
config field = "0B" ;

packet length = byte, byte ;

packet body = {message} ;

(* Message structure *)
message = msg type, msg options, elm id, msg payload length, msg payload ;

byte = digit, digit ;
digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "A" | "B" | "C" | "D" | "E" | "F" ;
```

## Sending MAC

After a websocket request have been established the hardware immediately send a its Device ID (DID) to the UI to associate it with an IP for future networking operations.

```none
+---------+------------------+-------------------+
|  Byte   |      Field       |    Description    |
+---------+------------------+-------------------+
|   0     | Packet Type      | 1 byte — 0x0D     |
| 1 – 2   | Payload Length   | 2 bytes — 0x06    |
| 3 – 10  | DID              | 8 bytes           |
+---------+------------------+-------------------+
```
