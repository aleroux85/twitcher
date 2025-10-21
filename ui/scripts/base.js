
        let socket;
        let drag = null;
        let ios = {
            1:{
                name:"Button",
                elms:buttonControlElements
            },
            3:{
                name:"Slider",
                elms:sliderControlElements
            },
            48:{
                name:"LED",
                elms:ledControlElements
            },
            49:{
                name:"GPIO",
                elms:gpioControlElements
            },
            50:{
                name:"PWM",
                elms:pwmControlElements
            },
        }

        function buttonClicked(event, target, value) {
            const binaryData = new Uint8Array([1, 0, 8, 1, 1, (target >> 8) & 0xFF, target & 0xFF, 0, 0, 0, value]);
            socket.send(binaryData);

            if (value === 1) {
                event.srcElement.parentElement.classList.add('enabled');
                value = 0;
            } else {
                event.srcElement.parentElement.classList.remove('enabled');
                value = 1;
            }
            event.srcElement.parentElement.setAttribute('onclick', `buttonClicked(event,${target}, ${value})`);
        }

        function updateSliderPosition(visPos,movePos,clientLen,sliderStart,sliderEnd) {
            let clientPos = (visPos - 50)*((clientLen)/300);
            let sliderPos = (clientPos)*((sliderEnd-sliderStart)/clientLen) + sliderStart;
            let visMovePos = (movePos - sliderPos)*(300/(clientLen)) + visPos;
            return Math.max(50, Math.min(visMovePos, 350));
        }

        function updateSlider(e) {
            const svg = drag.controlElement.querySelector("svg");
            const rect = svg.getBoundingClientRect();

            let mouseX = -rect.left;
            let mouseY = -rect.top;

            if (drag.mode === "mouse") {
                mouseX = mouseX + e.clientX;
                mouseY = mouseY + e.clientY;
            } else if (drag.mode === "touch") {
                mouseX = mouseX + e.touches[0].clientX;
                mouseY = mouseY + e.touches[0].clientY;
            }

            const scaleX = svg.viewBox.baseVal.width / rect.width;
            const scaleY = svg.viewBox.baseVal.height / rect.height;

            let xRange = 100;
            if (drag.orientation===1) {xRange = 200*drag.len}
            const svgX = Math.max(50, Math.min(mouseX * scaleX, xRange-50));

            let yRange = 100;
            if (drag.orientation===2) {yRange *= drag.len}
            const svgY = Math.max(50, Math.min(mouseY * scaleY, yRange-50));

            const knob = svg.querySelector("#knob");
            knob.setAttribute("cx", svgX);
            knob.setAttribute("cy", svgY);

            if (drag.orientation===1){
                return Math.round(((svgX - 50) / xRange) * 100);
            } else {
                return Math.round(((svgY - 50) / yRange) * 100);
            }
        }

        document.addEventListener("pointerup", () => {
            drag = null;
        });

        document.addEventListener("touchend", () => {
            drag = null;
        });

        document.addEventListener("pointermove", (e) => {
            if (drag && drag.mode === "mouse") {
                let value = updateSlider(e);
                if (value !== drag.val) {
                    drag.val = value;
                    const binaryData = new Uint8Array([1, 0, 8, 1, 1, (drag.target >> 8) & 0xFF, drag.target & 0xFF, 0, 0, (value >> 8) & 0xFF, value & 0xFF]);
                    // console.log(value);
                    if (!dev) {
                        socket.send(binaryData);
                    }
                }
            }
        });

        document.addEventListener("touchmove", (e) => {
            if (drag && drag.mode === "touch") {
                let value = updateSlider(e);
                if (value !== drag.val) {
                    drag.val = value;
                    const binaryData = new Uint8Array([1, 0, 8, 1, 1, (drag.target >> 8) & 0xFF, drag.target & 0xFF, 0, 0, (value >> 8) & 0xFF, value & 0xFF]);
                    // console.log(value);
                    if (!dev) {
                        socket.send(binaryData);
                    }
                }
            };
            e.preventDefault();
        });

        function toggleWebSocket(toggle) {
            if (toggle.checked) {
                connectWebSocket();
            } else {
                disconnectWebSocket();
            }
        }

        function connectWebSocket() {
            if (socket && socket.readyState === WebSocket.OPEN) {
                console.log("WebSocket already connected.");
                return;
            }

            socket = new WebSocket("ws://" + location.host);

            socket.onopen = function () {
                document.getElementById("status").textContent = "Connected";
                document.getElementById("status").className = "connected";
                // console.log("WebSocket connected.");
            };

            socket.binaryType = "arraybuffer";
            socket.onmessage = (event) => {
                if (event.data instanceof ArrayBuffer) {
                    const data = new Uint8Array(event.data);
                    console.log("Received binary data:", data);

                    const config = unmarshalControls(data);
                    console.log(config);
                    reconstructConfigInterface(config);
                    buildInterface(config);
                } else {
                    if (event.data.startsWith("core ")) {
                        document.getElementById("core").innerText = event.data.substring(5) + "°C";
                    }

                    if (event.data.startsWith("uptime ")) {
                        const uptime = parseInt(event.data.substring(7));
                        if (uptime < 60) {
                            document.getElementById("uptime").innerText = `${uptime} seconds`;
                        } else if (uptime < 3600) {
                            document.getElementById("uptime").innerText = `${Math.round(uptime / 60)}m${uptime % 60}s`;
                        } else {
                            document.getElementById("uptime").innerText = `${Math.round(uptime / 3600)}h${Math.round(uptime / 60) - 60 * Math.round(uptime / 3600)}m${uptime % 60}s`;
                        }
                    }
                }
            };

            socket.onclose = function () {
                document.getElementById("status").textContent = "Disconnected";
                document.getElementById("status").className = "disconnected";
                clearConfigInterface();
                clearControlInterface();
                // console.log("WebSocket disconnected.");
            };

            socket.onerror = function (error) {
                console.error("WebSocket error:", error);
            };
        }

        function disconnectWebSocket() {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.close();
                clearConfigInterface();
                clearControlInterface();
            }
        }

        function sendMessage() {
            if (socket && socket.readyState === WebSocket.OPEN) {
                const msg = sendmsg.value;
                if (msg[0] === 'm') {
                    let b0 = 0x10;
                    b0 = b0 | parseInt(msg[1]);

                    let b1;
                    switch (msg[2]) {
                        case 'x':
                            b1 = 0x01;
                            break;
                    }
                    let b2 = parseInt(msg.substring(3));
                    const binaryData = new Uint8Array([0x00, b2, b1, b0]);
                    socket.send(binaryData);
                } else {
                    socket.send(sendmsg.value);
                }
            } else {
                console.log("WebSocket is not open.");
            }
        }

        // Optional: close socket when page unloads
        window.addEventListener("beforeunload", () => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.close();
                clearConfigInterface();
                clearControlInterface();
            }
        });

        function goFullScreen() {
            if (!document.fullscreenElement) {
                controlInterface = document.getElementById('controls');
                controlInterface.requestFullscreen();
                document.getElementById('min-button').classList.add('show');
            } else {
                document.exitFullscreen?.();
                document.getElementById('min-button').classList.remove('show');
            }
        }

        if (dev) {
            addControl(null);
            addControl({in:{type:3},out:{type:50}});
            addControl(null);
            addControl(null);
            addControl(null);
            saveConfig();
        }
