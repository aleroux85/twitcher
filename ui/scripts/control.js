
        function clearControlInterface() {
            controlInterface = document.getElementById('controls');

            while(true) {
                if (controlInterface.children.length === 1) {break;}
                controlInterface.removeChild(controlInterface.lastChild);
            }
        }

        function buildInterface(config) {
            clearControlInterface();

            controlInterface = document.getElementById('controls');

            for (const [id, control] of Object.entries(config)) {
                switch (control.type) {
                    case 1:
                        const controlButton = document.createElement('div');
                        const controlButtonIndicator = document.createElement('div');
                        controlButton.className = 'control-btn';
                        controlButton.setAttribute('onclick', `buttonClicked(event,${control.target}, 1)`);
                        const button = document.createElement('button');
                        button.innerHTML = config[control.name].string;
                        controlButton.appendChild(controlButtonIndicator);
                        controlButton.appendChild(button);
                        controlInterface.appendChild(controlButton);
                        break;

                    case 3:
                        const controlElement= document.createElement('div');
                        controlElement.classList.add('ctr-slider');

                        let vbx = 100;
                        let vby = 100;
                        let hgt = 6;

                        if (control.orientation==1) {
                            controlElement.classList.add('ctr-spn-r1');
                            controlElement.classList.add(`ctr-spn-c${control.len}`);
                            vbx *= control.len*2;
                        } else {
                            controlElement.classList.add('ctr-spn-c1');
                            controlElement.classList.add(`ctr-spn-r${control.len}`);
                            vby *= control.len;
                            hgt = hgt*control.len + 0.8*(control.len-1);
                        }
                        const x1 = 50;
                        const y1 = 50;
                        const x2 = vbx-50;
                        const y2 = vby-50;

                        const range = control.max - control.min;
                        const cx = control.val*((x2-x1)/range) + x1;
                        const cy = control.val*((y2-y1)/range) + y1;

                        controlElement.setAttribute('style',`height:${hgt}em`);

                        controlElement.innerHTML = `
                            <svg class="slider" width="100%" height="100%" viewbox="0 0 ${vbx} ${vby}" preserveAspectRatio="xMidYMid meet">
                                <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ccc" stroke-width="2" stroke-linecap="round" />
                                <circle id="knob" cx="${cx}" cy="${cy}" r="20" fill="#2196f3" cursor="pointer" />
                            </svg>`;

                        controlElement.querySelector("svg").style.pointerEvents = "all";
                        controlElement.querySelector("svg").addEventListener('pointerdown', (e) => {
                            e.preventDefault();
                        });
                        controlElement.getElementsByTagName("circle")[0].addEventListener('pointerdown', (e) => {
                            drag = { ...control,controlElement, mode:"mouse"};
                            e.preventDefault();
                        });
                        controlElement.getElementsByTagName("circle")[0].addEventListener('touchstart', (e) => {
                            drag = { ...control,controlElement, mode:"touch"};
                            e.preventDefault();
                        });
                        controlInterface.appendChild(controlElement);

                        break;

                    default:
                        break;
                }
            }
        }
