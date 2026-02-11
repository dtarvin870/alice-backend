import React, { useState, useEffect } from 'react';
import { LayoutDashboard, CheckCircle2, Clock, Package, AlertCircle, Archive, ClipboardCheck, ArrowRight, Eye, Edit, Trash2, Activity as ActivityIcon } from 'lucide-react';
import OrderDetailsModal from '../components/OrderDetailsModal';
import SystemControl from '../components/SystemControl';
import { API_BASE } from '../apiConfig';

const OrdersOverview = ({ robotStatus }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('active'); // 'active' or 'archive'
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [inventoryStats, setInventoryStats] = useState({ total: 0, lowStock: 0 });
    const [locations, setLocations] = useState([]);


    const fetchOrders = () => {
        setLoading(true);
        fetch(`${API_BASE}/orders`)
            .then(res => res.json())
            .then(data => {
                setOrders(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching orders:", err);
                setLoading(false);
            });
    };

    const fetchInventoryStats = () => {
        fetch(`${API_BASE}/inventory`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setInventoryStats({
                        total: data.length,
                        lowStock: data.filter(i => i.stock < 10).length
                    });

                    // Summarize locations
                    const locMap = {};
                    data.forEach(item => {
                        const loc = item.location_code || 'UNASSIGNED';
                        if (!locMap[loc]) {
                            locMap[loc] = { stock: 0, items: [] };
                        }
                        locMap[loc].stock += item.stock;
                        locMap[loc].items.push(item.name);
                    });
                    setLocations(Object.entries(locMap).map(([code, stats]) => ({
                        code,
                        ...stats
                    })));
                }
            })
            .catch(console.error);
    };


    useEffect(() => {
        fetchOrders();
        fetchInventoryStats();
        // Poll for updates every 5 seconds
        const interval = setInterval(() => {
            fetchOrders();
            fetchInventoryStats();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleOrderUpdate = () => {
        fetchOrders();
        fetchInventoryStats(); // Update stats too as stock might change
    };

    const handleArchiveOrder = async (orderId) => {
        const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
        try {
            const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': currentUser.id,
                    'x-user-name': currentUser.name
                },
                body: JSON.stringify({ status: 'ARCHIVED' })
            });

            if (res.ok) {
                fetchOrders(); // Refresh list
            } else {
                alert("Failed to archive order");
            }
        } catch (error) {
            console.error("Error archiving order:", error);
            alert("Error archiving order");
        }
    };

    const handleDeleteOrder = async (orderId) => {
        try {
            const res = await fetch(`${API_BASE}/orders/${orderId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchOrders(); // Refresh list
                fetchInventoryStats(); // Refresh stats (stock restored)
            } else {
                const data = await res.json();
                alert(`Failed to delete order: ${data.error}`);
            }
        } catch (error) {
            console.error("Error deleting order:", error);
            alert("Error deleting order");
        }
    };

    const openModal = (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedOrder(null);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'PROCESSING': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'READY': return 'bg-green-100 text-green-800 border-green-200';
            case 'ARCHIVED': return 'bg-slate-100 text-slate-500 border-slate-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const activeOrders = orders.filter(o => o.status !== 'ARCHIVED');
    const archivedOrders = orders.filter(o => o.status === 'ARCHIVED');
    const displayedOrders = viewMode === 'active' ? activeOrders : archivedOrders;

    const pendingCount = activeOrders.filter(o => o.status === 'PENDING').length;
    const readyCount = activeOrders.filter(o => o.status === 'READY').length;


    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3 text-umbrella-black">
                        <LayoutDashboard className="w-6 h-6 text-umbrella-red" />
                        Logistics Overview
                    </h2>
                    <p className="text-[12px] font-mono font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Global Operations Monitoring // Clearance Lvl 4
                    </p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-sm border border-slate-200">
                    <button
                        onClick={() => setViewMode('active')}
                        className={`px-4 py-2 rounded-sm text-[12px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'active'
                            ? 'bg-white text-umbrella-red shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <ActivityIcon className="w-3 h-3" />
                        Active ({activeOrders.length})
                    </button>
                    <button
                        onClick={() => setViewMode('archive')}
                        className={`px-4 py-2 rounded-sm text-[12px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'archive'
                            ? 'bg-white text-umbrella-red shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <Archive className="w-3 h-3" />
                        Archived ({archivedOrders.length})
                    </button>
                </div>
            </div>

            {/* Dashboard Summary Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* System Control Panel */}
                <div className="lg:col-span-1">
                    <SystemControl
                        currentStatus={robotStatus?.mode}
                        onStatusChange={handleOrderUpdate}
                    />
                </div>

                {/* Inventory Assets Card */}
                <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm flex items-center gap-4">
                    <div className="p-3 rounded-full bg-blue-50 text-blue-600">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-[12px] font-mono font-bold text-slate-400 uppercase tracking-widest">Total Assets</div>
                        <div className="text-xl font-black uppercase text-black">{inventoryStats.total} UNITS</div>
                    </div>
                </div>

                {/* Order Pipeline Card */}
                <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm flex items-center gap-4">
                    <div className="p-3 rounded-full bg-umbrella-red/5 text-umbrella-red">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div className="flex-grow">
                        <div className="text-[12px] font-mono font-bold text-slate-400 uppercase tracking-widest">Order Pipeline</div>
                        <div className="flex gap-4">
                            <div>
                                <span className="text-xl font-black text-black">{pendingCount}</span>
                                <span className="text-[12px] font-mono font-bold ml-1 text-slate-400 uppercase">Pending</span>
                            </div>
                            <div className="w-[1px] h-6 bg-slate-100 self-center"></div>
                            <div>
                                <span className="text-xl font-black text-black">{readyCount}</span>
                                <span className="text-[12px] font-mono font-bold ml-1 text-emerald-600 uppercase">Ready</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Low Stock Card */}
                <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm flex items-center gap-4">
                    <div className={`p-3 rounded-full ${inventoryStats.lowStock > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-[12px] font-mono font-bold text-slate-400 uppercase tracking-widest">Low Stock Alerts</div>
                        <div className={`text-xl font-black uppercase ${inventoryStats.lowStock > 0 ? 'text-umbrella-red' : 'text-slate-500'}`}>
                            {inventoryStats.lowStock} {inventoryStats.lowStock === 1 ? 'ITEM' : 'ITEMS'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Machine Inventory Locations */}
            <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-umbrella-black rounded-sm flex items-center justify-center">
                        <Package className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-tighter text-black">Machine Topology</h3>
                        <p className="text-[12px] font-mono font-bold text-slate-400 uppercase tracking-widest">Real-time Bay Distribution Map</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {locations.sort((a, b) => a.code.localeCompare(b.code)).map(loc => (
                        <div key={loc.code} className="border border-slate-100 p-3 rounded-sm hover:border-umbrella-red/20 transition-all bg-slate-50">
                            <div className="text-[12px] font-black text-black uppercase tracking-tight mb-1">{loc.code}</div>
                            <div className="flex items-end justify-between">
                                <span className={`text-[12px] font-mono font-black ${loc.stock < 10 ? 'text-umbrella-red' : 'text-black'}`}>
                                    {loc.stock} <span className="text-[12px] opacity-50">UNITS</span>
                                </span>
                                <div className="text-[12px] font-mono text-slate-400 uppercase truncate max-w-[50%]">
                                    {loc.items[0]}{loc.items.length > 1 ? '...' : ''}
                                </div>
                            </div>
                        </div>
                    ))}
                    {locations.length === 0 && (
                        <div className="col-span-full py-4 text-center text-[12px] font-mono text-slate-400 uppercase italic">
                            No locations detected in system...
                        </div>
                    )}
                </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedOrders.length === 0 ? (
                    <div className="col-span-full py-12 border-2 border-dashed border-slate-100 rounded-sm flex flex-col items-center justify-center text-slate-300">
                        <ClipboardCheck className="w-12 h-12 mb-2 opacity-10" />
                        <span className="text-[12px] font-mono font-bold uppercase tracking-widest italic">No orders found in {viewMode} view</span>
                    </div>
                ) : (
                    displayedOrders.map(order => (
                        <div key={order.id} className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm hover:border-umbrella-red/30 transition-all group relative overflow-hidden flex flex-col">
                            <div className={`absolute top-0 right-0 px-3 py-1 text-[9px] font-black uppercase tracking-widest border-b border-l rounded-bl-sm ${getStatusColor(order.status)}`}>
                                {order.status}
                            </div>

                            <div className="mb-4">
                                <div className="text-[12px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">Order ID</div>
                                <div className="text-xl font-black text-umbrella-black">#{order.id.toString().padStart(4, '0')}</div>
                            </div>

                            <div className="mb-6 flex-grow">
                                <div className="text-[12px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">Subject / Patient</div>
                                <div className="text-sm font-bold text-slate-700 uppercase">{order.patient_name}</div>
                            </div>

                            <div className="text-[12px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                {new Date(order.created_at).toLocaleString()}
                            </div>

                            <div className="flex flex-col gap-2 mt-auto">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openModal(order)}
                                        className="flex-grow bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 py-2 rounded-sm text-[12px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                    >
                                        <Eye className="w-3 h-3" /> View Details
                                    </button>

                                    {order.status === 'PENDING' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm('Are you sure you want to delete this order? Stock will be restored.')) {
                                                    handleDeleteOrder(order.id);
                                                }
                                            }}
                                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-2 rounded-sm transition-all"
                                            title="Delete Order"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {order.status === 'READY' && viewMode === 'active' && (
                                    <button
                                        onClick={() => handleArchiveOrder(order.id)}
                                        className="w-full bg-umbrella-black hover:bg-umbrella-red text-white py-2 rounded-sm text-[12px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group/btn"
                                    >
                                        <span>Check Out / Archive</span>
                                        <ArrowRight className="w-3 h-3 text-white group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>


            <OrderDetailsModal
                order={selectedOrder}
                isOpen={isModalOpen}
                onClose={closeModal}
                onSave={handleOrderUpdate}
            />
        </div>
    );
};

export default OrdersOverview;
