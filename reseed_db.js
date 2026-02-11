const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'pharmacy.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("Emptying tables...");
    db.run("DELETE FROM order_items");
    db.run("DELETE FROM orders");
    db.run("DELETE FROM hardware_nodes");
    db.run("DELETE FROM medications");
    db.run("DELETE FROM users");
    db.run("DELETE FROM activity_logs");

    console.log("Seeding medications...");
    const medStmt = db.prepare("INSERT INTO medications (id, name, dosage, stock, location_code, photo_url, upc) VALUES (?, ?, ?, ?, ?, ?, ?)");
    const meds = [
        [1, "Amoxicillin", "500MG CAPSULE", 150, "A-12", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200", "70462-123-01"],
        [2, "T-Virus Prototype", "5ML VIAL", 12, "LAB-01", "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=200", "UMB-001-ALPHA"],
        [3, "G-Virus Sample", "10ML VIAL", 5, "LAB-02", "https://images.unsplash.com/photo-1579165466541-7182247aa595?w=200", "UMB-002-BETA"],
        [4, "Green Herb Mix", "200G POWDER", 85, "STORAGE-A", "https://images.unsplash.com/photo-1512149673953-ad7960309193?w=200", "HERB-G-001"],
        [5, "Lisinopril", "10MG TABLET", 200, "B-05", "https://images.unsplash.com/photo-1471864190281-ad5f9f33dcf9?w=200", "00006-0106-31"],
        [6, "Atorvastatin", "20MG TABLET", 120, "A-03", "https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?w=200", "00071-0156-23"],
        [7, "Antitoxin-V3", "2ML AUTO-INJECT", 45, "EMERG-01", "https://images.unsplash.com/photo-1615461066159-fea0960485d5?w=200", "UMB-ANT-X"],
        [8, "Blue Herb Mix", "150G POWDER", 30, "STORAGE-B", "https://images.unsplash.com/photo-1540439867361-230aa714fa42?w=200", "HERB-B-001"]
    ];

    meds.forEach(m => medStmt.run(m));
    medStmt.finalize();

    console.log("Seeding machine nodes...");
    const hostStmt = db.prepare("INSERT INTO hardware_nodes (id, location_label, ipv6_address, status, assigned_medication_id) VALUES (?, ?, ?, ?, ?)");

    // Create 12 Nodes with specific locations
    const nodes = [
        { id: 1, label: "A-12 (Primary Bay)", ip: "fe80::1abc:1231:def1", status: "ONLINE", medId: 1 },
        { id: 2, label: "LAB-01 (Secure)", ip: "fe80::1abc:1232:def2", status: "ONLINE", medId: 2 },
        { id: 3, label: "LAB-02 (Bio-Hazard)", ip: "fe80::1abc:1233:def3", status: "ONLINE", medId: 3 },
        { id: 4, label: "STORAGE-A (General)", ip: "fe80::1abc:1234:def4", status: "ONLINE", medId: 4 },
        { id: 5, label: "B-05 (Dispenser)", ip: "fe80::1abc:1235:def5", status: "ONLINE", medId: 5 },
        { id: 6, label: "A-03 (High Volume)", ip: "fe80::1abc:1236:def6", status: "ONLINE", medId: 6 },
        { id: 7, label: "EMERG-01 (Rapid)", ip: "fe80::1abc:1237:def7", status: "ONLINE", medId: 7 },
        { id: 8, label: "STORAGE-B (Bulk)", ip: "fe80::1abc:1238:def8", status: "ONLINE", medId: 8 },
        { id: 9, label: "C-01 (Maintenance)", ip: null, status: "OFFLINE", medId: null },
        { id: 10, label: "C-02 (Maintenance)", ip: null, status: "OFFLINE", medId: null },
        { id: 11, label: "AUX-01 (Reserve)", ip: "fe80::1abc:123b:defb", status: "ONLINE", medId: null },
        { id: 12, label: "AUX-02 (Reserve)", ip: "fe80::1abc:123c:defc", status: "ONLINE", medId: null }
    ];

    nodes.forEach(n => {
        hostStmt.run(n.id, n.label, n.ip, n.status, n.medId);
    });
    hostStmt.finalize();

    console.log("Seeding users...");
    db.run("INSERT INTO users (name, access_code, role) VALUES ('Daniel (Admin)', '12345678', 'admin')");
    db.run("INSERT INTO users (name, access_code, role) VALUES ('Albert Wesker', '00000000', 'admin')");
    db.run("INSERT INTO users (name, access_code, role) VALUES ('Jill Valentine', '11111111', 'staff')");

    console.log("Seeding dummy orders...");
    db.run("INSERT INTO orders (id, patient_name, status) VALUES (1, 'Chris Redfield', 'PENDING')");
    db.run("INSERT INTO orders (id, patient_name, status) VALUES (2, 'Leon S. Kennedy', 'READY')");
    db.run("INSERT INTO orders (id, patient_name, status) VALUES (3, 'Claire Redfield', 'PROCESSING')");

    // Add items to orders
    db.run("INSERT INTO order_items (order_id, medication_id, quantity, status) VALUES (1, 4, 2, 'PENDING')");
    db.run("INSERT INTO order_items (order_id, medication_id, quantity, status) VALUES (1, 8, 1, 'PENDING')");
    db.run("INSERT INTO order_items (order_id, medication_id, quantity, status) VALUES (2, 7, 1, 'PICKED')");
    db.run("INSERT INTO order_items (order_id, medication_id, quantity, status) VALUES (3, 2, 1, 'PICKED')");
    db.run("INSERT INTO order_items (order_id, medication_id, quantity, status) VALUES (3, 3, 1, 'PENDING')");

    console.log("Database successfully reseeded with dummy data.");
});
db.close();
