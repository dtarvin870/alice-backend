const express = require('express');
const router = express.Router();
const db = require('./database');
const aliceRobot = require('./alice_mock');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

router.get('/version-check', (req, res) => res.json({ version: 'new' }));


// Configure Multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });


// Get all orders
router.get('/orders', (req, res) => {
    db.all("SELECT * FROM orders ORDER BY created_at DESC", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Removed duplicate POST /orders route

// Get order details with items
router.get('/orders/:id', (req, res) => {
    const orderId = req.params.id;
    const query = `
        SELECT oi.id, oi.status, oi.quantity, oi.medication_id, m.name, m.dosage, m.location_code
        FROM order_items oi
        JOIN medications m ON oi.medication_id = m.id
        WHERE oi.order_id = ?
    `;

    db.all(query, [orderId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Autonomous Orchestrator (Internal)
const checkAutoPick = async () => {
    if (!aliceRobot.autoPick || aliceRobot.isBusy || aliceRobot.mode !== 'OPERATIONAL') return;

    // Find the oldest pending item across all orders
    const query = `
        SELECT oi.id, oi.order_id, m.location_code, m.name
        FROM order_items oi
        JOIN medications m ON oi.medication_id = m.id
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.status = 'PENDING'
        ORDER BY o.created_at ASC, oi.id ASC
        LIMIT 1
    `;

    db.get(query, async (err, item) => {
        if (err || !item) {
            aliceRobot.setJob(null);
            return;
        }

        console.log(`[AUTOPICK] Automatically initiating extraction for item ${item.id} at ${item.location_code}`);

        // Prepare job for possible ESP32 polling
        aliceRobot.setJob({
            orderItemId: item.id,
            locationCode: item.location_code,
            name: item.name,
            timestamp: new Date().toISOString()
        });

        // Trigger the pick (simulated or via robot)
        try {
            // Update order status if needed
            db.run("UPDATE orders SET status = 'PROCESSING' WHERE id = ? AND status = 'PENDING'", [item.order_id]);

            await aliceRobot.pickItem(item.location_code);

            // Update item status and stock
            db.run("UPDATE order_items SET status = 'PICKED' WHERE id = ?", [item.id], (err) => {
                if (err) console.error("Error updating order item:", err.message);

                db.get("SELECT medication_id, quantity FROM order_items WHERE id = ?", [item.id], (err, row) => {
                    if (row) {
                        db.run("UPDATE medications SET stock = stock - ? WHERE id = ?", [row.quantity, row.medication_id]);
                    }
                });
            });

            aliceRobot.setJob(null);
        } catch (error) {
            console.error(`[AUTOPICK] Extraction failed: ${error.message}`);
            aliceRobot.setJob(null);
        }
    });
};

// Start the background orchestrator
setInterval(checkAutoPick, 2000);

// Trigger Robot to Pick Item (Manual)
router.post('/robot/pick', async (req, res) => {
    const { orderItemId, locationCode } = req.body;

    try {
        console.log(`Requesting robot to pick item ${orderItemId} at ${locationCode}`);

        // Get order ID and medication ID for this item first
        db.get("SELECT order_id, medication_id, quantity FROM order_items WHERE id = ?", [orderItemId], async (err, item) => {
            if (err || !item) return res.status(404).json({ error: "Order item not found" });

            const { order_id, medication_id, quantity } = item;

            // 1. Set Order to 'PROCESSING' if it was 'PENDING'
            db.run("UPDATE orders SET status = 'PROCESSING' WHERE id = ? AND status = 'PENDING'", [order_id]);

            // 2. Trigger Robot
            try {
                await aliceRobot.pickItem(locationCode);

                // 3. Update Item Status and Deduct Stock
                db.run("UPDATE order_items SET status = 'PICKED' WHERE id = ?", [orderItemId], (err) => {
                    if (err) console.error("Error updating order item:", err.message);

                    db.run("UPDATE medications SET stock = stock - ? WHERE id = ?", [quantity, medication_id], (err) => {
                        if (err) console.error("Error updating stock:", err.message);
                    });
                });

                res.json({ success: true, message: "Item picked and stock updated" });
            } catch (robotErr) {
                res.status(503).json({ error: robotErr.message });
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Complete Order
router.post('/orders/:id/complete', (req, res) => {
    const orderId = req.params.id;
    const userId = req.headers['x-user-id'];
    const userName = req.headers['x-user-name'] || 'Unknown';

    db.run("UPDATE orders SET status = 'READY' WHERE id = ?", [orderId], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        logActivity(userId, userName, "COMPLETE_ORDER", `Marked Order #${orderId} as READY`);

        res.json({ success: true, message: "Order marked as ready" });
    });
});

// Removed duplicate PUT /orders/:id/status route

// Edit Order (Patient Name & Items)
router.put('/orders/:id', (req, res) => {
    const { id } = req.params;
    const { patientName, medications } = req.body; // medications: [{ id, quantity }]

    console.log(`[EDIT ORDER] Updating Order #${id}. Patient: ${patientName}`, medications);

    if (!patientName || !medications || medications.length === 0) {
        return res.status(400).json({ error: "Invalid order data" });
    }

    db.serialize(() => {
        // 1. Check Order Status
        db.get("SELECT status FROM orders WHERE id = ?", [id], (err, order) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!order) return res.status(404).json({ error: "Order not found" });
            if (!order) return res.status(404).json({ error: "Order not found" });
            // Removed status check to allow editing any order

            // 2. Get Old Items to Restore Stock
            db.all("SELECT medication_id, quantity FROM order_items WHERE order_id = ?", [id], (err, oldItems) => {
                if (err) return res.status(500).json({ error: err.message });
                console.log(`[EDIT ORDER] Old Items to restore:`, oldItems);

                // 3. Verify New Stock Availability (including restored stock)
                // We need to fetch current stock for all new items
                const newMedIds = medications.map(m => m.id);
                const placeholders = newMedIds.map(() => '?').join(',');

                db.all(`SELECT id, stock FROM medications WHERE id IN (${placeholders})`, newMedIds, (err, stockRows) => {
                    if (err) return res.status(500).json({ error: err.message });
                    console.log(`[EDIT ORDER] Current Stock Rows:`, stockRows);

                    // Create a map of "Available Stock if we restore everything"
                    const effectiveStock = {};
                    stockRows.forEach(row => { effectiveStock[row.id] = row.stock; });
                    oldItems.forEach(item => {
                        if (effectiveStock[item.medication_id] !== undefined) {
                            effectiveStock[item.medication_id] += item.quantity;
                        } else {
                            // If item is not in new list, we might still strictly need to know its stock to restore, 
                            // but for *validation* of NEW items, we only care about new items.
                            // Restoring old items is safe regardless.
                        }
                    });
                    console.log(`[EDIT ORDER] Effective Stock (After Restore):`, effectiveStock);

                    // Check if new quantities are valid
                    for (const med of medications) {
                        const current = effectiveStock[med.id] || 0; // If not found, stock is 0 (or error)
                        console.log(`[EDIT ORDER] Checking Med #${med.id}. Need: ${med.quantity}, Have: ${current}`);
                        if (current < med.quantity) {
                            console.error(`[EDIT ORDER] Insufficient stock for #${med.id}`);
                            return res.status(400).json({ error: `Insufficient stock for medication #${med.id} (Have ${current}, Need ${med.quantity})` });
                        }
                    }

                    // 4. Execute Updates
                    db.serialize(() => {
                        // Restore Old Stock
                        const restoreStmt = db.prepare("UPDATE medications SET stock = stock + ? WHERE id = ?");
                        oldItems.forEach(item => {
                            restoreStmt.run(item.quantity, item.medication_id);
                        });
                        restoreStmt.finalize();

                        // Delete Old Items
                        db.run("DELETE FROM order_items WHERE order_id = ?", [id]);

                        // Deduct New Stock
                        const deductStmt = db.prepare("UPDATE medications SET stock = stock - ? WHERE id = ?");
                        medications.forEach(med => {
                            deductStmt.run(med.quantity, med.id);
                        });
                        deductStmt.finalize();

                        // Insert New Items
                        const insertStmt = db.prepare("INSERT INTO order_items (order_id, medication_id, quantity) VALUES (?, ?, ?)");
                        medications.forEach(med => {
                            insertStmt.run(id, med.id, med.quantity);
                        });
                        insertStmt.finalize();

                        // Update Patient Name
                        db.run("UPDATE orders SET patient_name = ? WHERE id = ?", [patientName, id], (err) => {
                            if (err) return res.status(500).json({ error: err.message });
                            res.json({ success: true, message: "Order updated successfully" });
                        });
                    });
                });
            });
        });
    });
});

// Inventory
router.get('/inventory', (req, res) => {
    db.all("SELECT * FROM medications", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add Inventory
router.post('/inventory', (req, res) => {
    const { name, dosage, stock, location_code, upc, photo_url } = req.body;

    if (!name || !location_code || !upc) {
        return res.status(400).json({ error: "Missing required fields: name, location_code, or upc" });
    }

    // Generate UPI (Unique Product Identifier) - UPC + Location
    const upi = `${upc}-${location_code}`;

    const query = `INSERT INTO medications (name, dosage, stock, location_code, upc, photo_url, upi, uid) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(query, [name, dosage, stock || 0, location_code, upc, photo_url, upi, req.body.uid], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, upi, message: "Inventory item added successfully" });
    });
});

// Update Inventory
router.put('/inventory/:id', (req, res) => {
    const { id } = req.params;
    const { name, dosage, stock, location_code, upc, photo_url } = req.body;

    if (!name || !location_code || !upc) {
        return res.status(400).json({ error: "Missing required fields: name, location_code, or upc" });
    }

    const upi = `${upc}-${location_code}`;

    const query = `UPDATE medications 
                   SET name = ?, dosage = ?, stock = ?, location_code = ?, upc = ?, photo_url = ?, upi = ?, uid = ?
                   WHERE id = ?`;

    db.run(query, [name, dosage, stock, location_code, upc, photo_url, upi, req.body.uid, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Item not found" });
        res.json({ success: true, upi, message: "Inventory item updated successfully" });
    });
});

// Remove Inventory
router.delete('/inventory/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM medications WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Item not found" });
        res.json({ success: true, message: "Inventory item removed" });
    });
});

// Photo Upload
router.post('/upload', upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    const photoUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    res.json({ photoUrl });
});


// Robot Status
router.get('/robot/status', (req, res) => {
    res.json(aliceRobot.getStatus());
});

// Robot Mode Control (Set OPERATIONAL, PAUSED, LOADING, FAULT)
router.post('/robot/mode', (req, res) => {
    const { mode } = req.body;
    aliceRobot.setMode(mode);
    res.json({ success: true, mode: mode });
});

// Autonomous Mode Toggle
router.post('/robot/autopick', (req, res) => {
    const { enabled } = req.body;
    aliceRobot.setAutoPick(enabled);
    res.json({ success: true, autoPick: aliceRobot.autoPick });
});

// Trigger a Pick Action (Manual or Managed)
router.post('/robot/pick', async (req, res) => {
    const { orderItemId, locationCode } = req.body;
    try {
        const result = await aliceRobot.pickItem(locationCode);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// ESP32 Integration: Next Job Polling
router.get('/robot/next-job', (req, res) => {
    res.json(aliceRobot.currentJob || { message: "NO_ACTIVE_JOB" });
});

// ESP32 Integration: Signal Hardware Completion
router.post('/robot/job-complete', (req, res) => {
    aliceRobot.signalJobComplete();
    res.json({ success: true, message: "System state updated to IDLE" });
});

// ESP32 Integration: Receive NFC/RFID Data from one of the locations
router.post('/robot/scan-identity', (req, res) => {
    const { nodeId, tagType, tagId, upc } = req.body; // nodeId 1-12

    // 1. Update the Hardware Node Status
    const updateNode = `UPDATE hardware_nodes SET 
                        status = 'ONLINE', 
                        last_scan_type = ?, 
                        last_scan_data = ?, 
                        last_heartbeat = CURRENT_TIMESTAMP 
                        WHERE id = ?`;

    db.run(updateNode, [tagType, tagId, nodeId], (err) => {
        if (err) console.error("Node update error:", err.message);
    });

    // 2. Sync with Inventory (Using UPC as the key)
    // If a medication exists with this UPC, update its UID to this specific location tag
    db.run("UPDATE medications SET uid = ? WHERE upc = ?", [tagId, upc], (err) => {
        if (err) console.error("Inventory sync error:", err.message);
    });

    res.json({ success: true, message: `Sync Complete for Location ${nodeId}` });
});

// GET all hardware machines
router.get('/machines', (req, res) => {
    const query = `
        SELECT hn.*, m.name as medication_name, m.stock 
        FROM hardware_nodes hn
        LEFT JOIN medications m ON hn.assigned_medication_id = m.id
        ORDER BY hn.id ASC
    `;
    db.all(query, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// UPDATE hardware machine config
router.put('/machines/:id', (req, res) => {
    const { id } = req.params;
    const { ipv6_address, assigned_medication_id, location_label } = req.body;

    const query = `UPDATE hardware_nodes SET 
                   ipv6_address = ?, 
                   assigned_medication_id = ?, 
                   location_label = ? 
                   WHERE id = ?`;

    db.run(query, [ipv6_address, assigned_medication_id, location_label, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Machine configuration updated" });
    });
});

// Identify Machine (Blink LED)
router.post('/machines/:id/identify', async (req, res) => {
    const { id } = req.params;
    db.get("SELECT ipv6_address FROM hardware_nodes WHERE id = ?", [id], async (err, row) => {
        if (err || !row || !row.ipv6_address) return res.status(404).json({ error: "Node not found or no IP assigned" });
        await aliceRobot.identifyNode(row.ipv6_address, 'FF0000');
        res.json({ success: true, message: "Identification signal sent" });
    });
});

// Read from NFC/RFID Tag at Machine
router.post('/machines/:id/read-tag', async (req, res) => {
    const { id } = req.params;
    const { type } = req.body; // 'NFC' or 'RFID'
    db.get("SELECT ipv6_address FROM hardware_nodes WHERE id = ?", [id], async (err, row) => {
        if (err || !row || !row.ipv6_address) return res.status(404).json({ error: "Node not found or no IP assigned" });
        try {
            const data = await aliceRobot.readTag(row.ipv6_address, type);
            res.json(data);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });
});

// Write to NFC/RFID Tag at Machine
router.post('/machines/:id/write-tag', async (req, res) => {
    const { id } = req.params;
    const { data, type } = req.body; // type is 'NFC' or 'RFID'
    db.get("SELECT ipv6_address FROM hardware_nodes WHERE id = ?", [id], async (err, row) => {
        if (err || !row || !row.ipv6_address) return res.status(404).json({ error: "Node not found or no IP assigned" });
        try {
            await aliceRobot.writeTag(row.ipv6_address, data, type);
            res.json({ success: true, message: `Data committed to ${type} tag` });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });
});

// Manual Pick from Machine
router.post('/machines/:id/pick', async (req, res) => {
    const { id } = req.params;
    db.get("SELECT location_label FROM hardware_nodes WHERE id = ?", [id], async (err, row) => {
        if (err || !row) return res.status(404).json({ error: "Node not found" });
        try {
            const result = await aliceRobot.pickItem(row.location_label);
            res.json(result);
        } catch (e) {
            res.status(400).json({ error: e.message });
        }
    });
});

// Dispense Order (Robot Handover) - UPDATED WITH LOGGING
router.post('/robot/dispense', async (req, res) => {
    const { orderId } = req.body;
    const userId = req.headers['x-user-id'];
    const userName = req.headers['x-user-name'] || 'Unknown';

    if (!orderId) return res.status(400).json({ error: "Missing orderId" });

    // 1. Verify Order is READY
    db.get("SELECT * FROM orders WHERE id = ? AND status = 'READY'", [orderId], async (err, order) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!order) return res.status(404).json({ error: "Order not found or not ready for pickup" });

        // 2. Trigger Robot Action (Simulated Handover)
        try {
            console.log(`[ROBOT] Dispensing Order #${orderId} to patient ${order.patientName}`);

            // Set robot mode to delivering/dispensing if supported, or just log
            // await aliceRobot.dispense(orderId); // If specific method existed

            // 3. Update Order to ARCHIVED (or DISPENSED)
            db.run("UPDATE orders SET status = 'ARCHIVED' WHERE id = ?", [orderId], (err) => {
                if (err) return res.status(500).json({ error: err.message });

                logActivity(userId, userName, "DISPENSE_ORDER", `Robot dispensed Order #${orderId}`);

                res.json({ success: true, message: "Order dispensed and archived", order });
            });

        } catch (error) {
            res.status(500).json({ error: "Robot dispensation failed" });
        }
    });
});

// Delete Order
router.delete('/orders/:id', (req, res) => {
    const { id } = req.params;

    db.serialize(() => {
        // 1. Check Order Status
        db.get("SELECT status FROM orders WHERE id = ?", [id], (err, order) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!order) return res.status(404).json({ error: "Order not found" });
            // Removed status check to allow deleting any order

            // 2. Get Items to Restore Stock
            db.all("SELECT medication_id, quantity FROM order_items WHERE order_id = ?", [id], (err, items) => {
                if (err) return res.status(500).json({ error: err.message });

                // 3. Restore Stock & Delete
                db.serialize(() => {
                    const restoreStmt = db.prepare("UPDATE medications SET stock = stock + ? WHERE id = ?");
                    items.forEach(item => {
                        restoreStmt.run(item.quantity, item.medication_id);
                    });
                    restoreStmt.finalize();

                    db.run("DELETE FROM order_items WHERE order_id = ?", [id]);
                    db.run("DELETE FROM orders WHERE id = ?", [id], (err) => {
                        if (err) return res.status(500).json({ error: err.message });
                        res.json({ success: true, message: "Order deleted and stock restored" });
                    });
                });
            });
        });
    });
});

// Helper to log activity
const logActivity = (userId, userName, action, details) => {
    const stmt = db.prepare("INSERT INTO activity_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)");
    stmt.run(userId, userName, action, details, (err) => {
        if (err) console.error("Error logging activity:", err.message);
    });
    stmt.finalize();
};

// Login Endpoint
router.post('/login', (req, res) => {
    const { accessCode } = req.body;

    db.get("SELECT * FROM users WHERE access_code = ?", [accessCode], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: 'Invalid Access Code' });

        res.json({
            success: true,
            user: { id: user.id, name: user.name, role: user.role },
            token: `mock-jwt-token-${user.id}`
        });
    });
});

// User Management
router.get('/users', (req, res) => {
    db.all("SELECT id, name, access_code, role, created_at FROM users ORDER BY created_at DESC", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.post('/users', (req, res) => {
    const { name, accessCode, role } = req.body;
    if (!name || !accessCode) return res.status(400).json({ error: "Name and Access Code required" });

    db.run("INSERT INTO users (name, access_code, role) VALUES (?, ?, ?)", [name, accessCode, role || 'staff'], function (err) {
        if (err) {
            if (err.message.includes("UNIQUE constraint failed")) return res.status(400).json({ error: "Access Code must be unique" });
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, id: this.lastID, message: "User created" });
    });
});

router.put('/users/:id', (req, res) => {
    const { id } = req.params;
    const { name, accessCode, role } = req.body;
    if (!name || !accessCode) return res.status(400).json({ error: "Name and Access Code required" });

    const query = "UPDATE users SET name = ?, access_code = ?, role = ? WHERE id = ?";
    db.run(query, [name, accessCode, role || 'staff', id], function (err) {
        if (err) {
            if (err.message.includes("UNIQUE constraint failed")) return res.status(400).json({ error: "Access Code must be unique" });
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, message: "User updated" });
    });
});

router.delete('/users/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "User deleted" });
    });
});

// Activity Logs
router.get('/logs', (req, res) => {
    db.all("SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 100", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create Order (Updated with logging)
router.post('/orders', (req, res) => {
    const { patientName, medications } = req.body;
    const userId = req.headers['x-user-id'];
    const userName = req.headers['x-user-name'] || 'Unknown';

    if (!patientName || !medications || medications.length === 0) {
        return res.status(400).json({ error: "Invalid order data" });
    }

    // Check stock for all medications
    const medIds = medications.map(m => m.id);
    const placeholders = medIds.map(() => '?').join(',');

    db.all(`SELECT id, name, stock FROM medications WHERE id IN (${placeholders})`, medIds, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        for (const med of medications) {
            const stockItem = rows.find(r => r.id === med.id);
            if (!stockItem || stockItem.stock < med.quantity) {
                return res.status(400).json({
                    error: `Insufficient stock for ${stockItem ? stockItem.name : 'Unknown Medication'}`
                });
            }
        }

        // Proceed to create order
        db.run("INSERT INTO orders (patient_name) VALUES (?)", [patientName], function (err) {
            if (err) return res.status(500).json({ error: err.message });

            const orderId = this.lastID;
            const stmt = db.prepare("INSERT INTO order_items (order_id, medication_id, quantity) VALUES (?, ?, ?)");

            medications.forEach(med => {
                stmt.run(orderId, med.id, med.quantity);
            });
            stmt.finalize();

            // Log Activity
            logActivity(userId, userName, "CREATE_ORDER", `Created Order #${orderId} for ${patientName}`);

            res.status(201).json({ id: orderId, message: "Order created" });
        });
    });
});

// Update Order Status (Updated with logging)
router.put('/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.headers['x-user-id'];
    const userName = req.headers['x-user-name'] || 'Unknown';

    if (!status) return res.status(400).json({ error: "Missing status" });

    db.run("UPDATE orders SET status = ? WHERE id = ?", [status, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Order not found" });

        // Log Activity if status is interesting
        if (status === 'ARCHIVED') {
            logActivity(userId, userName, "ARCHIVE_ORDER", `Archived/Dispensed Order #${id}`);
        } else if (status === 'READY') {
            logActivity(userId, userName, "COMPLETE_ORDER", `Marked Order #${id} as READY`);
        }

        res.json({ success: true, message: `Order status updated to ${status}` });
    });
});

module.exports = router;
