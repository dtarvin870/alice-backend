const http = require('http');

const API_BASE = 'http://localhost:5000/api';

function request(url, options = {}) {
    return new Promise((resolve, reject) => {
        const { method = 'GET', body, headers = {} } = options;
        const req = http.request(url, { method, headers }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

async function verifyRefinements() {
    try {
        console.log("--- Starting Verification Script (Native HTTP) ---");

        // 1. Get initial inventory
        const inventory = await request(`${API_BASE}/inventory`);
        const amox = inventory.find(i => i.name === 'Amoxicillin');
        const initialStock = amox.stock;
        console.log(`Initial Amoxicillin Stock: ${initialStock}`);

        // 2. Create an order
        const orderData = await request(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                patientName: "TEST PATIENT",
                medications: [{ id: amox.id, quantity: 1 }]
            })
        });
        const orderId = orderData.id;
        console.log(`Created Order #${orderId}`);

        // 3. Get order items
        const items = await request(`${API_BASE}/orders/${orderId}`);
        const orderItemId = items[0].id;
        console.log(`Order Item ID: ${orderItemId}`);

        // 4. Trigger Pick
        console.log("Triggering ALICE Robot Pick...");
        const pickResult = await request(`${API_BASE}/robot/pick`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderItemId: orderItemId,
                locationCode: amox.location_code
            })
        });
        console.log("Pick Result:", pickResult);

        // 5. Verify Stock Deduction
        console.log("Waiting for database updates...");
        await new Promise(r => setTimeout(r, 1000)); // 1s delay

        const inventory2 = await request(`${API_BASE}/inventory`);
        const amox2 = inventory2.find(i => i.name === 'Amoxicillin');
        console.log(`Final Amoxicillin Stock: ${amox2.stock}`);

        if (amox2.stock === initialStock - 1) {
            console.log("✅ SUCCESS: Stock deducted correctly.");
        } else {
            console.error("❌ FAILURE: Stock NOT deducted correctly.");
        }

        // 6. Verify Order Status
        const orders = await request(`${API_BASE}/orders`);
        const testOrder = orders.find(o => o.id === orderId);
        console.log(`Order Status: ${testOrder.status}`);

        if (testOrder.status === 'PROCESSING') {
            console.log("✅ SUCCESS: Order status updated to PROCESSING.");
        } else {
            console.error("❌ FAILURE: Order status is NOT PROCESSING.");
        }

    } catch (err) {
        console.error("Verification failed:", err.message);
    }
}

verifyRefinements();

