import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';
import { API_BASE } from '../apiConfig';
import RobotStatus from '../components/RobotStatus';
import SystemControl from '../components/SystemControl';

const Dashboard = ({ robotStatus }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const resp = await fetch(`${API_BASE}/orders`);
            const data = await resp.json();
            setOrders(data);
        } catch (err) {
            console.error("Failed to fetch orders:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 30000); // refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'READY': return 'bg-red-50 text-umbrella-red border-red-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-80 space-y-6">
                <RobotStatus isBusy={robotStatus?.isBusy} />
                <SystemControl currentStatus={robotStatus?.mode} onStatusChange={fetchOrders} />

                <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm">
                    <h4 className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-4">Network Integrity</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-[11px] font-bold">
                            <span className="text-slate-500">Gantry Node</span>
                            <span className="text-emerald-600">ONLINE</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-bold">
                            <span className="text-slate-500">Scanner Array</span>
                            <span className="text-emerald-600">ONLINE</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-bold">
                            <span className="text-slate-500">UI Kiosk</span>
                            <span className="text-emerald-600">ONLINE</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-black text-umbrella-black uppercase tracking-tighter">Secure Asset Queue</h2>
                        <p className="text-umbrella-silver font-mono text-[12px] mt-1 uppercase tracking-[0.2em] font-bold">Real-time surveillance & logistics</p>
                    </div>
                    <button
                        onClick={fetchOrders}
                        className="p-2 hover:bg-umbrella-red/5 rounded-sm text-umbrella-silver transition-colors border border-transparent hover:border-umbrella-red/20"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading && orders.length === 0 ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-48 bg-slate-100 border border-slate-200 rounded-sm animate-pulse" />
                        ))
                    ) : orders.map(order => (
                        <div
                            key={order.id}
                            onClick={() => navigate(`/fulfillment/${order.id}`)}
                            className="group relative bg-white border border-slate-200 p-6 rounded-sm hover:border-umbrella-red hover:shadow-xl transition-all cursor-pointer overflow-hidden shadow-sm"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Package className="w-24 h-24 text-umbrella-black" />
                            </div>

                            <div className="flex justify-between items-start mb-4">
                                <span className={`text-xs font-bold px-2 py-1 rounded-md border ${getStatusColor(order.status)}`}>
                                    {order.status}
                                </span>
                                <span className="text-slate-500 text-xs flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <h3 className="text-xl font-black text-umbrella-black group-hover:text-umbrella-red transition-colors uppercase tracking-tighter">
                                {order.patient_name}
                            </h3>

                            <div className="mt-6 flex justify-between items-center font-mono">
                                <div className="text-[12px] text-slate-400 font-bold tracking-widest">
                                    ASSET ID: <span className="text-umbrella-black">#{order.id.toString().padStart(4, '0')}</span>
                                </div>
                                <div className="bg-white border-2 border-slate-200 p-2 rounded-sm text-slate-300 group-hover:text-umbrella-red group-hover:bg-red-50 group-hover:border-umbrella-red transition-all">
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    ))}

                    {!loading && orders.length === 0 && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-sm">
                            <Package className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-lg uppercase font-black tracking-widest">No active orders</p>
                            <button
                                onClick={() => navigate('/catalog')}
                                className="mt-4 text-umbrella-red font-black hover:underline uppercase tracking-widest text-xs"
                            >
                                Create new order
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
