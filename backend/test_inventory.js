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
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function verifyFullControl() {
    try {
        console.log("--- Starting Full Inventory Control Verification ---");

        // 1. Fetch current inventory to find a target for editing
        console.log("Fetching inventory...");
        const initialInv = await request(`${API_BASE}/inventory`);
        const target = initialInv.find(i => i.upi === 'UMBRELLA-TV-123-X-01') || initialInv[0];

        if (!target) throw new Error("No items found to verify edit/delete");
        console.log(`Targeting item ID ${target.id} (${target.name}) for verification.`);

        // 2. Test Edit (Update Stock and Name)
        console.log("Testing asset update (PUT)...");
        const updatedData = {
            ...target,
            name: target.name + " (REFINED)",
            stock: target.stock + 10
        };

        const editResult = await request(`${API_BASE}/inventory/${target.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: updatedData
        });

        console.log("Edit Result:", editResult);
        if (!editResult.success) throw new Error("Asset update failed");

        // Verify update in list
        const invAfterEdit = await request(`${API_BASE}/inventory`);
        const editedItem = invAfterEdit.find(i => i.id === target.id);
        if (editedItem.name !== updatedData.name || editedItem.stock !== updatedData.stock) {
            throw new Error("Update verification failed - data mismatch");
        }
        console.log("✅ Asset update verified.");

        // 3. Test Delete (Decommission)
        console.log("Testing asset decommissioning (DELETE)...");
        const deleteResult = await request(`${API_BASE}/inventory/${target.id}`, {
            method: 'DELETE'
        });

        console.log("Delete Result:", deleteResult);
        if (!deleteResult.success) throw new Error("Asset decommissioning failed");

        // Verify deletion in list
        const invAfterDelete = await request(`${API_BASE}/inventory`);
        if (invAfterDelete.some(i => i.id === target.id)) {
            throw new Error("Deletion verification failed - item still exists");
        }
        console.log("✅ Asset decommissioning verified.");

        console.log("--- ALL SECURE: Full Control Flow Verified ---");

    } catch (err) {
        console.error("Verification failed:", err.message);
    }
}

verifyFullControl();
