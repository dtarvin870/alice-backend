import React, { useState, useEffect } from 'react';
import { X, Save, Edit2, Trash2, Plus, Package, AlertCircle, ArrowRight } from 'lucide-react';
import { API_BASE } from '../apiConfig';

const OrderDetailsModal = ({ order, isOpen, onClose, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    // ... existing state ...

    // ... existing useEffect ...

    // ... existing handlers ...

    const handleArchive = async () => {
        if (!confirm('Are you sure you want to archive this order?')) return;

        try {
            const res = await fetch(`${API_BASE}/orders/${order.id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'ARCHIVED' })
            });

            if (res.ok) {
                onSave(); // Refresh parent
                onClose();
            } else {
                alert("Failed to archive order");
            }
        } catch (error) {
            console.error("Error archiving order:", error);
            alert("Error archiving order");
        }
    };

    if (!isOpen || !order) return null;

    const canEdit = order.status === 'PENDING';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* ... Header & Body ... */}

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                    {!isEditing && order.status === 'READY' && (
                        <button
                            onClick={handleArchive}
                            className="bg-umbrella-black hover:bg-umbrella-red text-white px-5 py-2 rounded-sm text-xs font-black uppercase tracking-widest flex items-center gap-2 mr-auto transition-colors group"
                        >
                            <span>Check Out / Archive</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}

                    {isEditing ? (
                        <>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="bg-umbrella-red hover:bg-red-700 text-white px-5 py-2 rounded-sm text-xs font-black uppercase tracking-widest flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Save Changes
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-sm text-xs font-black uppercase tracking-widest"
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsModal;
