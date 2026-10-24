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
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import DailyEvaluation from './pages/DailyEvaluation';
import PerformanceRecap from './pages/PerformanceRecap';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

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
            🎂
          </div>
          <p className="text-xs font-bold text-stone-600">Memuat Toko Kue Jaya Baru...</p>
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
    navigate('/dashboard');
    return null;
  }

  // Routing Map
  let pageComponent = null;
  let pageTitle = 'Dashboard';

  switch (currentPath) {
    case '/dashboard':
      pageTitle = 'Dashboard Ringkasan';
      pageComponent = <Dashboard navigate={navigate} />;
      break;
    case '/pos':
      pageTitle = 'Kasir Penjualan Toko Kue';
      pageComponent = <POS navigate={navigate} />;
      break;
    case '/products':
      pageTitle = 'Data Produk Kue';
      pageComponent = <Products navigate={navigate} />;
      break;
    case '/stock':
      pageTitle = 'Manajemen Stok & Bahan Baku';
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
    case '/employees':
      pageTitle = 'Data Karyawan Toko Kue';
      pageComponent = <Employees navigate={navigate} />;
      break;
    case '/attendance':
      pageTitle = 'Presensi & Cuti Karyawan';
      pageComponent = <Attendance navigate={navigate} />;
      break;
    case '/evaluations':
      pageTitle = 'Penilaian Kinerja Harian Karyawan';
      pageComponent = <DailyEvaluation navigate={navigate} />;
      break;
    case '/performance-recap':
      pageTitle = 'Rekapitulasi Kinerja Karyawan';
      pageComponent = <PerformanceRecap navigate={navigate} />;
      break;
    case '/reports':
      pageTitle = 'Laporan Keuangan & Analisis Toko';
      pageComponent = <Reports navigate={navigate} />;
      break;
    case '/settings':
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
