import React, { useState, useEffect } from 'react';
import { Cpu, Activity, Settings, RefreshCw, AlertCircle, CheckCircle2, Link2, Scan, Package, Database, Edit3, X, Save, Eye, MousePointer2, Zap, PenTool, Radio, Fingerprint } from 'lucide-react';
import { API_BASE } from '../apiConfig';

const MachineControl = () => {
    const [view, setView] = useState('monitor'); // 'monitor' or 'admin'
    const [machines, setMachines] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null); // Node ID being acted upon

    // Admin Edit State
    const [editingMachine, setEditingMachine] = useState(null);
    const [editFormData, setEditFormData] = useState({
        ipv6_address: '',
        assigned_medication_id: '',
        location_label: ''
    });

    // Tag Operations (Write) State
    const [tagOpNode, setTagOpNode] = useState(null);
    const [tagContent, setTagContent] = useState('');
    const [tagType, setTagType] = useState('NFC');

    // Live read results per node stored as strings
    const [meshReadResults, setMeshReadResults] = useState({});

    const fetchData = async () => {
        try {
            const [machRes, invRes] = await Promise.all([
                fetch(`${API_BASE}/machines`),
                fetch(`${API_BASE}/inventory`)
            ]);
            const machData = await machRes.json();
            const invData = await invRes.json();
            setMachines(machData);
            setInventory(invData);
            setError(null);
        } catch (err) {
            setError("Failed to synchronize with hardware network.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleAction = async (nodeId, endpoint, body = {}) => {
        setActionLoading(nodeId);
        try {
            const res = await fetch(`${API_BASE}/machines/${nodeId}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Action failed");
            }
            return data;
        } catch (e) {
            alert(e.message);
            return null;
        } finally {
            setActionLoading(null);
        }
    };

    const triggerRead = async (machine, type) => {
        const result = await handleAction(machine.id, 'read-tag', { type });
        if (result) {
            setMeshReadResults(prev => ({
                ...prev,
                [machine.id]: {
                    ...prev[machine.id],
                    [type]: result.data
                }
            }));
        }
    };

    const openWriteModal = (machine, type) => {
        setTagOpNode(machine);
        setTagType(type);
        setTagContent('');
    };

    const executeWrite = async () => {
        if (!tagContent) return;
        const success = await handleAction(tagOpNode.id, 'write-tag', { data: tagContent, type: tagType });
        if (success) {
            setTagOpNode(null);
        }
    };

    const handleEditClick = (machine) => {
        setEditingMachine(machine);
        setEditFormData({
            ipv6_address: machine.ipv6_address || '',
            assigned_medication_id: machine.assigned_medication_id || '',
            location_label: machine.location_label || ''
        });
    };

    const handleSaveEdit = async () => {
        try {
            const res = await fetch(`${API_BASE}/machines/${editingMachine.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editFormData)
            });
            if (res.ok) {
                setEditingMachine(null);
                fetchData();
            } else {
                throw new Error("Update failed");
            }
        } catch (e) {
            alert(e.message);
        }
    };

    if (loading && machines.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-black gap-4">
                <RefreshCw className="w-8 h-8 animate-spin" />
                <span className="font-mono text-xs uppercase tracking-widest font-black">Initializing Registry...</span>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 pt-6 px-4">
            {/* Header - Scaled Back & High Contrast */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-black pb-6">
                <div>
                    <h2 className="text-3xl font-black text-black uppercase tracking-tight flex items-center gap-3">
                        <Cpu className="w-8 h-8 text-umbrella-red" />
                        Machine Control
                    </h2>
                    <p className="font-mono text-[12px] text-black uppercase tracking-widest font-black mt-1">
                        Distributed IPv6 Hardware Network // 12 Secure Extraction Nodes
                    </p>
                </div>

                <div className="flex bg-slate-200 p-1 rounded-sm border border-black">
                    <button
                        onClick={() => setView('monitor')}
                        className={`px-6 py-2 text-[12px] font-black uppercase tracking-widest transition-all ${view === 'monitor' ? 'bg-black text-white' : 'text-black hover:bg-slate-300'}`}
                    >
                        Monitor
                    </button>
                    <button
                        onClick={() => setView('admin')}
                        className={`px-6 py-2 text-[12px] font-black uppercase tracking-widest transition-all ${view === 'admin' ? 'bg-black text-white' : 'text-black hover:bg-slate-300'}`}
                    >
                        Admin
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border-2 border-red-600 text-black p-4 rounded-sm flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="font-mono text-xs uppercase tracking-widest font-black">{error}</span>
                </div>
            )}

            {view === 'monitor' ? (
                /* Monitoring Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {machines.map((node) => {
                        const isOccupied = !!node.medication_name;
                        const isOnline = node.status === 'ONLINE';
                        const isActing = actionLoading === node.id;
                        const nodeReadData = meshReadResults[node.id] || { RFID: '', NFC: '' };

                        return (
                            <div key={node.id} className={`group bg-white border-2 rounded-sm p-5 space-y-4 transition-all hover:border-black ${isOnline ? (isOccupied ? 'border-emerald-600' : 'border-amber-600') : 'border-slate-400 opacity-90'}`}>
                                <div className="flex justify-between items-start">
                                    <div className="space-y-0.5">
                                        <span className="block text-[12px] font-mono font-black text-black uppercase tracking-widest">Node: {node.id.toString().padStart(2, '0')}</span>

                                        <h3 className="text-xl font-black text-black tracking-tight flex items-center gap-2">
                                            {node.location_label}
                                            {isOccupied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
                                        </h3>
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-sm border-2 ${isOnline ? 'border-emerald-600 bg-emerald-50 text-black' : 'border-slate-600 bg-slate-200 text-black'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-600 animate-pulse' : 'bg-slate-600'}`} />
                                        <span className="text-[12px] font-black uppercase tracking-tighter">{node.status}</span>
                                    </div>
                                </div>

                                {/* Occupancy Card */}
                                <div className={`rounded-sm p-4 border-2 space-y-1 relative overflow-hidden ${isOccupied ? 'bg-emerald-50 border-emerald-600' : 'bg-slate-50 border-slate-300 border-dashed'}`}>
                                    <div className="flex items-center gap-2 text-xs font-mono">
                                        <Package className={`w-4 h-4 ${isOccupied ? 'text-emerald-700' : 'text-slate-500'}`} />
                                        <span className={`uppercase font-black truncate text-black`}>
                                            {isOccupied ? node.medication_name : 'LOCATION EMPTY'}
                                        </span>
                                    </div>
                                    {isOccupied && (
                                        <div className="flex items-center gap-2 text-[12px] font-mono font-black text-black pt-1">
                                            <Database className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>STOCK: {node.stock} UNITS</span>
                                        </div>
                                    )}
                                </div>

                                {/* Hardware Commands Section */}
                                <div className="space-y-3">
                                    <label className="text-[12px] font-mono font-black text-black uppercase tracking-widest block border-b-2 border-black pb-1">Hardware Systems</label>

                                    <div className="space-y-2">
                                        {/* Identify (Manual LED Blink) */}
                                        <button
                                            disabled={!isOnline || (actionLoading && !isActing)}
                                            onClick={() => handleAction(node.id, 'identify')}
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 border-2 border-black text-black rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all disabled:opacity-50 disabled:bg-slate-400"
                                        >
                                            {isActing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                                            Identify Location
                                        </button>

                                        {/* RFID Read Row */}
                                        <div className="flex gap-1.5">
                                            <button
                                                disabled={!isOnline || (actionLoading && !isActing)}
                                                onClick={() => triggerRead(node, 'RFID')}
                                                className="px-3 py-2 bg-slate-200 border-2 border-black text-black font-black text-[9px] uppercase tracking-widest hover:bg-black hover:text-white flex items-center gap-2 min-w-[100px] disabled:opacity-50"
                                            >
                                                <Radio className="w-3.5 h-3.5" />
                                                Read RFID
                                            </button>
                                            <div className="flex-1 bg-white border-2 border-black rounded-sm px-2 flex items-center overflow-hidden">
                                                <span className="text-[12px] font-mono font-black text-black truncate">

                                                    {nodeReadData.RFID || "AWAITING..."}
                                                </span>
                                            </div>
                                        </div>

                                        {/* NFC Read Row */}
                                        <div className="flex gap-1.5">
                                            <button
                                                disabled={!isOnline || (actionLoading && !isActing)}
                                                onClick={() => triggerRead(node, 'NFC')}
                                                className="px-3 py-2 bg-slate-200 border-2 border-black text-black font-black text-[9px] uppercase tracking-widest hover:bg-black hover:text-white flex items-center gap-2 min-w-[100px] disabled:opacity-50"
                                            >
                                                <Fingerprint className="w-3.5 h-3.5" />
                                                Read NFC
                                            </button>
                                            <div className="flex-1 bg-white border-2 border-black rounded-sm px-2 flex items-center overflow-hidden">
                                                <span className="text-[12px] font-mono font-black text-black truncate">

                                                    {nodeReadData.NFC || "AWAITING..."}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tech Footer */}
                                <div className="flex flex-col gap-1 pt-3 border-t-2 border-black">
                                    <div className="flex justify-between items-center text-black font-black bg-slate-100 px-2 py-1 rounded-sm border border-black">
                                        <span className="text-[12px] tracking-widest uppercase">IP:</span>
                                        <span className="text-[12px] font-mono truncate max-w-[120px]">{node.ipv6_address || '---'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-black font-black bg-slate-100 px-2 py-1 rounded-sm border border-black">
                                        <span className="text-[12px] tracking-widest uppercase">SYNC:</span>
                                        <span className="text-[12px] font-mono">{node.last_heartbeat ? new Date(node.last_heartbeat).toLocaleTimeString() : 'OFFLINE'}</span>
                                    </div>
                                </div>

                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Admin List */
                <div className="bg-white border-2 border-black rounded-sm shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-black text-white">
                            <tr>
                                <th className="p-4 text-[12px] font-black uppercase tracking-widest text-white border-r border-white/20">ID</th>
                                <th className="p-4 text-[12px] font-black uppercase tracking-widest text-white border-r border-white/20">Location Label</th>
                                <th className="p-4 text-[12px] font-black uppercase tracking-widest text-center text-white border-r border-white/20">Hardware Writing Suite</th>
                                <th className="p-4 text-[12px] font-black uppercase tracking-widest text-right text-white">Settings</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-black font-mono text-xs">
                            {machines.map((node) => (
                                <tr key={node.id} className="hover:bg-slate-100 transition-colors">
                                    <td className="p-4 font-black text-black border-r border-slate-200">#{node.id.toString().padStart(2, '0')}</td>
                                    <td className="p-4 font-black uppercase text-black text-base border-r border-slate-200">{node.location_label}</td>
                                    <td className="p-4 border-r border-slate-200">
                                        <div className="flex gap-2 max-w-sm mx-auto">
                                            <button
                                                onClick={() => openWriteModal(node, 'RFID')}
                                                className="flex-1 px-4 py-2 bg-slate-200 border-2 border-black text-black font-black text-[9px] uppercase hover:bg-black hover:text-white flex items-center justify-center gap-2 rounded-sm"
                                            >
                                                <PenTool className="w-3.5 h-3.5" />
                                                Write RFID
                                            </button>
                                            <button
                                                onClick={() => openWriteModal(node, 'NFC')}
                                                className="flex-1 px-4 py-2 bg-slate-200 border-2 border-black text-black font-black text-[9px] uppercase hover:bg-black hover:text-white flex items-center justify-center gap-2 rounded-sm"
                                            >
                                                <PenTool className="w-3.5 h-3.5" />
                                                Write NFC
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleEditClick(node)}
                                            className="p-2 border-2 border-black text-black hover:bg-red-600 hover:text-white rounded-sm transition-all"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Hardware Encoding Modal (Write Only) */}
            {tagOpNode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-black">
                    <div className="bg-white border-4 border-black w-full max-w-lg rounded-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b-2 border-black flex items-center justify-between bg-slate-100">
                            <div>
                                <div className={`text-[10px] font-mono font-black uppercase tracking-widest text-black`}>Protocol: {tagType}</div>
                                <h3 className="text-lg font-black uppercase mt-0.5 text-black">Encode Tag: {tagOpNode.location_label}</h3>
                            </div>
                            <button onClick={() => setTagOpNode(null)} className="p-1 text-black hover:text-red-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="bg-red-100 border-l-4 border-red-600 p-3">
                                <p className="font-mono text-[10px] text-black uppercase font-black tracking-tight leading-tight">
                                    Warning: This will overwrite data on the physical sensor at location {tagOpNode.location_label}.
                                </p>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-mono font-black text-black uppercase tracking-widest block">ASCII Data Payload</label>
                                <textarea
                                    value={tagContent}
                                    onChange={(e) => setTagContent(e.target.value)}
                                    className="w-full bg-white border-2 border-black rounded-sm p-3 text-black font-mono text-sm font-black focus:bg-yellow-50 focus:outline-none min-h-[120px] uppercase"
                                    placeholder={`ENTER DATA FOR ${tagType} CHIP...`}
                                />
                                <button
                                    disabled={!tagContent || actionLoading}
                                    onClick={executeWrite}
                                    className={`w-full py-3 rounded-sm font-black text-white border-2 border-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all bg-red-600 hover:bg-red-700 active:scale-95 shadow-lg disabled:opacity-50`}
                                >
                                    {actionLoading ? <RefreshCw className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                    Commit to Physical Chip
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Hub Config Modal */}
            {editingMachine && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-black">
                    <div className="bg-white w-full max-w-lg rounded-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border-4 border-black text-black">
                        <div className="p-4 border-b-2 border-black flex items-center justify-between bg-slate-100">
                            <div>
                                <div className="text-[10px] font-mono font-black text-black uppercase tracking-widest">Management Hub</div>
                                <h3 className="text-lg font-black uppercase mt-0.5 text-black">Registry: Node #{editingMachine.id}</h3>
                            </div>
                            <button onClick={() => setEditingMachine(null)} className="p-1 text-black hover:text-red-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-4 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-mono font-black text-black uppercase tracking-widest block mb-1">Location Identifier</label>
                                    <input
                                        type="text"
                                        value={editFormData.location_label}
                                        onChange={(e) => setEditFormData({ ...editFormData, location_label: e.target.value })}
                                        className="w-full bg-white border-2 border-black rounded-sm py-2 px-3 text-black font-black uppercase tracking-widest text-xs focus:outline-none focus:bg-yellow-50"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-mono font-black text-black uppercase tracking-widest block mb-1">IPv6 Endpoint</label>
                                    <input
                                        type="text"
                                        value={editFormData.ipv6_address}
                                        onChange={(e) => setEditFormData({ ...editFormData, ipv6_address: e.target.value })}
                                        className="w-full bg-white border-2 border-black rounded-sm py-2 px-3 text-black font-mono text-xs focus:outline-none focus:bg-yellow-50"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-mono font-black text-black uppercase tracking-widest block mb-1">Inventory Binding</label>
                                    <select
                                        value={editFormData.assigned_medication_id}
                                        onChange={(e) => setEditFormData({ ...editFormData, assigned_medication_id: e.target.value })}
                                        className="w-full bg-white border-2 border-black rounded-sm py-2 px-3 text-black font-black uppercase tracking-widest text-xs focus:outline-none focus:bg-yellow-50"
                                    >
                                        <option value="">-- NO_BINDING --</option>
                                        {inventory.map(item => (
                                            <option key={item.id} value={item.id} className="text-black font-black">{item.name.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setEditingMachine(null)}
                                    className="flex-1 border-2 border-black text-black font-black py-2.5 rounded-sm uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all font-mono"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="flex-1 bg-red-600 text-white font-black py-2.5 rounded-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 uppercase tracking-widest text-[10px] border-2 border-black"
                                >
                                    <Save className="w-4 h-4" />
                                    Save Config
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MachineControl;
