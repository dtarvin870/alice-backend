import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Upload, Check, AlertCircle, Trash2, ArrowLeft, Barcode, MapPin, Tablet, Edit3, Plus, Search, Loader2 } from 'lucide-react';

const InventoryManager = () => {
    const navigate = useNavigate();
    const [inventory, setInventory] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [isAdding, setIsAdding] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        dosage: '',
        stock: 0,
        location_code: '',
        upc: '',
        photo_url: ''
    });

    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchInventory = async () => {
        setFetching(true);
        try {
            const resp = await fetch('http://localhost:5000/api/inventory');
            const data = await resp.json();
            setInventory(data);
        } catch (err) {
            console.error("Failed to fetch inventory:", err);
            setError("Failed to synchronize inventory data.");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const handleEdit = (item) => {
        setFormData({
            name: item.name,
            dosage: item.dosage || '',
            stock: item.stock,
            location_code: item.location_code,
            upc: item.upc || '',
            photo_url: item.photo_url || ''
        });
        setPreview(item.photo_url || null);
        setEditId(item.id);
        setIsEditing(true);
        setIsAdding(true);
        setError(null);
        setSuccess(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("CRITICAL: Are you sure you want to decommission this asset? This action is irreversible.")) return;

        try {
            const resp = await fetch(`http://localhost:5000/api/inventory/${id}`, {
                method: 'DELETE'
            });

            if (!resp.ok) throw new Error("Decommissioning failed");

            setInventory(inventory.filter(item => item.id !== id));
            setSuccess("Asset successfully decommissioned.");
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            let final_photo_url = formData.photo_url;

            // 1. Upload photo if a NEW one is selected
            if (file) {
                const uploadData = new FormData();
                uploadData.append('photo', file);

                const uploadResp = await fetch('http://localhost:5000/api/upload', {
                    method: 'POST',
                    body: uploadData
                });

                if (!uploadResp.ok) throw new Error("Photo upload failed");
                const uploadResult = await uploadResp.json();
                final_photo_url = uploadResult.photoUrl;
            }

            // 2. Create or Update inventory item
            const url = isEditing
                ? `http://localhost:5000/api/inventory/${editId}`
                : 'http://localhost:5000/api/inventory';

            const method = isEditing ? 'PUT' : 'POST';

            const resp = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, photo_url: final_photo_url })
            });

            if (!resp.ok) {
                const data = await resp.json();
                throw new Error(data.error || "Failed to update inventory");
            }

            setSuccess(isEditing ? "Asset updated successfully." : "Asset secured successfully.");

            // State cleanup
            setFormData({ name: '', dosage: '', stock: 0, location_code: '', upc: '', photo_url: '' });
            setFile(null);
            setPreview(null);
            setIsAdding(false);
            setIsEditing(false);
            setEditId(null);

            // Refresh list
            fetchInventory();

            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredInventory = inventory.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.upi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => isAdding ? setIsAdding(false) : navigate('/')}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors border border-transparent hover:border-slate-200"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-3xl font-black text-umbrella-black uppercase tracking-tighter">Inventory Control Hub</h2>
                        <p className="font-mono text-[12px] text-slate-400 uppercase tracking-widest font-bold">Secure Asset Management & Logistics</p>
                    </div>
                </div>

                {!isAdding && (
                    <button
                        onClick={() => {
                            setIsAdding(true);
                            setIsEditing(false);
                            setFormData({ name: '', dosage: '', stock: 0, location_code: '', upc: '', photo_url: '' });
                            setPreview(null);
                            setFile(null);
                        }}
                        className="bg-umbrella-red hover:bg-red-700 text-white font-black py-3 px-6 rounded-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 uppercase tracking-widest text-xs"
                    >
                        <Plus className="w-4 h-4" />
                        Acquire New Asset
                    </button>
                )}
            </div>

            {success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <Check className="w-5 h-5" />
                    <span className="font-mono text-xs uppercase tracking-widest font-black">{success}</span>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-umbrella-red p-4 rounded-sm flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-mono text-xs uppercase tracking-widest font-black">{error}</span>
                </div>
            )}

            {isAdding ? (
                /* Add/Edit Form */
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
                    {/* Left Side: Detail Entry */}
                    <div className="space-y-6">
                        <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm space-y-4">
                            <label className="block text-xs font-mono text-slate-400 uppercase tracking-[0.2em] font-bold">
                                {isEditing ? 'Asset Modification' : 'Asset Identification'}
                            </label>

                            <div className="space-y-4">
                                <div className="relative">
                                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="PRODUCT NAME"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-sm py-3 pl-11 pr-4 text-umbrella-black focus:outline-none focus:ring-1 focus:ring-umbrella-red transition-all font-mono uppercase tracking-widest text-xs"
                                        required
                                    />
                                </div>

                                <div className="relative">
                                    <Tablet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input
                                        type="text"
                                        name="dosage"
                                        value={formData.dosage}
                                        onChange={handleChange}
                                        placeholder="DOSAGE (E.G. 500MG)"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-sm py-3 pl-11 pr-4 text-umbrella-black focus:outline-none focus:ring-1 focus:ring-umbrella-red transition-all font-mono uppercase tracking-widest text-xs"
                                    />
                                </div>

                                <div className="relative">
                                    <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input
                                        type="text"
                                        name="upc"
                                        value={formData.upc}
                                        onChange={handleChange}
                                        placeholder="UPC / BARCODE"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-sm py-3 pl-11 pr-4 text-umbrella-black focus:outline-none focus:ring-1 focus:ring-umbrella-red transition-all font-mono uppercase tracking-widest text-xs"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm space-y-4">
                            <label className="block text-xs font-mono text-slate-400 uppercase tracking-[0.2em] font-bold">Storage Logistics</label>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input
                                        type="text"
                                        name="location_code"
                                        value={formData.location_code}
                                        onChange={handleChange}
                                        placeholder="LOCATION"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-sm py-3 pl-11 pr-4 text-umbrella-black focus:outline-none focus:ring-1 focus:ring-umbrella-red transition-all font-mono uppercase tracking-widest text-xs"
                                        required
                                    />
                                </div>

                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-mono font-bold text-slate-300">QTY</div>
                                    <input
                                        type="number"
                                        name="stock"
                                        value={formData.stock}
                                        onChange={handleChange}
                                        placeholder="STOCK"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-sm py-3 pl-11 pr-4 text-umbrella-black focus:outline-none focus:ring-1 focus:ring-umbrella-red transition-all font-mono uppercase tracking-widest text-xs"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Visual Data Attachment */}
                    <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
                        <label className="absolute top-6 left-6 text-xs font-mono text-slate-400 uppercase tracking-[0.2em] font-bold">Visual Documentation</label>

                        {preview ? (
                            <div className="relative w-full aspect-square max-w-[300px] border-2 border-dashed border-umbrella-red/20 rounded-sm overflow-hidden group">
                                <img src={preview} alt="Asset Preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => { setFile(null); setPreview(null); setFormData(prev => ({ ...prev, photo_url: '' })); }}
                                    className="absolute inset-0 bg-umbrella-red/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white"
                                >
                                    <Trash2 className="w-8 h-8 mb-2" />
                                    <span className="font-mono text-[12px] uppercase font-black tracking-widest">Discard Frame</span>
                                </button>
                            </div>
                        ) : (
                            <label className="w-full aspect-square max-w-[300px] border-2 border-dashed border-slate-200 rounded-sm flex flex-col items-center justify-center cursor-pointer hover:border-umbrella-red/30 hover:bg-umbrella-red/5 transition-all group">
                                <Upload className="w-12 h-12 text-slate-200 group-hover:text-umbrella-red transition-colors mb-4" />
                                <span className="font-mono text-[12px] text-slate-400 uppercase font-black tracking-widest">Attach Digital Image</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                        )}

                        <div className="w-full pt-4 flex gap-4">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="flex-1 border border-slate-200 text-slate-500 font-black py-4 rounded-sm uppercase tracking-widest text-xs hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !formData.name || !formData.upc || !formData.location_code}
                                className="flex-[2] bg-umbrella-red hover:bg-red-700 disabled:opacity-30 disabled:grayscale text-white font-black py-4 rounded-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-red-900/40 uppercase tracking-widest text-xs"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        {isEditing ? 'COMMIT UPDATES' : 'REGISTER ASSET'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            ) : (
                /* Asset List */
                <div className="space-y-6">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        <input
                            type="text"
                            placeholder="SEARCH BY NAME, UPI, OR LOCATION..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-sm py-4 pl-12 pr-4 text-umbrella-black focus:outline-none focus:ring-1 focus:ring-umbrella-red transition-all font-mono uppercase tracking-widest text-xs shadow-sm"
                        />
                    </div>

                    {fetching ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <span className="font-mono text-[12px] uppercase font-black tracking-widest">Synchronizing Encrypted Data...</span>
                        </div>
                    ) : filteredInventory.length === 0 ? (
                        <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-sm">
                            <Package className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                            <p className="text-slate-400 font-mono text-xs uppercase tracking-widest font-black">No matching assets found in secure storage.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredInventory.map(item => (
                                <div key={item.id} className="group bg-white border border-slate-200 p-4 rounded-sm flex gap-4 hover:border-umbrella-red/50 hover:shadow-md transition-all">
                                    <div className="w-20 h-20 bg-slate-100 rounded-sm overflow-hidden flex-shrink-0 border border-slate-100 p-1">
                                        {item.photo_url ? (
                                            <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <Package className="w-6 h-6 opacity-20" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-black text-umbrella-black uppercase text-sm truncate">{item.name}</h4>
                                                <p className="text-[12px] font-mono text-slate-400 font-bold uppercase">{item.dosage || 'No Dosage Data'}</p>
                                            </div>
                                            <div className={`text-[12px] font-mono px-2 py-0.5 rounded-sm font-black ${item.stock > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-umbrella-red'}`}>
                                                STK: {item.stock}
                                            </div>
                                        </div>

                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <div className="text-[12px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-sm font-bold uppercase">
                                                LOC: {item.location_code}
                                            </div>
                                            {item.upi && (
                                                <div className="text-[12px] font-mono bg-umbrella-red/5 text-umbrella-red px-1.5 py-0.5 rounded-sm font-black uppercase tracking-tighter border border-umbrella-red/10">
                                                    UPI: {item.upi}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-3 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-blue-500 rounded-sm transition-colors border border-transparent hover:border-slate-200"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-umbrella-red rounded-sm transition-colors border border-transparent hover:border-slate-200"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default InventoryManager;
