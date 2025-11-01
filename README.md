# NeoGraph

This project provides a **web-based control interface** for WiFi-enabled microcontrollers such as the **Raspberry Pi Pico W 2**.  
It allows you to interact with the controller through a browser — defining control setups, sending and receiving data, and monitoring or automating connected hardware.

---

## 🚀 Features

- **Web-based UI:**  
  Serve a responsive web interface directly from the controller.  
- **Hardware Control:**  
  Send commands to control the controller’s I/O pins and peripherals.  
- **Data Feedback:**  
  Receive live data from the controller and visualize it on the web interface.  
- **Standalone Operation:**  
  Configure the controller to continue running independently after setup.  
- **Built-in WiFi Access Point:**  
  Connect directly to the controller’s WiFi network — no external router required.

---

## 🧰 Build Instructions

Make sure you have the **Raspberry Pi Pico SDK** and toolchain installed.  

### Build the firmware

```bash
make build
```

This compiles the firmware and web interface into a single binary ready to flash.

---

## 💾 Flashing the Controller

1. Put the controller in **file storage (BOOTSEL)** mode by holding the **BOOTSEL** button while plugging it in.  
2. Then flash the firmware:

```bash
make flash
```

3. Once flashing completes, the controller will reboot and start its WiFi access point.  
4. Connect to the WiFi network it creates, then open your browser and go to the displayed IP address (usually `192.168.4.1`).

---

## 🧪 Development and Testing

### Test Web Interface Locally

You can test the web interface in your browser without flashing:

```bash
make test
```

This builds a standalone version for local testing.

---

### Development Build (No Compression)

For faster iteration when testing on hardware:

```bash
make dev
```

This builds a version suitable for flashing, but skips HTML/JS compression.

---

## 🧩 Typical Workflow

1. **Build and flash** using `make build && make flash`.  
2. **Connect** to the controller’s WiFi network.  
3. **Open** the IP address in your browser.  
4. **Configure** your control setup in the UI.  
5. **Interact** with your hardware — manually or in autonomous mode.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

## 😀 Credits

- Icons used, [solar-line-duotone on svgrepo.com](https://www.svgrepo.com/collection/solar-line-duotone-icons)