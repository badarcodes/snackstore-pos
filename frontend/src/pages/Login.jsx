import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, Store, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login({ navigate }) {
  const { login, storeSettings } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ username, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal. Periksa username dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (userType) => {
    if (userType === 'admin') {
      setUsername('admin');
      setPassword('admin123456');
    } else {
      setUsername('kasir1');
      setPassword('kasir123456');
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-stone-200/80 overflow-hidden">
        {/* Brand Banner Header */}
        <div className="bg-gradient-to-br from-snack-950 via-snack-900 to-amber-900 text-white p-8 text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 shadow-lg shadow-amber-950/40 mb-3 text-2xl">
            🍿
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-white mb-1">
            {storeSettings.store_name || 'SnackStore POS'}
          </h1>
          <p className="text-xs text-amber-200/90 font-medium">
            Sistem Kasir & Administrasi Toko Camilan Kering
          </p>
        </div>

        {/* Login Form */}
        <div className="p-8">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium text-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium text-stone-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-900/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Memverifikasi Akun...</span>
              ) : (
                <span>Masuk ke Sistem</span>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-6 pt-5 border-t border-stone-100">
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider text-center mb-3">
              Kredensial Cepat (Demo):
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="py-2 px-3 border border-stone-200 hover:border-amber-500 hover:bg-amber-50/50 rounded-xl text-xs font-semibold text-stone-700 text-left transition-all"
              >
                <div className="font-bold text-amber-900">Pemilik (Admin)</div>
                <div className="text-[10px] text-stone-500">admin / admin123456</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('cashier')}
                className="py-2 px-3 border border-stone-200 hover:border-amber-500 hover:bg-amber-50/50 rounded-xl text-xs font-semibold text-stone-700 text-left transition-all"
              >
                <div className="font-bold text-amber-900">Kasir Toko</div>
                <div className="text-[10px] text-stone-500">kasir1 / kasir123456</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
