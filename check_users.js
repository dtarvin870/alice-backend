const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./pharmacy.db');

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    console.log("Tables:", tables);
    if (tables.find(t => t.name === 'users')) {
        db.all("SELECT * FROM users", (err, rows) => {
            console.log("Users:", rows);
        });
    } else {
        console.log("Users table missing");
    }
});
