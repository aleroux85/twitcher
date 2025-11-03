let networks = {
    unknown:{
        name:"unknown",
        devices:{
            dncGraph:{
                name:"neoGraph",
                ip:location.host,
                connected:false,
                socket:null
            }
        }
    }
}

function renderNetworks() {
    const container = document.getElementById("network");
    container.innerHTML = '';

    Object.entries(networks).forEach(([nkey,network]) => {
        const netDiv = document.createElement('div');
        netDiv.className = 'network-box';

        const networkTitle = document.createElement('h3');
        networkTitle.textContent = `Network: ${network.name}`;
        netDiv.appendChild(networkTitle);

        const devDiv = document.createElement('div');
        devDiv.className = 'device-box';
        
        Object.entries(network.devices).forEach(([dkey,device]) => {
            const dev = document.createElement('div');
            dev.className = 'device-elm';

            const devDetails = document.createElement('div');
    
            const deviceTitle = document.createElement('h4');
            deviceTitle.textContent = `Device: ${device.name}`;
            devDetails.appendChild(deviceTitle);
            
            const deviceInfo = document.createElement('p');
            deviceInfo.textContent = `IP: ${device.ip}`;
            devDetails.appendChild(deviceInfo);

            dev.appendChild(devDetails);

            const deviceConnect = document.createElement('div');
            deviceConnect.className = 'device-connect';
            deviceConnect.setAttribute('onclick', `toggleWebSocket('${nkey}','${dkey}')`);
            deviceConnect.innerHTML = `
            <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path opacity="0.8" stroke="#BFCDE7" fill="#E7BFBF80" stroke-width="1.5" d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z"/>
                <g transform="translate(0 3) scale(0.745)">
                    <path stroke="#BFCDE7" fill="#2d2f34C0" stroke-width="1.5" d="M6 8C6 5.17157 6 3.75736 6.87868 2.87868C7.75736 2 9.17157 2 12 2C14.8284 2 16.2426 2 17.1213 2.87868C18 3.75736 18 5.17157 18 8V16C18 18.8284 18 20.2426 17.1213 21.1213C16.2426 22 14.8284 22 12 22C9.17157 22 7.75736 22 6.87868 21.1213C6 20.2426 6 18.8284 6 16V8Z"/>
                </g>
            </svg>`;
            networks[nkey].devices[dkey].switch = deviceConnect;
            dev.appendChild(deviceConnect);

            devDiv.appendChild(dev);
        });

        netDiv.appendChild(devDiv);
        container.appendChild(netDiv);
    });
}

renderNetworks()

function toggleWebSocket(n,d) {
    const dv = networks[n].devices[d];
    if (dv.connected) {
        dv.connected = false;
        dv.switch.querySelector('svg>path').setAttribute("fill","#E7BFBF80");
        dv.switch.querySelector('svg>g').setAttribute("transform","translate(0 3) scale(0.745)");
        if (!testing) {disconnectWebSocket(networks[n].devices[d]);}
    } else {
        dv.connected = true;
        dv.switch.querySelector('svg>path').setAttribute("fill","#4CAF5080");
        dv.switch.querySelector('svg>g').setAttribute("transform","translate(5.8 3) scale(0.745)");
        if (!testing) {connectWebSocket(networks[n].devices[d]);}
    }
}

function connectWebSocket(device) {
    const socket = device.socket;

    if (socket && socket.readyState === WebSocket.OPEN) {
        console.log("WebSocket already connected.");
        return;
    }

    socket = new WebSocket("ws://" + device.ip);

    socket.onopen = function () {
        // document.getElementById("status").textContent = "Connected";
        // document.getElementById("status").className = "connected";
        console.log("WebSocket connected.");
    };

    socket.binaryType = "arraybuffer";
    socket.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
            const data = new Uint8Array(event.data);
            console.log("Received binary data:", data);

            const config = unmarshalControls(data);
            console.log(config);
            // reconstructConfigInterface(config);
            // buildInterface(config);
        } else {
            // if (event.data.startsWith("core ")) {
            //     document.getElementById("core").innerText = event.data.substring(5) + "°C";
            // }

            // if (event.data.startsWith("uptime ")) {
            //     const uptime = parseInt(event.data.substring(7));
            //     if (uptime < 60) {
            //         document.getElementById("uptime").innerText = `${uptime} seconds`;
            //     } else if (uptime < 3600) {
            //         document.getElementById("uptime").innerText = `${Math.round(uptime / 60)}m${uptime % 60}s`;
            //     } else {
            //         document.getElementById("uptime").innerText = `${Math.round(uptime / 3600)}h${Math.round(uptime / 60) - 60 * Math.round(uptime / 3600)}m${uptime % 60}s`;
            //     }
            // }
        }
    };

    socket.onclose = function () {
        // document.getElementById("status").textContent = "Disconnected";
        // document.getElementById("status").className = "disconnected";
        // clearConfigInterface();
        // clearControlInterface();
        console.log("WebSocket disconnected.");
    };

    socket.onerror = function (error) {
        console.error("WebSocket error:", error);
    };
}

function disconnectWebSocket(device) {
    const socket = device.socket;

    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
        // clearConfigInterface();
        // clearControlInterface();
    }
}