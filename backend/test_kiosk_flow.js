const API_URL = 'http://localhost:5000/api';

async function runTest() {
    console.log("Starting Kiosk Flow Verification...");

    // 1. Get Inventory to find a valid item
    const inventory = await (await fetch(`${API_URL}/inventory`)).json();
    if (inventory.length === 0) {
        console.error("No inventory found. Cannot test.");
        return;
    }
    const item = inventory[0];
    console.log(`[TEST] Using medication: ${item.name} (ID: ${item.id})`);

    // 2. Create Order
    const orderRes = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            patientName: "Test Patient Kiosk",
            medications: [{ id: item.id, quantity: 1 }]
        })
    });
    const orderData = await orderRes.json();
    const orderId = orderData.id;
    console.log(`[TEST] Created Order #${orderId}`);

    // 3. Force Complete Order (Simulate Robot Picking for speed)
    // We update DB directly or use the complete endpoint if status logic allows
    // The complete endpoint expects status to be PROCESSING usually, but let's try moving it to READY manually via DB if needed.
    // However, our API has `POST /orders/:id/complete` which sets it to READY.
    // It doesn't check previous status strictly in the SQL "UPDATE orders SET status = 'READY'..."

    await fetch(`${API_URL}/orders/${orderId}/complete`, { method: 'POST' });
    console.log(`[TEST] Order #${orderId} marked READY`);

    // 4. Test Kiosk Dispense
    console.log(`[TEST] Attempting Kiosk Dispense for Order #${orderId}...`);
    const dispenseRes = await fetch(`${API_URL}/robot/dispense`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderId })
    });

    const dispenseData = await dispenseRes.json();
    console.log(`[TEST] Dispense Result:`, dispenseData);

    if (dispenseData.success) {
        console.log("✅ KIOSK FLOW VERIFIED SUCCESSFUL");
    } else {
        console.error("❌ KIOSK FLOW FAILED");
    }
}

runTest();
