import React, { useState, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Scan, CheckCircle2, Loader2, AlertCircle, PackageCheck, MonitorPlay } from 'lucide-react';
import { API_BASE } from '../apiConfig';

const Kiosk = () => {
    const [scanResult, setScanResult] = useState(null);
    const [status, setStatus] = useState('scanning'); // scanning, processing, success, error
    const [message, setMessage] = useState('Align QR Code within the frame to pick up your order.');
    const [dispensedOrder, setDispensedOrder] = useState(null);

    const handleScan = async (detectedCodes) => {
        if (detectedCodes && detectedCodes.length > 0 && status === 'scanning') {
            const data = detectedCodes[0];
            setStatus('processing');
            try {
                const text = data.rawValue;
                console.log("Scanned:", text);

                let orderId;
                try {
                    const parsed = JSON.parse(text);
                    orderId = parsed.orderId;
                } catch (e) {
                    orderId = text.trim();
                }

                if (!orderId) throw new Error("Invalid QR Code format");

                setMessage("Order found! Initiating retrieval...");

                const val = await dispenseOrder(orderId);
                if (val.success) {
                    setStatus('success');
                    setDispensedOrder(val.order);
                    setMessage("Order dispensed! Please collect your items below.");

                    setTimeout(() => {
                        resetKiosk();
                    }, 10000);
                } else {
                    throw new Error(val.error || "Dispensation failed");
                }

            } catch (err) {
                console.error(err);
                setStatus('error');
                setMessage(err.message || "Failed to process QR code. Please try again.");
                setTimeout(() => {
                    setStatus('scanning');
                    setMessage('Align QR Code within the frame to pick up your order.');
                }, 3000);
            }
        }
    };

    const handleError = (err) => {
        console.error(err);
    };

    const dispenseOrder = async (orderId) => {
        const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
        try {
            const res = await fetch(`${API_BASE}/robot/dispense`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': currentUser.id,
                    'x-user-name': currentUser.name
                },
                body: JSON.stringify({ orderId })
            });
            return await res.json();
        } catch (e) {
            return { error: "Network Error" };
        }
    };

    const resetKiosk = () => {
        setScanResult(null);
        setStatus('scanning');
        setMessage('Align QR Code within the frame to pick up your order.');
        setDispensedOrder(null);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] animate-in fade-in duration-700">
            <div className="mb-8 text-center space-y-2">
                <h1 className="text-4xl font-black uppercase tracking-tighter text-black flex items-center justify-center gap-3">
                    <MonitorPlay className="w-10 h-10 text-umbrella-red" />
                    Autonomous Pickup
                </h1>
                <p className="text-sm font-mono font-bold text-umbrella-red uppercase tracking-widest">
                    Point of Dispensation // Terminal K-01
                </p>
            </div>

            <div className="relative group">
                {/* Scanner Frame */}
                <div className={`
                    w-[340px] h-[340px] bg-white rounded-2xl border-[4px] flex items-center justify-center overflow-hidden relative shadow-2xl
                    ${status === 'scanning' ? 'border-black' : ''}
                    ${status === 'processing' ? 'border-blue-600' : ''}
                    ${status === 'success' ? 'border-emerald-600' : ''}
                    ${status === 'error' ? 'border-red-600' : ''}
                    transition-colors duration-300
                `}>
                    {status === 'scanning' && (
                        <>
                            <div className="w-full h-full relative">
                                <Scanner
                                    onScan={handleScan}
                                    onError={handleError}
                                    styles={{
                                        container: { width: '100%', height: '100%' },
                                        video: { width: '100%', height: '100%', objectFit: 'cover' }
                                    }}
                                    allowMultiple={true}
                                    scanDelay={300}
                                />
                            </div>

                            {/* Overlay Guidelines */}
                            <div className="absolute inset-0 border-2 border-black/10 m-8 rounded-lg pointer-events-none">
                                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-umbrella-red -mt-1 -ml-1"></div>
                                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-umbrella-red -mt-1 -mr-1"></div>
                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-umbrella-red -mb-1 -ml-1"></div>
                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-umbrella-red -mb-1 -mr-1"></div>
                            </div>
                            <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                                <span className="bg-black text-white text-[10px] font-mono uppercase px-2 py-1 rounded-sm shadow-lg">
                                    Scanner Active
                                </span>
                            </div>
                        </>
                    )}

                    {status === 'processing' && (
                        <div className="flex flex-col items-center justify-center gap-4 text-blue-600">
                            <Loader2 className="w-16 h-16 animate-spin" />
                            <span className="text-xs font-black uppercase tracking-widest">Verifying Identity...</span>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center justify-center gap-4 text-emerald-600 animate-in zoom-in duration-300">
                            <PackageCheck className="w-20 h-20" />
                            <div className="text-center">
                                <span className="block text-xl font-black uppercase tracking-tight">Dispensed</span>
                                <span className="text-[10px] font-mono text-emerald-600 uppercase"> Tray opened</span>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col items-center justify-center gap-4 text-red-600 animate-in shake">
                            <AlertCircle className="w-16 h-16" />
                            <span className="text-xs font-black uppercase tracking-widest text-black">Scan Failed</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Status Message */}
            <div className={`mt-8 p-6 rounded-sm max-w-md w-full text-center border-2 transition-all duration-300
                ${status === 'scanning' ? 'bg-white border-black shadow-lg' : ''}
                ${status === 'processing' ? 'bg-blue-50 border-blue-600 shadow-md' : ''}
                ${status === 'success' ? 'bg-emerald-50 border-emerald-600 shadow-lg' : ''}
                ${status === 'error' ? 'bg-red-50 border-red-600 shadow-md' : ''}
            `}>
                <p className={`text-sm font-black uppercase tracking-wide text-black`}>
                    {message}
                </p>
                {dispensedOrder && (
                    <div className="mt-4 pt-4 border-t border-emerald-200 text-black">
                        <div className="text-[10px] font-mono uppercase mb-1">Retrieving Order for:</div>
                        <div className="text-lg font-black">{dispensedOrder.patientName}</div>
                        <div className="text-[10px] font-mono uppercase mt-1">Order #{dispensedOrder.id}</div>
                    </div>
                )}
            </div>

            {status === 'success' && (
                <button
                    onClick={resetKiosk}
                    className="mt-6 text-[10px] font-mono font-bold text-black uppercase tracking-widest hover:text-umbrella-red underline decoration-dotted underline-offset-4"
                >
                    Scan Another Order
                </button>
            )}
        </div>
    );
};

export default Kiosk;
