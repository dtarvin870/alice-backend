const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./pharmacy.db');

db.serialize(() => {
    console.log("Checking tables...");
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
        if (err) {
            console.error("Error listing tables:", err);
            return;
        }
        console.log("Tables found:", rows.map(r => r.name).join(", "));

        if (rows.some(r => r.name === 'hardware_nodes')) {
            console.log("\nChecking hardware_nodes content...");
            db.all("SELECT * FROM hardware_nodes", (err, nodes) => {
                if (err) {
                    console.error("Error reading hardware_nodes:", err);
                    return;
                }
                console.log(`Found ${nodes.length} nodes.`);
                if (nodes.length > 0) {
                    console.log("First node:", nodes[0]);
                }
            });
        } else {
            console.log("\nCRITICAL: hardware_nodes table is MISSING.");
        }
    });

    db.all("PRAGMA table_info(medications)", (err, rows) => {
        if (err) {
            console.error("Error checking medications schema:", err);
            return;
        }
        const hasUid = rows.some(r => r.name === 'uid');
        console.log("\nMedications table has 'uid' column:", hasUid);
    });
});
