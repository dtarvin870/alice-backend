# Umbrella Corp: A.L.I.C.E. Hardware Integration Guide

This guide details how to deploy the Pharmacy Dashboard on a **Raspberry Pi** and connect it to an **ESP32** to control physical NEMA17 stepper motors for medicine extraction.

---

## 1. Raspberry Pi Deployment (Server)

The Raspberry Pi acts as the "Command & Control" center, hosting the database, backend, and frontend.

### A. System Setup
1.  Install **Raspberry Pi OS** (64-bit recommended).
2.  Set the Hostname to `alice`:
    ```bash
    sudo raspi-config # Go to System Options -> Hostname
    ```
3.  Install Node.js and Nginx:
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs nginx git
    ```

### B. DNS: `alice.umbrella`
To use the custom URL across your network, use Nginx as a reverse proxy. 

1.  Create an Nginx config: `/etc/nginx/sites-available/alice`
    ```nginx
    server {
        listen 80;
        server_name alice.umbrella alice.local;

        location / {
            proxy_pass http://localhost:1337; # Frontend (Vite)
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
        }

        location /api {
            proxy_pass http://localhost:5000/api; # Backend
        }
    }
    ```
2.  Enable the site and restart Nginx:
    ```bash
    sudo ln -s /etc/nginx/sites-available/alice /etc/nginx/sites-enabled/
    sudo systemctl restart nginx
    ```

---

## 2. ESP32 & NEMA17 Integration (The Robot)

The ESP32 polls the Raspberry Pi for work and moves the stepper motors.

### Wiring Blueprint
- **Motor Drivers**: Use A4988 or DRV8825.
- **X-Axis**: 
  - STEP: GPIO 12
  - DIR: GPIO 13
- **Y-Axis**: 
  - STEP: GPIO 14
  - DIR: GPIO 27
- **Endstops (Optional but Recommended)**: GPIO 18, 19 (Check firmware logic).

### Firmware Logic
The ESP32 runs a continuous loop:
1.  **Poll**: `GET http://alice.umbrella:5000/api/robot/next-job`
2.  **Move**: If a job is returned, parse `targetX` and `targetY` and move the stepper motors.
3.  **Confirm**: Send `POST http://alice.umbrella:5000/api/robot/job-complete` when reached.

---

## 3. Communication Flow
1.  **Pharmacist**: Clicks "Start Picking" on the Dashboard.
2.  **Backend**: Sets `currentJob` in the state (mapped to motor steps).
3.  **ESP32**: Fetches the job via WiFi.
4.  **Hardware**: NEMA17 motors move the gantry to the medicine shelf.
5.  **ESP32**: Signals completion; Dashboard UI updates to "READY".

---

## 4. Next Steps for Development
- **Home Sensing**: Add a "Homing" routine in the ESP32 code using limit switches.
- **Vacuum/Grippers**: Use a relay or servo controlled by the ESP32 to physically grasp the medication.
- **G-Code Support**: For more complex paths, transition to a G-code parser on the ESP32.
