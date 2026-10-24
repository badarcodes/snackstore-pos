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

// Error Boundary to prevent white screen of death
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xl max-w-md w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
              ⚠️
            </div>
            <h2 className="text-lg font-bold text-stone-900">Terjadi Kesalahan pada Halaman</h2>
            <p className="text-xs text-stone-500">
              {this.state.error?.message || 'Gagal memuat antarmuka sistem.'}
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('snack_token');
                localStorage.removeItem('snack_user');
                window.location.href = '/login';
              }}
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Muat Ulang & Masuk Kembali
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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

  // Sync route URL asynchronously without causing setState in render body
  useEffect(() => {
    if (user && (currentPath === '/' || currentPath === '/login')) {
      window.history.replaceState({}, '', '/dashboard');
      setCurrentPath('/dashboard');
    }
  }, [user, currentPath]);

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

  // Resolve active path safely
  const activePath = (currentPath === '/' || currentPath === '/login') ? '/dashboard' : currentPath;

  // Routing Map
  let pageComponent = null;
  let pageTitle = 'Dashboard';

  switch (activePath) {
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
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
