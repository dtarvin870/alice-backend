import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Radar, Activity, Archive, Menu, X, MonitorPlay, Users, LogOut, Cpu } from 'lucide-react';

import OrdersOverview from './pages/OrdersOverview';
import Catalog from './pages/Catalog';
import InventoryManager from './pages/InventoryManager';
import Fulfillment from './pages/Fulfillment';
import Kiosk from './pages/Kiosk';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import MachineControl from './pages/MachineControl';
import { API_BASE } from './apiConfig';
import umbrellaLogo from './assets/umbrella-logo.png';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 bg-red-50 text-red-900 border border-red-200 m-10 rounded-lg font-mono text-sm max-w-4xl mx-auto mt-20 shadow-xl">
          <h1 className="text-2xl font-black mb-4 uppercase tracking-widest flex items-center gap-2">
            <span className="text-4xl">⚠️</span> System Critical Fault
          </h1>
          <div className="bg-white/50 p-4 rounded mb-4">
            <strong className="block mb-2 uppercase tracking-wider text-xs opacity-70">Error Message:</strong>
            {this.state.error && this.state.error.toString()}
          </div>
          <details className="whitespace-pre-wrap opacity-70">
            <summary className="cursor-pointer hover:underline mb-2 uppercase tracking-wider text-xs">Diagnostic Stack Trace</summary>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-red-900 text-white px-6 py-3 rounded-sm uppercase tracking-widest font-bold hover:bg-red-800 transition-colors shadow-lg"
          >
            Reboot System
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const Navigation = ({ robotStatus, onLogout }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Shortened labels for better responsiveness
  const navItems = [
    { path: '/', label: 'Overview', icon: LayoutDashboard },
    { path: '/catalog', label: 'Order Request', icon: ShoppingCart },
    { path: '/inventory', label: 'Stock', icon: Package },
    { path: '/fulfillment/monitor', label: 'Order Fulfillment', icon: Radar },
    { path: '/users', label: 'Staff', icon: Users },
    { path: '/machines', label: 'Machines', icon: Cpu },
    { path: '/kiosk', label: 'Kiosk', icon: MonitorPlay },
  ];

  return (
    <header className="border-b border-gray-200 bg-white backdrop-blur-xl sticky top-0 z-50 shadow-sm min-h-20 flex items-center">
      <div className="w-full px-4 lg:px-8 py-2 flex items-center justify-between gap-4 flex-wrap">
        {/* Left Side: Logo (Shrinks on LG) */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <img src={umbrellaLogo} alt="Umbrella Corp" className="h-8 lg:h-10 object-contain" />
        </div>


        {/* Desktop Nav - Visible on LG (1024px) and up */}
        <div className="flex items-center gap-4 flex-1 justify-end hidden lg:flex min-w-0">
          <nav className="flex items-center justify-center gap-2 flex-nowrap w-full">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-sm text-[0.6rem] font-black uppercase tracking-widest transition-all text-center leading-tight h-16 min-w-[80px] ${isActive(item.path)
                  ? 'bg-umbrella-red text-white shadow-md'
                  : 'text-umbrella-red hover:bg-red-50'
                  }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </nav>


          {/* Robot Status Indicator - Hidden on LG, Visible on XL */}
          <div className={`hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-sm border flex-shrink-0 transition-colors duration-300 ${robotStatus.mode === 'OFFLINE' ? 'bg-slate-800 border-slate-700 text-slate-400' :
            robotStatus.mode === 'FAULT' ? 'bg-red-900 border-red-700 text-red-100 animate-pulse' :
              robotStatus.mode === 'PAUSED' ? 'bg-amber-900 border-amber-700 text-amber-100' :
                robotStatus.mode === 'RUNNING' || robotStatus.isBusy ? 'bg-blue-900 border-blue-700 text-blue-100' :
                  'bg-emerald-900 border-emerald-700 text-emerald-100'
            }`}>
            <Activity className={`w-3 h-3 ${robotStatus.isBusy || robotStatus.mode === 'RUNNING' ? 'animate-pulse' : ''}`} />
            <div className="flex flex-col">
              <span className="text-[0.6rem] font-black uppercase tracking-widest leading-none">A.L.I.C.E.</span>
              <span className="text-[0.6rem] font-mono font-bold leading-none">
                {robotStatus.mode === 'OFFLINE' ? 'OFFLINE' :
                  robotStatus.mode === 'FAULT' ? 'SYSTEM FAULT' :
                    robotStatus.mode === 'PAUSED' ? 'PAUSED' :
                      robotStatus.isBusy ? 'PROCESSING' :
                        robotStatus.mode === 'RUNNING' ? 'RUNNING' : 'READY'}
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-sm text-[0.6rem] font-black uppercase tracking-widest hover:bg-red-700 transition-colors shadow-sm active:scale-95 border border-red-800 whitespace-nowrap"
            title="End Session"
          >
            <LogOut className="w-3 h-3" />
            Sign Out
          </button>
        </div>

        {/* Mobile Menu Toggle - Visible below LG */}
        <button className="lg:hidden p-2 text-slate-900 hover:bg-slate-100 rounded" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
        </button>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 w-full bg-white border-b-4 border-umbrella-red p-4 flex flex-col gap-3 shadow-2xl animate-in slide-in-from-top z-50">

          <div className={`flex items-center gap-3 px-4 py-3 rounded-sm border mb-2 ${robotStatus.mode === 'OFFLINE' ? 'bg-slate-100 border-slate-300 text-slate-500' :
            robotStatus.mode === 'FAULT' ? 'bg-red-100 border-red-300 text-red-800' :
              robotStatus.mode === 'PAUSED' ? 'bg-amber-100 border-amber-300 text-amber-800' :
                robotStatus.mode === 'RUNNING' || robotStatus.isBusy ? 'bg-blue-100 border-blue-300 text-blue-800' :
                  'bg-emerald-100 border-emerald-300 text-emerald-800'
            }`}>
            <Activity className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">
              SYSTEM: {
                robotStatus.mode === 'OFFLINE' ? 'OFFLINE' :
                  robotStatus.mode === 'FAULT' ? 'FAULT' :
                    robotStatus.mode === 'PAUSED' ? 'PAUSED' :
                      robotStatus.isBusy ? 'BUSY' :
                        robotStatus.mode === 'RUNNING' ? 'RUNNING' : 'ONLINE'
              }
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-4 rounded-sm text-xs font-black uppercase tracking-widest border-2 transition-all ${isActive(item.path)
                  ? 'bg-umbrella-red text-white border-umbrella-red shadow-lg'
                  : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:text-black'
                  }`}
              >
                <item.icon className="w-6 h-6" />
                {item.label}
              </Link>
            ))}
          </div>

          <button
            onClick={() => { setMobileMenuOpen(false); onLogout(); }}
            className="flex items-center justify-center gap-2 px-4 py-4 rounded-sm text-sm font-black uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 mt-2 shadow-lg border border-red-800"
          >
            <LogOut className="w-5 h-5" />
            End Session
          </button>
        </div>
      )}
    </header>
  );
};

const App = () => {
  const [robotStatus, setRobotStatus] = useState({ mode: 'OFFLINE', isBusy: false });
  const [isAuthorized, setIsAuthorized] = useState(false);

  React.useEffect(() => {
    const hasAccess = sessionStorage.getItem('accessGranted');
    if (hasAccess === 'true') {
      setIsAuthorized(true);
    }
  }, []);

  React.useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/robot/status`);
        const data = await res.json();
        setRobotStatus({
          mode: data.mode,
          isBusy: !!data.currentJob
        });
      } catch (e) {
        setRobotStatus({ mode: 'OFFLINE', isBusy: false });
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = () => {
    setIsAuthorized(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('accessGranted');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    setIsAuthorized(false);
  };

  if (!isAuthorized) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 text-black font-sans relative overflow-x-hidden selection:bg-umbrella-red/20">
        {/* Background Logo Overlay */}
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] umbrella-bg opacity-[0.03]"></div>
        </div>

        <div className="relative z-10 min-h-screen flex flex-col">
          <Navigation robotStatus={robotStatus} onLogout={handleLogout} />
          <main className="flex-grow w-full max-w-full lg:max-w-7xl mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<OrdersOverview robotStatus={robotStatus} />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/inventory" element={<InventoryManager />} />
              <Route path="/fulfillment/monitor" element={<Dashboard robotStatus={robotStatus} />} />
              <Route path="/fulfillment/:id" element={<Fulfillment />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/machines" element={<MachineControl />} />
              <Route path="/kiosk" element={<Kiosk />} />
            </Routes>
          </main>

          <footer className="mt-auto border-t border-slate-200 bg-white p-6 relative z-20">
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
    </ErrorBoundary>
  );
};

export default App;
