import React, { useState } from 'react';
import { Play, Pause, AlertTriangle, CheckCircle, RefreshCcw } from 'lucide-react';
import { API_BASE } from '../apiConfig';

const SystemControl = ({ currentStatus, onStatusChange }) => {
    const [loading, setLoading] = useState(false);

    const setMode = async (mode) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/robot/mode`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode })
            });
            if (res.ok) {
                if (onStatusChange) onStatusChange();
            }
        } catch (e) {
            console.error("Failed to set system mode:", e);
        } finally {
            setLoading(false);
        }
    };

    const modes = [
        { id: 'OPERATIONAL', label: 'READY', icon: CheckCircle, color: 'hover:bg-emerald-600 hover:text-white border-emerald-200 text-emerald-600 bg-emerald-50', activeColor: 'bg-emerald-600 text-white border-emerald-600' },
        { id: 'RUNNING', label: 'RUNNING', icon: Play, color: 'hover:bg-blue-600 hover:text-white border-blue-200 text-blue-600 bg-blue-50', activeColor: 'bg-blue-600 text-white border-blue-600' },
        { id: 'PAUSED', label: 'PAUSED', icon: Pause, color: 'hover:bg-amber-600 hover:text-white border-amber-200 text-amber-600 bg-amber-50', activeColor: 'bg-amber-600 text-white border-amber-600' },
        { id: 'FAULT', label: 'FAULTED', icon: AlertTriangle, color: 'hover:bg-red-600 hover:text-white border-red-200 text-red-600 bg-red-50', activeColor: 'bg-red-600 text-white border-red-600' },
    ];

    return (
        <div className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-umbrella-red animate-pulse"></div>
                    <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-[0.2em]">A.L.I.C.E. Mode Control</span>
                </div>
                {loading && <RefreshCcw className="w-4 h-4 text-slate-400 animate-spin" />}
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
                {modes.map((mode) => {
                    const isActive = currentStatus === mode.id || (mode.id === 'OPERATIONAL' && currentStatus === 'READY');
                    const Icon = mode.icon;
                    return (
                        <button
                            key={mode.id}
                            disabled={loading}
                            onClick={() => setMode(mode.id)}
                            className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-sm transition-all duration-200 group active:scale-95 disabled:opacity-50 ${isActive ? mode.activeColor : mode.color
                                }`}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''} group-hover:text-white transition-colors`} />
                            <span className="text-[11px] font-black uppercase tracking-widest leading-none">{mode.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default SystemControl;
