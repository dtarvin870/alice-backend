import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { API_BASE } from '../apiConfig';

const EditOrderModal = ({ orderId, isOpen, onClose, onSave }) => {
    const [items, setItems] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newItemId, setNewItemId] = useState('');
    const [patientName, setPatientName] = useState('');
    const [error, setError] = useState(null);

    // Fetch Data on Mount/Open
    useEffect(() => {
        if (isOpen && orderId) {
            fetchData();
        }
    }, [isOpen, orderId]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [orderRes, inventoryRes] = await Promise.all([
                fetch(`${API_BASE}/orders/${orderId}`),
                fetch(`${API_BASE}/inventory`)
            ]);

            if (!orderRes.ok) throw new Error('Failed to fetch order');
            if (!inventoryRes.ok) throw new Error('Failed to fetch inventory');

            const orderData = await orderRes.json();
            const inventoryData = await inventoryRes.json();

            // Transform order items to include inventory stock for validation
            const mappedItems = orderData.map(item => ({
                orderItemId: item.id,
                medication_id: item.medication_id,
                name: item.name,
                dosage: item.dosage,
                quantity: item.quantity,
                location: item.location_code
            }));

            // We need patient name too, but the /api/orders/:id endpoint returns an array of items
            // We'll infer patient name from parent or fetch order details separately if needed. 
            // Better approach: fetch the order summary from the main list or if /orders/:id returned the order object.
            // For now, let's assume we can get patient name from the parent or we just don't edit patient name here if it's too complex, 
            // BUT requirements said edit patient name. Let's fetch the single order details safely.

            // Actually, let's just fetch all orders to find this one's meta data (inefficient but safe for now)
            const allOrdersRes = await fetch(`${API_BASE}/orders`);
            const allOrders = await allOrdersRes.json();
            const currentOrder = allOrders.find(o => o.id === parseInt(orderId));

            if (currentOrder) {
                setPatientName(currentOrder.patient_name);
            }

            setItems(mappedItems);
            setInventory(inventoryData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = (index, newQty) => {
        const updated = [...items];
        updated[index].quantity = parseInt(newQty) || 1;
        setItems(updated);
    };

    const handleRemoveItem = (index) => {
        const updated = [...items];
        updated.splice(index, 1);
        setItems(updated);
    };

    const handleAddItem = () => {
        if (!newItemId) return;
        const med = inventory.find(i => i.id === parseInt(newItemId));
        if (med) {
            const existing = items.find(i => i.medication_id === med.id);
            if (existing) {
                handleQuantityChange(items.indexOf(existing), existing.quantity + 1);
            } else {
                setItems([...items, {
                    medication_id: med.id,
                    name: med.name,
                    dosage: med.dosage,
                    quantity: 1,
                    location: med.location_code
                }]);
            }
            setNewItemId('');
        }
    };

    const handleSave = async () => {
        const payload = {
            patientName,
            medications: items.map(i => ({
                id: i.medication_id,
                quantity: i.quantity
            }))
        };

        try {
            const res = await fetch(`${API_BASE}/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok) {
                onSave();
                onClose();
            } else {
                setError(data.error);
            }
        } catch (e) {
            setError("Failed to update order");
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure? This will delete the order and restore stock.")) return;

        try {
            const res = await fetch(`${API_BASE}/orders/${orderId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                onSave(); // Parent will refresh and likely navigate away
                onClose();
            } else {
                const data = await res.json();
                setError(data.error);
            }
        } catch (e) {
            setError("Failed to delete order");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                    <div>
                        <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Manifest Editor</div>
                        <h2 className="text-xl font-black uppercase text-umbrella-black">Edit Order #{orderId}</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-umbrella-red">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-grow space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-xs font-bold border border-red-200 rounded-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
                            <RefreshCw className="w-5 h-5 animate-spin" /> Loading Data...
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">Subject Name</label>
                                <input
                                    value={patientName}
                                    onChange={(e) => setPatientName(e.target.value)}
                                    className="w-full font-bold uppercase border border-slate-300 p-2 rounded-sm"
                                />
                            </div>

                            <table className="w-full text-left border border-slate-200 rounded-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                                        <th className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest w-24">Location</th>
                                        <th className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest w-20">Qty</th>
                                        <th className="p-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item, idx) => {
                                        const stockItem = inventory.find(i => i.id === item.medication_id);
                                        const stockCount = stockItem ? stockItem.stock : 0;
                                        // Effective stock for validation logic could be complex visually, 
                                        // but simple "Available: X" is good enough for now.
                                        return (
                                            <tr key={idx} className="group hover:bg-slate-50">
                                                <td className="p-3">
                                                    <div className="font-bold text-xs uppercase text-umbrella-black">{item.name}</div>
                                                    <div className="text-[10px] text-slate-400">
                                                        {item.dosage}
                                                        <span className="ml-2 text-emerald-600 font-bold">
                                                            (Stock: {stockCount})
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-[10px] font-mono text-slate-500">{item.location}</td>
                                                <td className="p-3">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => handleQuantityChange(idx, e.target.value)}
                                                        className="w-16 border border-slate-200 rounded-sm p-1 text-center font-bold text-xs"
                                                    />
                                                </td>
                                                <td className="p-3 text-center">
                                                    <button onClick={() => handleRemoveItem(idx)} className="text-red-300 hover:text-red-500">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            <div className="flex gap-2">
                                <select
                                    value={newItemId}
                                    onChange={(e) => setNewItemId(e.target.value)}
                                    className="flex-grow border border-slate-300 rounded-sm p-2 text-xs uppercase font-bold"
                                >
                                    <option value="">Add Medication...</option>
                                    {inventory.map(med => (
                                        <option key={med.id} value={med.id} disabled={med.stock <= 0}>
                                            {med.name} - {med.stock} Available
                                        </option>
                                    ))}
                                </select>
                                <button onClick={handleAddItem} disabled={!newItemId} className="bg-slate-800 text-white px-4 py-2 rounded-sm text-xs font-black uppercase">
                                    <Plus className="w-4 h-4" /> Add
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-between">
                    <button
                        onClick={handleDelete}
                        className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-sm text-xs font-black uppercase flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" /> Delete Order
                    </button>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="text-slate-500 font-bold text-xs uppercase hover:text-slate-800">Cancel</button>
                        <button onClick={handleSave} className="bg-umbrella-red hover:bg-red-700 text-white px-6 py-2 rounded-sm text-xs font-black uppercase flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
                            <Save className="w-4 h-4" /> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditOrderModal;
