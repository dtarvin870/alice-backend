const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./pharmacy.db');

db.serialize(() => {
    console.log("Migrating database for Machine Fleet Support...");

    // 1. Add UID column to medications (Ignore error if it already exists)
    db.run("ALTER TABLE medications ADD COLUMN uid TEXT UNIQUE", (err) => {
        if (err) {
            if (err.message.includes("duplicate column name")) {
                console.log("- 'uid' column already exists in medications.");
            } else {
                console.error("- Error adding 'uid' column:", err.message);
            }
        } else {
            console.log("- 'uid' column added to medications.");
        }
    });

    // 2. Create hardware_nodes table
    db.run(`CREATE TABLE IF NOT EXISTS hardware_nodes (
        id INTEGER PRIMARY KEY, -- 1 to 12
        location_label TEXT,    -- e.g., "SLOT-01"
        ipv6_address TEXT,
        status TEXT DEFAULT 'OFFLINE',
        last_scan_type TEXT,
        last_scan_data TEXT,
        last_heartbeat DATETIME,
        assigned_medication_id INTEGER,
        FOREIGN KEY(assigned_medication_id) REFERENCES medications(id)
    )`, (err) => {
        if (err) {
            console.error("- Error creating hardware_nodes table:", err.message);
        } else {
            console.log("- hardware_nodes table ready.");
        }
    });

    // 3. Seed 12 Machine Nodes (Upsert style)
    db.get("SELECT count(*) as count FROM hardware_nodes", (err, row) => {
        if (row && row.count === 0) {
            console.log("- Seeding initial 12 machine nodes...");
            const stmt = db.prepare("INSERT INTO hardware_nodes (id, location_label, status, assigned_medication_id, ipv6_address) VALUES (?, ?, ?, ?, ?)");
            for (let i = 1; i <= 12; i++) {
                let medId = i <= 4 ? i : null;
                let status = i <= 6 ? 'ONLINE' : 'OFFLINE';
                let ip = i <= 6 ? `fe80::${i % 9}abc:123${i}:def${i}` : null;
                stmt.run(i, `SLOT-${i.toString().padStart(2, '0')}`, status, medId, ip);
            }
            stmt.finalize();
            console.log("- Seeding complete.");
        } else {
            console.log("- Machine nodes already seeded.");
        }
    });

    console.log("Migration finished.");
});
