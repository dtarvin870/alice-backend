import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Trash2, Shield, Activity, Users, FileText, Edit, X, RefreshCw } from 'lucide-react';

import { API_BASE } from '../apiConfig';

const UserManagement = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('users'); // 'users' or 'logs'
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);

    // Form State
    const [newUser, setNewUser] = useState({ name: '', accessCode: '', role: 'staff' });
    const [editingId, setEditingId] = useState(null);

    const [error, setError] = useState(null);
    const [rawError, setRawError] = useState(null); // For debugging
    const [success, setSuccess] = useState(null);

    const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

    // Fetch Data
    const fetchData = async () => {
        // 1. Fetch Users
        try {
            const usersRes = await fetch(`${API_BASE}/users`);
            const usersText = await usersRes.text();

            if (usersRes.ok) {
                if (usersText.trim().startsWith('<')) {
                    throw new Error(`CRITICAL: Backend returned HTML instead of JSON. Check Port 5000.`);
                }
                try {
                    setUsers(JSON.parse(usersText));
                } catch (e) {
                    setRawError(usersText.substring(0, 200));
                    throw new Error(`JSON Parse Error: ${e.message}`);
                }
            } else {
                if (usersRes.status === 404) {
                    throw new Error("API Route Missing (404). PLEASE RESTART THE BACKEND SERVER.");
                }
                throw new Error(`API Error: ${usersRes.status} ${usersRes.statusText}`);
            }

            // Clear error if users specific fetch succeeded
            setError(null);
        } catch (err) {
            console.error("Users fetch failed:", err);
            setError(err.message);
        }

        // 2. Fetch Logs (Non-critical)
        try {
            const logsRes = await fetch(`${API_BASE}/logs`);
            if (logsRes.ok) {
                const logsText = await logsRes.text();
                try {
                    const parsedLogs = JSON.parse(logsText);
                    if (Array.isArray(parsedLogs)) setLogs(parsedLogs);
                } catch (e) {
                    console.warn("Logs parse error", e);
                }
            }
        } catch (e) {
            console.warn("Logs fetch failed (likely blocked or offline)", e);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleSaveUser = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        const isEditing = !!editingId;
        const url = isEditing
            ? `${API_BASE}/users/${editingId}`
            : `${API_BASE}/users`;

        const method = isEditing ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });

            const text = await res.text();

            if (text.trim().startsWith('<')) {
                throw new Error("Server returned HTML. Check backend URL.");
            }

            // Consider 404 on POST/PUT
            if (res.status === 404) {
                throw new Error("API Endpoint Not Found separate from GET. Restart Server.");
            }

            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error("Invalid Server Response");
            }

            if (res.ok) {
                setSuccess(isEditing ? "User updated successfully" : "User added successfully");
                setNewUser({ name: '', accessCode: '', role: 'staff' });
                setEditingId(null);
                fetchData();
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(data.error || "Operation failed");
            }
        } catch (err) {
            setError(`Request Failed: ${err.message}`);
        }
    };

    const handleEditClick = (user) => {
        setNewUser({
            name: user.name,
            accessCode: user.access_code,
            role: user.role
        });
        setEditingId(user.id);
        setError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setNewUser({ name: '', accessCode: '', role: 'staff' });
        setEditingId(null);
        setError(null);
    };

    const handleDeleteUser = async (id) => {
        if (!confirm("Are you sure you want to revoke this user's access?")) return;
        try {
            const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchData();
                setSuccess("User access revoked");
                setTimeout(() => setSuccess(null), 3000);
                if (editingId === id) handleCancelEdit();
            } else {
                setError("Failed to delete user");
            }
        } catch (err) {
            setError(err.message);
        }
    };

    // Button Style - Force Visibility
    const buttonStyle = {
        backgroundColor: '#dc2626', // Red
        color: 'white', // White text
        fontWeight: 'bold',
        textTransform: 'uppercase',
        border: '2px solid black',
        display: 'block',
        visibility: 'visible',
        opacity: 1
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="max-w-6xl mx-auto p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3 text-slate-900 icon-slate-900">
                            <Shield className="w-8 h-8 text-umbrella-red" />
                            Access Control & Audit
                        </h1>
                    </div>

                    <div className="flex bg-slate-800 p-1 rounded-sm">
                        <button onClick={() => setView('users')} className={`px-6 py-2 rounded-sm text-xs font-black uppercase tracking-widest ${view === 'users' ? 'bg-umbrella-red text-white' : 'text-slate-400'}`}>
                            Personnel
                        </button>
                        <button onClick={() => setView('logs')} className={`px-6 py-2 rounded-sm text-xs font-black uppercase tracking-widest ${view === 'logs' ? 'bg-umbrella-red text-white' : 'text-slate-400'}`}>
                            Logs
                        </button>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 bg-red-100 border-l-4 border-red-600 text-red-800 p-4 rounded-sm shadow-sm font-bold flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                        {rawError && (
                            <div className="mt-2 text-[12px] font-mono bg-red-50 p-2 border border-red-200 overflow-auto max-h-32">
                                <strong>Server Response Preview:</strong><br />
                                {rawError}
                            </div>
                        )}
                        <button onClick={fetchData} className="text-xs underline self-start flex items-center gap-1 mt-1">
                            <RefreshCw className="w-3 h-3" /> Retry Connection
                        </button>
                    </div>
                )}

                {success && (
                    <div className="mb-6 bg-green-100 border-l-4 border-green-500 text-green-800 p-4 font-bold">
                        {success}
                    </div>
                )}

                {view === 'users' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Form */}
                        <div className="lg:col-span-1">
                            <div className={`p-6 bg-white rounded-sm shadow-md border-2 ${editingId ? 'border-blue-500' : 'border-slate-200'} sticky top-8`}>
                                <h3 className="font-black uppercase tracking-wider mb-6 flex items-center justify-between pb-4 border-b border-slate-100">
                                    <span className="flex items-center gap-2">
                                        {editingId ? <Edit className="w-5 h-5 text-blue-600" /> : <UserPlus className="w-5 h-5 text-umbrella-red" />}
                                        {editingId ? 'Edit Personnel' : 'Grant Access'}
                                    </span>
                                    {editingId && <button onClick={handleCancelEdit}><X className="w-5 h-5 text-slate-400" /></button>}
                                </h3>

                                <form onSubmit={handleSaveUser} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">Name</label>
                                        <input type="text" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} className="w-full border-2 border-slate-300 p-3 font-bold text-sm focus:border-red-500 outline-none" placeholder="Ex: William Birkin" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">Access Code</label>
                                        <input type="text" value={newUser.accessCode} onChange={e => setNewUser({ ...newUser, accessCode: e.target.value })} className="w-full border-2 border-slate-300 p-3 font-mono font-bold text-sm focus:border-red-500 outline-none" placeholder="Code" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">Role</label>
                                        <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="w-full border-2 border-slate-300 p-3 font-bold uppercase text-sm focus:border-red-500 outline-none">
                                            <option value="staff">Staff</option>
                                            <option value="admin">Admin</option>
                                            <option value="pharmacist">Pharmacist</option>
                                        </select>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            style={buttonStyle} // FORCE STYLES
                                            className="w-full py-4 text-center rounded-sm hover:opacity-90 active:scale-95 transition-all shadow-xl"
                                        >
                                            {editingId ? 'UPDATE USER' : 'AUTHORIZE USER'}
                                        </button>
                                        {editingId && (
                                            <button type="button" onClick={handleCancelEdit} className="w-full mt-2 text-xs text-slate-500 uppercase font-bold hover:text-red-500">Cancel Edit</button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* List */}
                        <div className="lg:col-span-2 space-y-4">
                            {users.map(user => (
                                <div key={user.id} className={`bg-white p-4 border-l-4 shadow-sm flex items-center justify-between ${editingId === user.id ? 'border-l-blue-500 bg-blue-50' : 'border-l-umbrella-red'}`}>
                                    <div>
                                        <div className="font-extrabold text-slate-900 uppercase text-lg">{user.name}</div>
                                        <div className="text-xs font-mono text-slate-500 uppercase font-bold">
                                            Role: {user.role} | ID: {editingId === user.id ? user.access_code : '********'}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditClick(user)} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold uppercase rounded hover:bg-blue-100 hover:text-blue-600">Edit</button>
                                        {user.access_code !== '12345678' && (
                                            <button onClick={() => handleDeleteUser(user.id)} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold uppercase rounded hover:bg-red-100 hover:text-red-600">Revoke</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    // Logs
                    <div className="bg-white border text-sm">
                        {logs.map(log => (
                            <div key={log.id} className="p-2 border-b flex gap-4">
                                <span className="font-mono text-xs text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                <span className="font-bold">{log.user_name}</span>
                                <span className="text-slate-600">{log.action}: {log.details}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
