import React, { useState } from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { API_BASE } from '../apiConfig';

const Login = ({ onLogin }) => {
    const [accessCode, setAccessCode] = useState('');
    const [error, setError] = useState('');

    const loginUser = async (code) => {
        try {
            const response = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessCode: code })
            });

            const data = await response.json();

            if (response.ok) {
                sessionStorage.setItem('accessGranted', 'true');
                sessionStorage.setItem('user', JSON.stringify(data.user));
                if (data.token) sessionStorage.setItem('token', data.token);
                onLogin();
            } else {
                setError(data.error || 'Invalid access code');
                setAccessCode('');
            }
        } catch (err) {
            console.error("Login failed", err);
            setError(`Network Error: ${err.message}. Ensure Render backend is LIVE and your browser isn't blocking the connection.`);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        loginUser(accessCode);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="relative z-10 w-full max-w-md bg-white p-8 rounded-sm shadow-2xl border-2 border-slate-200">
                <div className="text-center mb-8">
                    <ShieldCheck className="w-12 h-12 text-umbrella-red mx-auto mb-4" />
                    <h1 className="text-2xl font-black uppercase tracking-widest text-black">Safe Mode Access</h1>
                    <p className="text-xs font-mono font-bold text-slate-400 uppercase mt-2">PIN Entry Only</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-800 text-xs font-bold border-2 border-red-600 rounded-sm flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <input
                            type="password"
                            value={accessCode}
                            onChange={(e) => setAccessCode(e.target.value)}
                            className="w-full text-center text-2xl font-mono font-black tracking-[0.3em] text-black bg-slate-50 border-2 border-slate-200 py-4 px-4 rounded-sm focus:outline-none focus:border-red-600 transition-colors"
                            placeholder="••••••••"
                            autoFocus
                            maxLength={8}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-umbrella-red hover:bg-red-700 text-white font-black uppercase tracking-widest py-4 rounded-sm transition-all active:scale-95 shadow-lg text-sm border-2 border-black"
                    >
                        Initialize Session
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
