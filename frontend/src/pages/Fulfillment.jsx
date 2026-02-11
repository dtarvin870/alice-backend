import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, Trash2, Cpu, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Edit, RefreshCw } from 'lucide-react';
import RobotStatus from '../components/RobotStatus';
import EditOrderModal from '../components/EditOrderModal';
import { API_BASE } from '../apiConfig';

const Fulfillment = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [orderInfo, setOrderInfo] = useState(null);
    const [pickingId, setPickingId] = useState(null);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = async () => {
        try {
            const [itemsResp, ordersResp] = await Promise.all([
                fetch(`${API_BASE}/orders/${id}`),
                fetch(`${API_BASE}/orders`)
            ]);

            const itemsData = await itemsResp.json();
            const ordersData = await ordersResp.json();

            setItems(itemsData);
            setOrderInfo(ordersData.find(o => o.id === parseInt(id)));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 2000); // Poll for status updates
        return () => clearInterval(interval);
    }, [id]);

    const handlePick = async (orderItemId, locationCode) => {
        setPickingId(orderItemId);
        setError(null);
        try {
            const resp = await fetch(`${API_BASE}/robot/pick`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderItemId, locationCode })
            });

            if (!resp.ok) {
                const data = await resp.json();
                throw new Error(data.error || "Robot failed to pick");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setPickingId(null);
        }
    };

    const handleComplete = async () => {
        const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
        try {
            const resp = await fetch(`${API_BASE}/orders/${id}/complete`, {
                method: 'POST',
                headers: {
                    'x-user-id': currentUser.id,
                    'x-user-name': currentUser.name
                }
            });
            if (resp.ok) {
                navigate('/');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleArchiveAndComplete = async () => {
        const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
        try {
            // First mark as complete/ready
            const completeResp = await fetch(`${API_BASE}/orders/${id}/complete`, {
                method: 'POST',
                headers: {
                    'x-user-id': currentUser.id,
                    'x-user-name': currentUser.name
                }
            });

            if (!completeResp.ok) throw new Error("Failed to complete order");

            // Then archive
            const archiveResp = await fetch(`${API_BASE}/orders/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': currentUser.id,
                    'x-user-name': currentUser.name
                },
                body: JSON.stringify({ status: 'ARCHIVED' })
            });

            if (archiveResp.ok) {
                navigate('/');
            }
        } catch (err) {
            console.error(err);
            setError("Failed to archive order");
        }
    };

    const handleOrderUpdate = () => {
        fetchData();
    };

    const allPicked = items.length > 0 && items.every(i => i.status === 'PICKED');

    if (!orderInfo) return <div className="p-10 text-center text-slate-500">Loading Order...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-red-50 rounded-full text-slate-400 hover:text-umbrella-red transition-colors border border-transparent hover:border-red-200"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <div>
                            <div className="flex items-center gap-4 mb-1">
                                <h2 className="text-3xl font-black text-umbrella-black uppercase tracking-tighter">Asset Extraction Control</h2>
                                <span className={`px-3 py-1 rounded-sm text-[12px] font-black uppercase tracking-widest border ${orderInfo.status === 'READY' ? 'bg-green-50 text-green-600 border-green-200' :
                                    orderInfo.status === 'PROCESSING' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                        orderInfo.status === 'ARCHIVED' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                                            'bg-yellow-50 text-yellow-600 border-yellow-200'
                                    }`}>
                                    STATUS: {orderInfo.status}
                                </span>
                            </div>
                            <p className="font-mono text-[12px] font-bold text-umbrella-red uppercase tracking-[0.2em]">Personnel / Subject: {orderInfo.patient_name}</p>
                            <p className="text-slate-400 text-[12px] font-mono mt-1 opacity-70 font-bold uppercase tracking-widest">LOG-FILE ID: #{id.toString().padStart(4, '0')}</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-sm text-xs font-black uppercase tracking-widest transition-colors"
                >
                    <Edit className="w-4 h-4" /> Edit Manifest
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Items List */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-[12px] font-mono font-black text-slate-400 mb-4 uppercase tracking-[0.3em] flex items-center gap-2 border-l-2 border-umbrella-red pl-3">
                        Asset Manifest Checklist
                    </h3>

                    {items.map(item => (
                        <div
                            key={item.id}
                            className={`p-6 rounded-sm border transition-all ${item.status === 'PICKED'
                                ? 'bg-red-50 border-umbrella-red/30 shadow-sm'
                                : 'bg-white border-slate-200 shadow-sm'
                                }`}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="text-xl font-bold text-umbrella-black group-hover:text-umbrella-red transition-colors uppercase tracking-tight">{item.name}</div>
                                    <div className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">{item.dosage}</div>
                                    <div className="mt-2 text-[12px] font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded inline-block font-bold">
                                        LOC: {item.location_code}
                                    </div>
                                </div>

                                {item.status === 'PICKED' ? (
                                    <div className="flex items-center gap-2 text-umbrella-red font-black text-xs uppercase tracking-widest bg-umbrella-red/10 px-4 py-2 rounded-sm border border-umbrella-red/30">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Extracted
                                    </div>
                                ) : (
                                    <button
                                        disabled={pickingId !== null}
                                        onClick={() => handlePick(item.id, item.location_code)}
                                        className={`px-6 py-4 rounded-sm font-mono text-[12px] font-black tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95 border ${pickingId === item.id
                                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                            : 'bg-umbrella-red hover:bg-red-700 text-white border-transparent'
                                            }`}
                                    >
                                        <Cpu className={`w-4 h-4 ${pickingId === item.id ? 'animate-pulse' : ''}`} />
                                        {pickingId === item.id ? 'A.L.I.C.E. EXTRACTING...' : 'TRIGGER A.L.I.C.E.'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Automation Status Panel */}
                <div className="space-y-6">

                    {error && (
                        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-2xl flex items-start gap-3 text-red-200">
                            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                            <div className="text-sm">{error}</div>
                        </div>
                    )}

                    <div className="bg-white p-8 rounded-sm border border-slate-200 text-center relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 left-0 w-full h-1 bg-umbrella-red/20"></div>
                        <div className={`w-16 h-16 rounded-sm rotate-45 mx-auto flex items-center justify-center mb-6 transition-colors border-2 ${allPicked ? 'bg-umbrella-red border-white shadow-lg' : 'bg-slate-50 border-umbrella-red/10'
                            }`}>
                            <CheckCircle2 className={`w-8 h-8 -rotate-45 ${allPicked ? 'text-white' : 'text-slate-200'}`} />
                        </div>
                        <h4 className="text-umbrella-black font-black text-sm mb-2 uppercase tracking-widest">Transaction Finalization</h4>
                        <p className="text-[12px] font-mono text-slate-400 mb-8 uppercase leading-relaxed font-bold tracking-tight">
                            Verify containment & security seals before finalizing asset transfer.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                disabled={!allPicked}
                                onClick={handleComplete}
                                className="w-full bg-umbrella-red hover:bg-red-700 disabled:opacity-30 disabled:grayscale text-white font-black py-4 rounded-sm transition-all shadow-xl active:scale-95 uppercase tracking-widest text-xs"
                            >
                                Mark as Ready
                            </button>

                            <button
                                disabled={!allPicked}
                                onClick={handleArchiveAndComplete}
                                className="w-full bg-slate-800 hover:bg-slate-900 disabled:opacity-30 disabled:grayscale text-white font-black py-3 rounded-sm transition-all shadow-lg active:scale-95 uppercase tracking-widest text-[12px] flex items-center justify-center gap-2 group"
                            >
                                <span>Complete & Archive</span>
                                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <EditOrderModal
                orderId={orderInfo ? orderInfo.id : null}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={() => {
                    handleOrderUpdate();
                    navigate('/'); // Go back to list on delete/save as data might have changed drastically
                }}
            />
        </div>
    );
};

export default Fulfillment;
