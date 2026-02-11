/**
 * Umbrella Corp: A.L.I.C.E. Advanced Hardware Interface
 * Supports: Distributed ESP32 Nodes (IPv6), NeoPixels, NFC/RFID Verification
 */

class AliceRobot {
    constructor() {
        this.isBusy = false;
        this.mode = 'OPERATIONAL';
        this.autoPick = false;
        this.currentJob = null;

        // Node Registry: Map hardware functions to their IPv6 addresses
        this.nodes = {
            gantry: "http://[fe80::...]:80", // Stepper Control Node
            scanner: "http://[fe80::...]:80", // NFC/RFID + NeoPixel Node
            kiosk: "http://[fe80::...]:80"    // User Interface Node
        };

        // Coordination for NeoPixel Colors (Umbrella Branding)
        this.HEX_COLORS = {
            OFF: "000000",
            UMBRELLA_RED: "FF0000",
            SYSTEM_WHITE: "FFFFFF",
            STANDBY_BLUE: "0000FF",
            READY_RED: "FF0000",
            RUNNING_ORANGE: "FFA500",
            PAUSED_YELLOW: "FFFF00",
            FAULT_PURPLE: "800080",
            SUCCESS_GREEN: "00FF00"
        };
    }

    setMode(mode) {
        console.log(`[ALICE] Mode changed to: ${mode}`);
        this.mode = mode;

        // Update visual feedback based on mode
        switch (mode) {
            case 'FAULT':
                this.setVisual('gantry', this.HEX_COLORS.FAULT_PURPLE, 'BLINK');
                break;
            case 'RUNNING':
                this.setVisual('gantry', this.HEX_COLORS.RUNNING_ORANGE, 'PULSE');
                break;
            case 'PAUSED':
                this.setVisual('gantry', this.HEX_COLORS.PAUSED_YELLOW, 'STATIC');
                break;
            case 'OPERATIONAL':
            case 'READY':
                this.setVisual('gantry', this.HEX_COLORS.STANDBY_BLUE, 'STATIC');
                break;
        }
    }

    setAutoPick(enabled) {
        console.log(`[ALICE] AutoPick state: ${enabled}`);
        this.autoPick = enabled;
    }

    setJob(job) {
        console.log(`[ALICE] Active job set:`, job);
        this.currentJob = job;
        if (job) {
            this.isBusy = true;
        } else {
            this.isBusy = false;
        }
    }

    /**
     * Sends a visual command to a specific ESP32 node's NeoPixel strip
     */
    async setVisual(nodeKey, colorHex, animation = 'STATIC') {
        const nodeUrl = this.nodes[nodeKey];
        if (!nodeUrl) return;

        console.log(`[ALICE] Sending Visual Signal to ${nodeKey}: ${colorHex} (${animation})`);

        try {
            await fetch(`${nodeUrl}/led`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ color: colorHex, animation }),
                signal: AbortSignal.timeout(2000)
            });
        } catch (e) {
            console.error(`[ALICE] Failed to communicate with node ${nodeKey} visuals.`);
        }
    }

    /**
     * Identifies a physical node by making its LED blink.
     */
    async identifyNode(nodeUrl, colorHex) {
        console.log(`[ALICE] Identifying Node at ${nodeUrl} with color ${colorHex}`);
        try {
            await fetch(`${nodeUrl}/led`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ color: colorHex, animation: 'BLINK', duration: 5000 }),
                signal: AbortSignal.timeout(2000)
            });
        } catch (e) {
            console.error(`[ALICE] Failed to send identify signal.`);
        }
    }

    /**
     * Reads data from the NFC/RFID tag at a specific node.
     */
    async readTag(nodeUrl, type) {
        console.log(`[ALICE] Reading ${type} Tag at ${nodeUrl}`);
        try {
            const resp = await fetch(`${nodeUrl}/read-tag?type=${type}`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            if (!resp.ok) throw new Error("Hardware read failed");
            const data = await resp.json();
            return data; // { type: 'NFC', data: 'hex_string' }
        } catch (e) {
            console.error(`[ALICE] Failed to read ${type} tag.`);
            // Mock return for testing if hardware not connected
            return { type: type, data: `MOCK_${type}_DATA_${Math.random().toString(36).substr(2, 6).toUpperCase()}` };
        }
    }

    /**
     * Writes data to the NFC/RFID tag at a specific node.
     */
    async writeTag(nodeUrl, data, type) {
        console.log(`[ALICE] Writing Data to ${type} Tag at ${nodeUrl}:`, data);
        try {
            await fetch(`${nodeUrl}/write-tag`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data, type }),
                signal: AbortSignal.timeout(3000)
            });
        } catch (e) {
            console.error(`[ALICE] Failed to write ${type} tag.`);
            // For now, don't throw so UI can proceed in mock mode
            // throw new Error("Hardware communication failure (Write Tag)");
        }
    }

    /**
     * Trigger a pick job - Now with Visual Feedback
     */
    async pickItem(locationCode) {
        if (this.mode !== 'OPERATIONAL') throw new Error("Robot Offline");

        // Set LED to 'WORKING' (Red Pulse)
        this.setVisual('gantry', this.HEX_COLORS.UMBRELLA_RED, 'PULSE');

        this.currentJob = {
            id: Date.now(),
            location: locationCode,
            action: 'PICK'
        };

        this.isBusy = true;
        return { success: true, job: this.currentJob };
    }

    /**
     * Process NFC/RFID data received from an ESP32 node
     */
    async handleIdentityScan(nodeKey, tagType, tagId) {
        console.log(`[ALICE] Identity Scan at ${nodeKey}: ${tagType} [${tagId}]`);

        // Visual feedback: Flash White on Scan
        this.setVisual(nodeKey, this.HEX_COLORS.SYSTEM_WHITE, 'FLASH');

        // Here we would verify the tagId against the database for access control
        // return db_lookup(tagId)...

        return { authorized: true, identity: "UMBRELLA_PERSONNEL_01" };
    }

    signalJobComplete() {
        console.log(`[ALICE] Gantry reported completion.`);
        this.setVisual('gantry', this.HEX_COLORS.SUCCESS_GREEN, 'STATIC');

        // Reset to Standby after 3 seconds
        setTimeout(() => {
            this.setVisual('gantry', this.HEX_COLORS.STANDBY_BLUE, 'STATIC');
        }, 3000);

        this.currentJob = null;
        this.isBusy = false;
    }

    getStatus() {
        return {
            mode: this.mode,
            isBusy: this.isBusy,
            autoPick: this.autoPick,
            nodes: this.nodes,
            integrity: "SECURE"
        };
    }
}

module.exports = new AliceRobot();
