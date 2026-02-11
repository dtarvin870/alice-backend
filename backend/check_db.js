const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./pharmacy.db');

db.serialize(() => {
    console.log("--- Medications ---");
    db.all("SELECT id, name FROM medications", (err, rows) => {
        if (err) console.error(err);
        console.log(rows);
    });

    console.log("--- Hardware Nodes ---");
    db.all("SELECT id, location_label, status FROM hardware_nodes", (err, rows) => {
        if (err) console.error(err);
        console.log(rows);
    });

    console.log("--- Users ---");
    db.all("SELECT id, name FROM users", (err, rows) => {
        if (err) console.error(err);
        console.log(rows);
    });
});
db.close();
