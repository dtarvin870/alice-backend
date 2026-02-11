const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'pharmacy.db'));

db.serialize(() => {
  // Medical Inventory
  db.run(`CREATE TABLE IF NOT EXISTS medications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    dosage TEXT,
    stock INTEGER DEFAULT 0,
    location_code TEXT, -- For robot to know where to pick
    upc TEXT,
    uid TEXT UNIQUE, -- Unique Asset Identifier from NFC/RFID
    photo_url TEXT,
    upi TEXT
  )`);

  // Machine Hardware Nodes (12 Distributed ESP32s)
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
  )`);

  // Orders
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_name TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING', -- PENDING, PROCESSING, READY, COMPLETED
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Order Items (Linking Orders to Medications)
  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    medication_id INTEGER,
    quantity INTEGER,
    status TEXT DEFAULT 'PENDING', -- PENDING, PICKED
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(medication_id) REFERENCES medications(id)
  )`);
  // Users (New)
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    access_code TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'staff',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Activity Logs (New)
  db.run(`CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_name TEXT,
    action TEXT NOT NULL,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Seed Default User (Daniel)
  db.get("SELECT count(*) as count FROM users", (err, row) => {
    if (row && row.count === 0) {
      console.log("Seeding initial user...");
      const stmt = db.prepare("INSERT INTO users (name, access_code, role) VALUES (?, ?, ?)");
      stmt.run("Daniel (Admin)", "12345678", "admin");
      stmt.finalize();
    }
  });

  // Seed some initial data for medications
  db.get("SELECT count(*) as count FROM medications", (err, row) => {
    if (row.count === 0) {
      console.log("Seeding medications...");
      const stmt = db.prepare("INSERT INTO medications (name, dosage, stock, location_code) VALUES (?, ?, ?, ?)");
      stmt.run("Amoxicillin", "500mg", 100, "A-12");
      stmt.run("Lisinopril", "10mg", 50, "B-05");
      stmt.run("Metformin", "500mg", 200, "C-08");
      stmt.run("Atorvastatin", "20mg", 80, "A-03");
      stmt.finalize();
    }
  });

  // Seed 12 Machine Nodes with Dummy Data
  db.get("SELECT count(*) as count FROM hardware_nodes", (err, row) => {
    if (row && row.count === 0) {
      console.log("Seeding machine nodes...");
      const stmt = db.prepare("INSERT INTO hardware_nodes (id, location_label, status, assigned_medication_id, ipv6_address) VALUES (?, ?, ?, ?, ?)");
      for (let i = 1; i <= 12; i++) {
        // Assign first 4 nodes some medications from the seed list
        let medId = i <= 4 ? i : null;
        let status = i <= 6 ? 'ONLINE' : 'OFFLINE';
        let ip = i <= 6 ? `fe80::${i % 9}abc:123${i}:def${i}` : null;
        stmt.run(i, `SLOT-${i.toString().padStart(2, '0')}`, status, medId, ip);
      }
      stmt.finalize();
    }
  });
});

module.exports = db;
