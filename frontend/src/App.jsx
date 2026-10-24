import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import StockManagement from './pages/StockManagement';
import Transactions from './pages/Transactions';
import Finance from './pages/Finance';
import CashSessions from './pages/CashSessions';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';
import { RefreshCw } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/dashboard');

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/dashboard');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 flex items-center justify-center text-white text-xl animate-bounce">
            🍿
          </div>
          <p className="text-xs font-bold text-stone-600">Memuat SnackStore POS...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Login navigate={navigate} />;
  }

  // If root path or login path while authenticated
  if (currentPath === '/' || currentPath === '/login') {
    navigate(user.role === 'CASHIER' ? '/pos' : '/dashboard');
    return null;
  }

  const isAdmin = user.role === 'ADMIN';

  // Routing Map
  let pageComponent = null;
  let pageTitle = 'Dashboard';

  switch (currentPath) {
    case '/dashboard':
      pageTitle = 'Dashboard Ringkasan';
      pageComponent = <Dashboard navigate={navigate} />;
      break;
    case '/pos':
      pageTitle = 'Kasir Penjualan (Point of Sale)';
      pageComponent = <POS navigate={navigate} />;
      break;
    case '/products':
      pageTitle = 'Data Produk & Camilan';
      pageComponent = <Products navigate={navigate} />;
      break;
    case '/stock':
      pageTitle = 'Manajemen Stok & Logistik';
      pageComponent = <StockManagement navigate={navigate} />;
      break;
    case '/transactions':
      pageTitle = 'Riwayat Transaksi Penjualan';
      pageComponent = <Transactions navigate={navigate} />;
      break;
    case '/finance':
      pageTitle = 'Pemasukan & Pengeluaran Toko';
      pageComponent = <Finance navigate={navigate} />;
      break;
    case '/cash-sessions':
      pageTitle = 'Pengelolaan Shift & Laci Kasir';
      pageComponent = <CashSessions navigate={navigate} />;
      break;
    case '/reports':
      if (!isAdmin) {
        navigate('/pos');
        return null;
      }
      pageTitle = 'Laporan Keuangan & Analisis';
      pageComponent = <Reports navigate={navigate} />;
      break;
    case '/users':
      if (!isAdmin) {
        navigate('/pos');
        return null;
      }
      pageTitle = 'Manajemen Pengguna & Hak Akses';
      pageComponent = <Users navigate={navigate} />;
      break;
    case '/settings':
      if (!isAdmin) {
        navigate('/pos');
        return null;
      }
      pageTitle = 'Pengaturan Toko & Printer';
      pageComponent = <Settings navigate={navigate} />;
      break;
    default:
      pageTitle = 'Dashboard';
      pageComponent = <Dashboard navigate={navigate} />;
      break;
  }

  return (
    <Layout currentPath={currentPath} navigate={navigate} title={pageTitle}>
      {pageComponent}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
