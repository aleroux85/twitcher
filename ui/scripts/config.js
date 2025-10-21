
        document.querySelector('.gear').addEventListener('click', () => {
            document.getElementById('configPanel').classList.add('open');
        });

        function closeConfig() {
            document.getElementById('configPanel').classList.remove('open');
        }

        function addControlElement(fieldValues) {
            const control= document.createElement('div');
            const controlio= document.createElement('div');
            controlio.className = "io-select";
            const label = document.createElement('label');
            label.className = "control-labels";
            if (((fieldValues.type>>4)&1)==0) {label.innerHTML = "Input"}
            else {label.innerHTML = "Output"}
            controlio.appendChild(label);

            const ioselect = document.createElement('select');
            ioselect.setAttribute('onchange', 'changeControl(event)');
            for (const io of Object.keys(ios).filter(key => ((fieldValues.type>>4)&1)==((key>>4)&1))) {
                const opt = document.createElement('option');
                opt.value = io;
                opt.textContent = ios[io].name;
                if (io === `${fieldValues.type}`) {opt.selected = "selected"}
                ioselect.appendChild(opt);
            }
            controlio.appendChild(ioselect);
            control.appendChild(controlio);
            control.appendChild(ios[fieldValues.type].elms(fieldValues));

            return control;
        }

        function addControl(fieldValues) {
            let inFieldValues = {type:1};
            let outFieldValues = {type:48};

            if (fieldValues !== null) {
                inFieldValues = fieldValues.in;
                outFieldValues = fieldValues.out;
            }

            const container = document.getElementById('configPanel');
            const controls = container.getElementsByClassName('controls');

            const controlInput = addControlElement(inFieldValues);
            const controlOutput = addControlElement(outFieldValues);

            const control = document.createElement('div');
            control.className = 'controls';
            const controlAddButton = document.createElement('button');
            controlAddButton.className = 'add-rem-control-btn';
            controlAddButton.setAttribute('onclick', 'addControl(null)');
            controlAddButton.innerHTML = 'Add';
            control.appendChild(controlAddButton);

            addRemButton = controls[controls.length - 1].children[0];
            addRemButton.setAttribute('onclick', 'removeControl(event)');
            addRemButton.innerHTML = 'Remove';


            controls[controls.length - 1].appendChild(controlInput);
            controls[controls.length - 1].appendChild(controlOutput);
            container.appendChild(control);

            return controls[controls.length - 1];
        }

        function removeControl(event) {
            const elm = event.srcElement;
            let elmParent = elm.parentElement;
            elmParent.remove();
        }

        function changeControl(event) {
            const parent = event.srcElement.parentElement.parentElement;
            parent.removeChild(parent.children[1]);
            parent.appendChild(ios[parseInt(event.srcElement.value)].elms(null));
        }

        function buttonControlElements(fieldValues) {
            const elements = document.createElement('div');
            elements.className = 'button control-elements';

            const nameBox = document.createElement('input');
            nameBox.className = 'control-name';
            nameBox.value = 'Button';
            elements.appendChild(nameBox);

            return elements;
        }

        function sliderControlElements(fieldValues) {
            const elements = document.createElement('div');
            elements.className = 'frm-grp';
            elements.innerHTML = `
            <label>Name</label><input class="control-name">
            <label>Orientation</label><select class="control-dropdown">
                <option value="1">Horizontal</option>
                <option value="2">Vertical</option>
            </select>
            <label>Length</label><input type="range" max="4" min="1" value="3"/>`;

            return elements;
        }

        function ledControlElements(fieldValues) {
            const elements = document.createElement('div');
            elements.className = 'led control-elements';

            return elements;
        }

        function gpioControlElements(fieldValues) {
            let gpio = 0;

            if (fieldValues !== null) {
                if ("gpio" in fieldValues) {
                    gpio = fieldValues.gpio;
                }
            }

            const elements = document.createElement('div');
            elements.className = 'gpio-control-elements';

            const ioBox = document.createElement('select');
            // ioBox.value = gpio;
            const ios = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
            for (const io of ios) {
                const opt = document.createElement('option');
                opt.value = io;
                if (io === gpio) {opt.selected = "selected"}
                opt.textContent = 'GPIO ' + io;
                ioBox.appendChild(opt);
            }
            elements.appendChild(ioBox);

            return elements;
        }

        function pwmControlElements(fieldValues) {
            let gpio = 0;
            let freq = 50;
            let dtc0 = 0;
            let dtc1 = 100;

            if (fieldValues !== null) {
                if ("gpio" in fieldValues) {
                    gpio = fieldValues.gpio;
                }
                if ("freq" in fieldValues) {
                    freq = fieldValues.freq;
                }
                if ("dtc0" in fieldValues) {
                    dtc0 = fieldValues.dtc0;
                }
                if ("dtc1" in fieldValues) {
                    dtc1 = fieldValues.dtc1;
                }
            }

            const elements = document.createElement('div');
            // elements.className = 'pwm-control-elements';
            elements.className = 'frm-grp';
            elements.innerHTML = `
            <label>Frequency</label><input type="number" min="1" max="1000" value="${freq}" class="control-name">
            <label>Duty Cycle Start</label><input type="number" min="0" max="100" value="${dtc0}" class="control-name">
            <label>Duty Cycle End</label><input type="number" min="0" max="100" value="${dtc1}" class="control-name">`;

            const ioBox = document.createElement('select');
            ioBox.value = gpio;
            const ios = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
            for (const io of ios) {
                const opt = document.createElement('option');
                opt.value = io;
                if (io === gpio) {opt.selected = "selected"}
                opt.textContent = 'GPIO ' + io;
                ioBox.appendChild(opt);
            }
            elements.prepend(ioBox);

            const ioLabel = document.createElement('label');
            ioLabel.innerHTML = "Channel";
            elements.prepend(ioLabel);

            return elements;
        }

        function saveConfig() {
            const configsCollection = document.getElementsByClassName('controls');
            const configs = Array.from(configsCollection);

            // let cnf = new Uint8Array([c[1], c[0], 0x89, 0x01]);
            let cnf = {};
            let id = 1;

            configs.forEach(config => {
                if (config.children.length > 1) {
                    const controls = Array.from(config.children).slice(1);
                    const inputs = controls[0].children;
                    const outputs = controls[1].children;

                    cnf[id] = { type: parseInt(inputs[0].children[1].value) };
                    switch (cnf[id].type) {
                        case 1:
                            cnf[id].target = id + 2;
                            cnf[id].name = id + 1;
                            cnf[id + 1] = { type: 160, string: inputs[1].children[0].value };
                            id += 2;
                            break;

                        case 3:
                            cnf[id].target = id + 2;
                            cnf[id].name = id + 1;
                            cnf[id].orientation = parseInt(inputs[1].children[3].value);
                            cnf[id].len = parseInt(inputs[1].children[5].value);
                            cnf[id].min = 0;//parseInt(inputs[1].children[5].value);
                            cnf[id].max = 100;//parseInt(inputs[1].children[5].value);
                            cnf[id].val = 0;//parseInt(inputs[1].children[5].value);
                            cnf[id + 1] = { type: 160, string: inputs[1].children[0].value };
                            id += 2;
                            break;
                        default:
                            break;
                    }

                    cnf[id] = { type: parseInt(outputs[0].children[1].value) };
                    switch (cnf[id].type) {
                        case 48:
                            id++;
                            break;

                        case 49:
                            cnf[id].gpio = parseInt(outputs[1].children[0].value);
                            id++;
                            break;

                        case 50:
                            cnf[id].gpio = parseInt(outputs[1].children[1].value);
                            cnf[id].freq = parseInt(outputs[1].children[3].value);
                            cnf[id].valx = 0;//parseInt(outputs[1].children[0].value);
                            cnf[id].val0 = 0;//parseInt(outputs[1].children[0].value);
                            cnf[id].dtc0 = parseInt(outputs[1].children[5].value);
                            cnf[id].val1 = 100;//parseInt(outputs[1].children[0].value);
                            cnf[id].dtc1 = parseInt(outputs[1].children[7].value);
                            id++;
                            break;

                        default:
                            break;
                    }
                }
            });
            console.log(cnf);
            buildInterface(cnf);

            const binary = marshalControls(cnf);

            const wsConfigMsg = new Uint8Array(binary.length + 3);
            wsConfigMsg[0] = 0x0A;
            wsConfigMsg[1] = (binary.length >> 8) & 0xFF;
            wsConfigMsg[2] = binary.length & 0xFF;
            wsConfigMsg.set(binary, 3);
            console.log(wsConfigMsg);
            if (!dev) {
                socket.send(wsConfigMsg);
            }

            return cnf;
        }

        function clearConfigInterface() {
            let configInterface = document.getElementById('configPanel');
            const controls = Object.entries(configInterface.getElementsByClassName('controls'));

            if (controls.length > 1) {
                for (let iControl = 0;iControl<controls.length-1;iControl++) {
                    configInterface.removeChild(controls[iControl][1]);
                }
            }
        }

        function reconstructConfigInterface(config) {
            clearConfigInterface();

            let configInterface = document.getElementById('configPanel');
            const controls = Object.entries(configInterface.getElementsByClassName('controls'));

            let fieldValues = {in:{},out:{}};
            for (const [id, control] of Object.entries(config)) {
                if (((control.type>>4)&1)==0 && control.type < 64) {
                    // fieldValues.in.type = control.type;
                    fieldValues.in = { ...control };
                    // fieldValues.out.type = config[control.target].type;
                    fieldValues.out = { ...config[control.target] };
                    addControl(fieldValues);
                }
            }
        }
