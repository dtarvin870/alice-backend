import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Search, Plus, Minus, Trash2, CheckCircle2, User, Package, ShieldCheck, ShoppingCart, LayoutDashboard, Database } from 'lucide-react';
import InventoryManager from './pages/InventoryManager';

const ProcurementCatalog = () => {
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [patientName, setPatientName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderStatus, setOrderStatus] = useState(null); // null, 'submitting', 'success'

  useEffect(() => {
    fetch('http://localhost:5000/api/inventory')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setInventory(data);
        } else {
          console.warn("Inventory data is not an array:", data);
          setInventory([]);
        }
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setInventory([]);
      });
  }, []);

  const addToCart = (med) => {
    const existing = cart.find(item => item.id === med.id);
    if (existing) {
      setCart(cart.map(item =>
        item.id === med.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...med, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!patientName || cart.length === 0) return;

    setOrderStatus('submitting');
    try {
      const resp = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName,
          medications: cart.map(m => ({ id: m.id, quantity: m.quantity }))
        })
      });

      if (resp.ok) {
        setOrderStatus('success');
        setCart([]);
        setPatientName('');
        setTimeout(() => setOrderStatus(null), 5000);
      } else {
        alert("Order failed. Access Denied.");
        setOrderStatus(null);
      }
    } catch (err) {
      console.error(err);
      setOrderStatus(null);
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full animate-in fade-in duration-500">
      {/* Catalog */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3 text-umbrella-black">
            <Package className="w-6 h-6 text-umbrella-red" />
            Asset Catalog
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="SEARCH ASSETS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-slate-200 rounded-sm py-2 pl-9 pr-4 text-[10px] font-mono tracking-widest focus:outline-none focus:ring-1 focus:ring-umbrella-red transition-all w-[150px] sm:w-[250px] shadow-sm"
              />
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest bg-white border border-slate-200 px-3 py-1 rounded-sm shadow-sm">
              Total Assets: {filteredInventory.length}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredInventory.map(item => (
            <div key={item.id} className="bg-white border border-slate-200 p-5 rounded-sm shadow-sm hover:border-umbrella-red transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-16 h-16 bg-slate-50 rounded-sm border border-slate-100 overflow-hidden flex items-center justify-center p-1">
                  {item.photo_url ? (
                    <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover rounded-sm" />
                  ) : (
                    <Package className="w-8 h-8 text-slate-200 group-hover:text-umbrella-red transition-colors" />
                  )}
                </div>
                <div className="text-[8px] font-mono font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-sm">
                  ID: #{item.id.toString().padStart(4, '0')}
                </div>
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight mb-1 text-umbrella-black">{item.name}</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">{item.dosage}</p>

              {item.upi && (
                <div className="text-[8px] font-mono bg-umbrella-red/5 text-umbrella-red px-2 py-0.5 rounded-sm font-black uppercase tracking-tighter border border-umbrella-red/10 w-fit mb-4">
                  UPI: {item.upi}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="text-[10px] font-mono text-slate-400">
                  STOCK: <span className={item.stock < 10 ? 'text-umbrella-red font-black' : 'text-umbrella-black font-black'}>{item.stock} UNITS</span>
                </div>
                <button
                  onClick={() => addToCart(item)}
                  className="bg-umbrella-red hover:bg-red-700 text-white p-2 rounded-sm transition-all shadow-md active:scale-90"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Requisition Panel */}
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 p-8 rounded-sm shadow-lg sticky top-28">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
            <ShoppingBag className="w-6 h-6 text-umbrella-red" />
            <h3 className="text-xl font-black uppercase tracking-tighter text-umbrella-black">Manifest Requisition</h3>
          </div>

          <form onSubmit={handleSubmitOrder} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Authorization Personnel/Subject</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="IDENTIFY SUBJECT..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-sm py-3 pl-10 pr-4 text-xs font-mono tracking-widest uppercase focus:outline-none focus:ring-1 focus:ring-umbrella-red transition-all text-umbrella-black"
                />
              </div>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-slate-100 rounded-sm flex flex-col items-center justify-center text-slate-300">
                  <ShoppingCart className="w-12 h-12 mb-2 opacity-10" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest italic">Manifest Empty</span>
                </div>
              ) : cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-sm border border-slate-100 animate-in slide-in-from-right">
                  <div className="flex-grow">
                    <div className="text-[11px] font-black uppercase tracking-tight leading-none mb-1 text-umbrella-black">{item.name}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">UNIT: {item.dosage}</div>
                  </div>
                  <div className="flex items-center gap-2 text-umbrella-black">
                    <button type="button" onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-umbrella-red transition-colors">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-[10px] font-mono font-black w-4 text-center">{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-umbrella-red transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                    <button type="button" onClick={() => removeFromCart(item.id)} className="p-1 ml-1 text-slate-300 hover:text-umbrella-red transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-4">
              <div className="flex justify-between items-center text-[10px] font-mono font-black uppercase tracking-widest text-slate-400">
                <span>Total Items</span>
                <span className="text-umbrella-black">{cartTotalItems} UNITS</span>
              </div>

              {orderStatus === 'success' ? (
                <div className="bg-red-50 text-umbrella-red p-4 rounded-sm border border-umbrella-red/20 flex items-center gap-3 animate-in fade-in zoom-in">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Requisition Authorized</span>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={cart.length === 0 || !patientName || orderStatus === 'submitting'}
                  className="w-full bg-umbrella-red hover:bg-red-700 disabled:opacity-30 disabled:grayscale text-white font-black py-4 rounded-sm transition-all shadow-xl active:scale-95 uppercase tracking-widest text-xs flex items-center justify-center gap-2 group"
                >
                  <ShieldCheck className="w-4 h-4 group-hover:animate-pulse" />
                  {orderStatus === 'submitting' ? 'AUTHORIZING...' : 'AUTHORIZE REQUISITION'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const Navigation = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-xl sticky top-0 z-50 shadow-sm min-h-20 flex items-center">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between w-full flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <img src="/umbrella-logo.png" alt="Umbrella Corp" className="h-10 sm:h-12 object-contain" />
        </div>



        <nav className="flex items-center gap-2 bg-slate-100 p-1 rounded-sm border border-slate-200">
          <Link
            to="/"
            className={`flex items-center gap-2 px-4 py-2 rounded-sm text-[0.6rem] font-black uppercase tracking-widest transition-all ${isActive('/')
              ? 'bg-umbrella-red text-white shadow-md shadow-red-900/20'
              : 'text-slate-500 hover:text-umbrella-red hover:bg-white'
              }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Requisition
          </Link>
          <Link
            to="/inventory"
            className={`flex items-center gap-2 px-4 py-2 rounded-sm text-[0.6rem] font-black uppercase tracking-widest transition-all ${isActive('/inventory')
              ? 'bg-umbrella-red text-white shadow-md shadow-red-900/20'
              : 'text-slate-500 hover:text-umbrella-red hover:bg-white'
              }`}
          >
            <Database className="w-4 h-4" />
            Inventory Hub
          </Link>
        </nav>

      </div>
    </header>
  );
};

const ProcurementPortal = () => {
  return (
    <Router>
      <div className="min-h-screen bg-umbrella-white text-black font-sans relative overflow-x-hidden selection:bg-umbrella-red/20">
        {/* Background Logo Overlay */}
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="w-full h-full umbrella-bg opacity-[0.05]"></div>
        </div>

        <div className="relative z-10 min-h-screen flex flex-col">
          <Navigation />

          <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
            <Routes>
              <Route path="/" element={<ProcurementCatalog />} />
              <Route path="/inventory" element={<InventoryManager />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="mt-auto border-t border-slate-200 bg-white p-6">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-[0.6rem] font-mono font-black text-slate-400 uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-umbrella-red"></div>
                PROPERTY OF UMBRELLA CORPORATION logistics
              </div>
              <div>Internal use only // classification: level 4</div>
              <div className="opacity-50">© 2026 biohazard containment division</div>
            </div>
          </footer>
        </div>
      </div>
    </Router>
  );
};

export default ProcurementPortal;
