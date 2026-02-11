import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Plus, Trash2, ShoppingBag, Check, Package } from 'lucide-react';
import { API_BASE } from '../apiConfig';

const NewOrder = () => {
    const [patientName, setPatientName] = useState('');
    const [selectedMeds, setSelectedMeds] = useState([]);
    const [inventory, setInventory] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${API_BASE}/inventory`)
            .then(res => res.json())
            .then(data => setInventory(data));
    }, []);

    const addMed = (med) => {
        const existing = selectedMeds.find(m => m.id === med.id);
        const currentQty = existing ? existing.quantity : 0;

        if (currentQty >= med.stock) {
            alert(`Cannot add more ${med.name}. Only ${med.stock} in stock.`);
            return;
        }

        if (existing) {
            setSelectedMeds(selectedMeds.map(m =>
                m.id === med.id ? { ...m, quantity: m.quantity + 1 } : m
            ));
        } else {
            setSelectedMeds([...selectedMeds, { ...med, quantity: 1 }]);
        }
    };

    const removeMed = (id) => {
        setSelectedMeds(selectedMeds.filter(m => m.id !== id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!patientName || selectedMeds.length === 0) return;

        try {
            const resp = await fetch(`${API_BASE}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientName,
                    medications: selectedMeds.map(m => ({ id: m.id, quantity: m.quantity }))
                })
            });

            if (resp.ok) {
                navigate('/');
            } else {
                const data = await resp.json();
                alert(data.error || "Failed to create order");
            }
        } catch (err) {
            console.error("Error creating order:", err);
            alert("Network error. Please ensure backend is running.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl font-black text-umbrella-black uppercase tracking-tighter">Asset Authorization</h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Side: Detail Entry */}
                <div className="space-y-6">
                    <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm">
                        <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-[0.2em] font-bold">Personnel / Subject Identity</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                            <input
                                type="text"
                                value={patientName}
                                onChange={(e) => setPatientName(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-sm py-3 pl-11 pr-4 text-umbrella-black focus:outline-none focus:ring-1 focus:ring-umbrella-red transition-all font-mono uppercase tracking-widest text-sm"
                                placeholder="IDENTIFY SUBJECT"
                                required
                            />
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-6 rounded-sm max-h-[400px] overflow-y-auto shadow-sm">
                        <label className="block text-xs font-mono text-slate-400 mb-4 uppercase tracking-[0.2em] font-bold">Inventory Manifest</label>
                        <div className="grid grid-cols-1 gap-3">
                            {inventory.map(med => (
                                <button
                                    key={med.id}
                                    type="button"
                                    onClick={() => addMed(med)}
                                    className="flex justify-between items-center p-4 bg-slate-50 hover:bg-umbrella-red/5 rounded-sm border border-slate-100 hover:border-umbrella-red/30 transition-all text-left group/item"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-200 rounded-sm overflow-hidden flex-shrink-0 border border-slate-200">
                                            {med.photo_url ? (
                                                <img src={med.photo_url} alt={med.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                    <Package className="w-6 h-6 opacity-20" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-umbrella-black uppercase tracking-tight group-hover/item:text-umbrella-red transition-colors">{med.name}</div>
                                            <div className="text-[12px] font-mono text-slate-400 uppercase font-bold">{med.dosage} • AVail: {med.stock}</div>
                                            {med.upi && (
                                                <div className="text-[12px] font-mono text-umbrella-red mt-1 uppercase font-black tracking-widest bg-umbrella-red/5 px-1.5 py-0.5 rounded-sm border border-umbrella-red/10 inline-block">
                                                    UPI: {med.upi}
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                    <div className="bg-umbrella-red/5 p-2 rounded-sm group-hover/item:bg-umbrella-red transition-all border border-umbrella-red/10">
                                        <Plus className="w-4 h-4 text-umbrella-red group-hover/item:text-white" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Order Summary */}
                <div className="bg-white p-8 rounded-sm border border-slate-200 flex flex-col h-full shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                        <ShoppingBag className="w-6 h-6 text-umbrella-red" />
                        <h3 className="text-xl font-black text-umbrella-black uppercase tracking-tighter">Logistics Manifest</h3>
                    </div>

                    <div className="flex-grow space-y-4">
                        {selectedMeds.length === 0 ? (
                            <div className="text-center py-10 text-slate-300 italic font-mono text-[12px] uppercase font-bold tracking-widest opacity-50">
                                Manifest empty / No assets selected
                            </div>
                        ) : (
                            selectedMeds.map(item => (
                                <div key={item.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-sm border border-slate-100">
                                    <div>
                                        <div className="text-umbrella-black font-black text-sm uppercase tracking-tighter">{item.name}</div>
                                        <div className="text-[12px] font-mono text-slate-400 uppercase font-bold">{item.dosage} x {item.quantity} units</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeMed(item.id)}
                                        className="p-2 text-slate-300 hover:text-umbrella-red transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={!patientName || selectedMeds.length === 0}
                        className="mt-8 w-full bg-umbrella-red hover:bg-red-700 disabled:opacity-30 disabled:grayscale text-white font-black py-4 rounded-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-red-900/40 uppercase tracking-widest text-xs"
                    >
                        <Check className="w-5 h-5" />
                        Authorize Transaction
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewOrder;
