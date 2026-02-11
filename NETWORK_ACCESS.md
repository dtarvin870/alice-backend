# Network Access & Local DNS Guide

The Pharmacy Dashboard is now configured for network-wide access. This allows other computers on your WiFi to access the interface.

## 1. Accessing the Application
To access the dashboard from another device, use the host computer's IP address or Hostname.

### Option A: Use Custom Local URL (Recommended)
You can map the URL `alice.umbrella` to this computer.
1. On **any computer** on the network, open the `hosts` file as Administrator/Root.
   *   Windows: `C:\Windows\System32\drivers\etc\hosts`
   *   Mac/Linux: `/etc/hosts`
2. Add the following line (replace `[HOST-IP]` with your computer's actual IP):
   `[HOST-IP]  alice.umbrella`
3. Access the app at: `http://alice.umbrella:1337`

### Option B: Use Hostname
Most modern routers support mDNS. Access the app at:
`http://[YOUR-COMPUTER-NAME].local:1337`

### Option C: Use IP Address
1. Find your **IPv4 Address** via `ipconfig`.
2. Access the app at: `http://[YOUR-IP]:1337`

---

## 2. Technical Implementation Details
The following changes were made to enable this:

1.  **Backend (`backend/server.js`)**: Updated to listen on `0.0.0.0`, allowing external connections.
2.  **Frontend (`frontend/package.json`)**: Added the `--host` flag to Vite to broadcast on the local network.
3.  **Dynamic API Config (`frontend/src/apiConfig.js`)**: Created a centralized config that automatically detects the current hostname. This ensures that when a remote computer loads the frontend, it knows to look for the backend on *your* computer, not its own `localhost`.
4.  **Component Updates**: All frontend components now use this dynamic configuration for API calls and image loading.

## 3. Firewall Note
If other computers cannot connect, you may need to allow ports **1337** and **5000** through the Windows Firewall on the host computer.
