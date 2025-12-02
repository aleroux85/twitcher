let socket;

function networkingTemplate(state) {
    const deviceElement = (nindex,dindex,device) => `
        <div class="device-elm">
            <div>
                <h4>Device: ${device.name}</h4>
                <p>IP: ${device.ip}</p>
            </div>
            <div class="device-connect" onclick="toggleWebSocket(${nindex},${dindex})">
                <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path opacity="0.8" stroke="#BFCDE7" fill=${device.connected?"#4CAF5080":"#E7BFBF80"} stroke-width="1.5" d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z"/>
                    <g transform="${device.connected?"translate(5.8 3) scale(0.745)":"translate(0 3) scale(0.745)"}">
                        <path stroke="#BFCDE7" fill="#2d2f34C0" stroke-width="1.5" d="M6 8C6 5.17157 6 3.75736 6.87868 2.87868C7.75736 2 9.17157 2 12 2C14.8284 2 16.2426 2 17.1213 2.87868C18 3.75736 18 5.17157 18 8V16C18 18.8284 18 20.2426 17.1213 21.1213C16.2426 22 14.8284 22 12 22C9.17157 22 7.75736 22 6.87868 21.1213C6 20.2426 6 18.8284 6 16V8Z"/>
                    </g>
                </svg>
            </div>
        </div>
    `;
    
    const networkElement = (nindex,network) => `
        <div class="network-box">
            <h3>Network: ${network.name}</h3>
            <div class="device-box">
                ${network.devices.map((device,dindex) => deviceElement(nindex,dindex,device))}
            </div>
        </div>
    `;

    return `${state.map((network,nindex) => networkElement(nindex,network)).join("")}`;

    // networks.forEach((network) => {
    //     html += `
    //         <div class="network-box">
    //             <h3>Network: ${network.name}</h3>
    //             <p><b>MAC:</b> ${
    //                 Array.from(dev.mac)
    //                     .map(b => b.toString(16).padStart(2,'0'))
    //                     .join(':')
    //             }</p>
    //             <p><b>IP:</b> ${dev.ip}</p>
    //             <p><b>Status:</b> ${dev.connected ? "🟢 Connected" : "🔴 Disconnected"}</p>

    //             <button onclick="app.unknown.devices['${id}'].connected = 
    //                 !app.unknown.devices['${id}'].connected">
    //                 Toggle Connected
    //             </button>
    //         </div>
    //     `;


}

const networks = mount(document.getElementById("network"), [
    {
        name:"unknown",
        devices:[
            {
                name:"neoGraph",
                mac:new Uint8Array([0x64, 0x00, 0x84, 0xfe, 0x18, 0x07]),
                ip:location.host,
                connected:false,
                socket:null
            }
        ]
    }
], networkingTemplate);

function toggleWebSocket(n,d) {
    const dv = networks[n].devices[d];
    if (dv.connected) {
        dv.connected = false;
        if (!testing) { //testing
        disconnectWebSocket(networks[n].devices[d]);
        } //testing
    } else {
        dv.connected = true;
        if (!testing) {  //testing
        connectWebSocket(networks[n].devices[d]);
        } else { //testing
            const data = new Uint8Array([ //testing
                0xb0, 0x00, 0x00, 0x00, 0x07, 0x00, 0x64, 0x00, 0x84, 0xfe, 0x18, 0x07, 0xb1, 0x00, 0x00, 0x00, //testing
                0x06, 0x01, 0x49, 0x4a, 0x54, 0x54, 0x00, 0xb1, 0x00, 0x00, 0x00, 0x03, 0x02, 0x00, 0x00, 0xb2, //testing
                0x00, 0x00, 0x00, 0x00, 0xb3, 0x00, 0x00, 0x00, 0x06, 0x01, 0x49, 0x4a, 0x54, 0x54, 0x00, 0xb3, //testing
                0x00, 0x00, 0x00, 0x0f, 0x02, 0x6e, 0x65, 0x6f, 0x47, 0x72, 0x61, 0x70, 0x68, 0x2d, 0x49, 0x4a, //testing
                0x54, 0x54, 0x00]); //testing
            unmarshalConfigs(data); //testing
        } //testing
    }
}

function unmarshalConfigs(binary) {
    const decoder = new TextDecoder();
    const view = new DataView(binary.buffer, binary.byteOffset, binary.byteLength);
    const configs = {};
    let offset = 0;

    while (offset < binary.length) {
        let elm = {};

        const type = view.getUint8(offset++);
        offset++;
        elm.id = view.getUint16(offset); offset += 2;
        elm.len = view.getUint8(offset++);
        elm.pay = binary.slice(offset,offset+elm.len); offset += elm.len;

        if (!configs.hasOwnProperty(type)) {
            configs[type] = [];
        }

        configs[type].push(elm);
    }

    for (const device of configs[0xB0]) {
        let mac = networks[0].devices[0].mac;
        if (areByteArraysEqual(device.pay.slice(1), mac)) {
            networks[0].devices[0].name = "test";
        }
    }
}

function areByteArraysEqual(arr1, arr2) {
  return arr1.length === arr2.length && arr1.every((value, index) => value === arr2[index]);
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

            // const config = unmarshalControls(data);
            // console.log(config);
            // reconstructConfigInterface(config);
            // buildInterface(config);
        } else {
            console.log("Received binary data:", event.data);
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