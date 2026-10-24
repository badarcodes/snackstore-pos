import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, cashSessionAPI, settingAPI } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const [storeSettings, setStoreSettings] = useState({
    store_name: 'SnackStore Berkah Renyah',
    store_address: 'Jl. Camilan Gurih No. 88, Bandung',
    store_phone: '0812-3456-7890',
    store_receipt_footer: 'Terima kasih telah berbelanja camilan renyah kami!\nSimpan struk ini sebagai bukti pembayaran.',
    receipt_paper_width: '58mm'
  });

  // Global Toast state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const closeToast = () => setToast(null);

  const fetchActiveSession = async () => {
    try {
      const res = await cashSessionAPI.getActive();
      if (res.data.success) {
        setActiveSession(res.data.session);
      }
    } catch {
      setActiveSession(null);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await settingAPI.getSettings();
      if (res.data.success && res.data.settings) {
        setStoreSettings(prev => ({ ...prev, ...res.data.settings }));
      }
    } catch (err) {
      console.error('Failed to load store settings:', err);
    }
  };

  const checkAuth = async () => {
    try {
      const res = await authAPI.getMe();
      if (res.data.success && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('snack_user', JSON.stringify(res.data.user));
        fetchActiveSession();
        fetchSettings();
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
      localStorage.removeItem('snack_token');
      localStorage.removeItem('snack_user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (credentials) => {
    const res = await authAPI.login(credentials);
    if (res.data.success) {
      setUser(res.data.user);
      localStorage.setItem('snack_token', res.data.token);
      localStorage.setItem('snack_user', JSON.stringify(res.data.user));
      fetchActiveSession();
      fetchSettings();
      showToast(`Selamat datang kembali, ${res.data.user.name}!`, 'success');
    }
    return res.data;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setActiveSession(null);
      localStorage.removeItem('snack_token');
      localStorage.removeItem('snack_user');
      showToast('Anda telah berhasil logout.', 'info');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        checkAuth,
        activeSession,
        refreshSession: fetchActiveSession,
        storeSettings,
        refreshSettings: fetchSettings,
        toast,
        showToast,
        closeToast
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
