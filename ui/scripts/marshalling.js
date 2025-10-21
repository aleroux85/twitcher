
        function marshalControls(controls) {
            const encoder = new TextEncoder();
            const output = [];

            for (const [idStr, control] of Object.entries(controls)) {
                const id = parseInt(idStr);
                const buffer = [];

                // Type (1 byte)
                buffer.push(control.type & 0xFF);

                // Empty byte (1 byte)
                buffer.push(0x00);

                // ID (2 bytes, big endian)
                buffer.push((id >> 8) & 0xFF, id & 0xFF);

                // Type-specific payload
                switch (control.type) {
                    case 1:{
                        buffer.push(0x04);
                        const nameId = control.name;
                        buffer.push((nameId >> 8) & 0xFF, nameId & 0xFF);
                        const targetId = control.target;
                        buffer.push((targetId >> 8) & 0xFF, targetId & 0xFF);
                        break;
                    }
                    case 3:{
                        buffer.push(0x0B);
                        buffer.push((control.name >> 8) & 0xFF, control.name & 0xFF);
                        buffer.push((control.target >> 8) & 0xFF, control.target & 0xFF);
                        buffer.push((control.len << 1) & 0xFE | control.orientation & 0x01);
                        buffer.push((control.min >> 8) & 0xFF, control.min & 0xFF);
                        buffer.push((control.max >> 8) & 0xFF, control.max & 0xFF);
                        buffer.push((control.val >> 8) & 0xFF, control.val & 0xFF);
                        break;
                    }
                    case 160:{
                        const encodedStr = encoder.encode(control.string);
                        if (encodedStr.length > 255) {
                            throw new Error("String too long for 1-byte length prefix");
                        }
                        buffer.push(encodedStr.length);
                        buffer.push(...encodedStr);
                        break;
                    }
                    case 48:{
                        buffer.push(0x00);
                        break;
                    }
                    case 49:{
                        buffer.push(0x01);
                        buffer.push(control.gpio);
                        break;
                    }
                    case 50:{
                        buffer.push(0x0D);
                        buffer.push(control.gpio);
                        buffer.push((control.freq>>8)&0xFF);
                        buffer.push((control.freq>>0)&0xFF);
                        if (control.valx >= 0) {
                            buffer.push((control.valx>>8)&0xFF);
                            buffer.push((control.valx)&0xFF);
                        } else {
                            buffer.push((((1<<16)+control.valx)>>8)&0xFF);
                            buffer.push((((1<<16)+control.valx))&0xFF);
                        }

                        buffer.push((control.dtc0>>8)&0xFF);
                        buffer.push((control.dtc0>>0)&0xFF);
                        if (control.val0 >= 0) {
                            buffer.push((control.val0>>8)&0xFF);
                            buffer.push((control.val0)&0xFF);
                        } else {
                            buffer.push((((1<<16)+control.val0)>>8)&0xFF);
                            buffer.push((((1<<16)+control.val0))&0xFF);
                        }

                        buffer.push((control.dtc1>>8)&0xFF);
                        buffer.push((control.dtc1>>0)&0xFF);
                        if (control.val1 >= 0) {
                            buffer.push((control.val1>>8)&0xFF);
                            buffer.push((control.val1)&0xFF);
                        } else {
                            buffer.push((((1<<16)+control.val1)>>8)&0xFF);
                            buffer.push((((1<<16)+control.val1))&0xFF);
                        }

                        break;
                    }
                    default:
                        throw new Error(`Unknown control type: ${control.type}`);
                }

                output.push(...buffer);
            }

            return Uint8Array.from(output);
        }

        function unmarshalControls(binary) {
            const decoder = new TextDecoder();
            const view = new DataView(binary.buffer, binary.byteOffset, binary.byteLength);
            const controls = {};
            let offset = 0;

            while (offset < binary.length) {
                // Type (1 byte)
                const type = view.getUint8(offset++);

                // Empty byte (skip)
                offset++;

                // ID (2 bytes, big endian)
                const id = view.getUint16(offset);
                offset += 2;

                // Initialize the control
                const control = { type };

                // Type-specific payload
                switch (type) {
                    case 1: {
                        // 2 bytes: reference to another control's ID
                        offset++;
                        const nameId = view.getUint16(offset);
                        control.name = nameId;
                        offset += 2;
                        const targetId = view.getUint16(offset);
                        control.target = targetId;
                        offset += 2;
                        break;
                    }
                    case 3: {
                        offset++;
                        control.name = view.getUint16(offset);
                        offset += 2;
                        control.target = view.getUint16(offset);
                        offset += 2;
                        const lenAndOrient = view.getUint8(offset++);
                        control.len = lenAndOrient >> 1;
                        control.orientation = lenAndOrient & 0x01;
                        control.min = view.getInt16(offset);
                        offset += 2;
                        control.max = view.getInt16(offset);
                        offset += 2;
                        control.val = view.getInt16(offset);
                        offset += 2;
                        break;
                    }
                    case 160: {
                        // 1 byte: string length, then string bytes
                        const strLen = view.getUint8(offset++);
                        const strBytes = binary.slice(offset, offset + strLen);
                        control.string = decoder.decode(strBytes);
                        offset += strLen;
                        break;
                    }
                    case 48: {
                        // No payload
                        offset++;
                        break;
                    }
                    case 49: {
                        offset++;
                        control.gpio = view.getUint8(offset++);
                        break;
                    }
                    case 50: {
                        offset++;
                        control.gpio = view.getUint8(offset++);
                        control.freq = view.getUint16(offset);
                        offset += 2;

                        let valx = view.getInt16(offset);
                        control.valx = valx;
                        offset += 2;

                        control.dtc0 = view.getUint16(offset);
                        offset += 2;

                        let val0 = view.getInt16(offset);
                        control.val0 = val0;
                        offset += 2;

                        control.dtc1 = view.getUint16(offset);
                        offset += 2;

                        let val1 = view.getInt16(offset);
                        control.val1 = val1;
                        offset += 2;
                        break;
                    }
                    default:
                        throw new Error(`Unknown control type: ${type}`);
                }

                controls[id] = control;
            }

            return controls;
        }
