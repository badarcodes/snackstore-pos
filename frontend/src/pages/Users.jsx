import React, { useState, useEffect } from 'react';
import {
  Users as UsersIcon,
  Plus,
  KeyRound,
  Shield,
  UserCheck,
  UserX,
  RefreshCw,
  Edit2
} from 'lucide-react';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function Users() {
  const { user: currentUser, showToast } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    name: '',
    password: '',
    role: 'CASHIER'
  });
  const [submittingCreate, setSubmittingCreate] = useState(false);

  const [isResetOpen, setIsResetOpen] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [submittingReset, setSubmittingReset] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userAPI.getAll();
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch {
      showToast('Gagal memuat data pengguna', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.username || !createForm.name || !createForm.password) {
      showToast('Semua field wajib diisi', 'error');
      return;
    }

    setSubmittingCreate(true);
    try {
      const res = await userAPI.create(createForm);
      if (res.data.success) {
        showToast('Pengguna baru berhasil ditambahkan!', 'success');
        setIsCreateOpen(false);
        setCreateForm({ username: '', name: '', password: '', role: 'CASHIER' });
        fetchUsers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menambahkan pengguna', 'error');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleToggleActive = async (u) => {
    if (u.id === currentUser.id) {
      showToast('Anda tidak dapat menonaktifkan akun sendiri', 'error');
      return;
    }

    try {
      const res = await userAPI.update(u.id, { isActive: !u.isActive });
      if (res.data.success) {
        showToast(
          `Akun ${u.username} berhasil di${u.isActive ? 'nonaktifkan' : 'aktifkan'}!`,
          'success'
        );
        fetchUsers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal mengubah status akun', 'error');
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast('Password baru minimal 6 karakter', 'error');
      return;
    }

    setSubmittingReset(true);
    try {
      const res = await userAPI.resetPassword(targetUser.id, { newPassword });
      if (res.data.success) {
        showToast(res.data.message, 'success');
        setIsResetOpen(false);
        setNewPassword('');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal mereset password', 'error');
    } finally {
      setSubmittingReset(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Pengelolaan Akun Pengguna</h2>
          <p className="text-xs text-stone-500">
            Kelola hak akses pemilik (Admin) dan kasir toko. Riwayat transaksi tetap utuh saat akun dinonaktifkan.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200/80 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4 text-center">Hak Akses (Role)</th>
                <th className="py-3 px-4 text-center">Total Transaksi</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi Keamanan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-stone-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-600" />
                    Memuat data pengguna...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-stone-900">
                      {u.name}
                      {u.id === currentUser.id && (
                        <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] rounded font-bold">
                          Anda
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-stone-600">
                      {u.username}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                        u.role === 'ADMIN'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-blue-100 text-blue-900'
                      }`}>
                        {u.role === 'ADMIN' ? 'Admin / Pemilik' : 'Kasir Toko'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-stone-700">
                      {u._count?.sales || 0}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        u.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {u.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setTargetUser(u);
                            setNewPassword('');
                            setIsResetOpen(true);
                          }}
                          className="p-1.5 text-stone-600 hover:text-amber-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                          title="Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        {u.id !== currentUser.id && (
                          <button
                            onClick={() => handleToggleActive(u)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              u.isActive
                                ? 'text-rose-600 hover:bg-rose-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={u.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                          >
                            {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Tambah Akun Pengguna Baru"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Nama Lengkap Pegawai <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Rian Pratama"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Username Unik <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: kasir2"
              value={createForm.username}
              onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-mono lowercase focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Hak Akses (Role) <span className="text-rose-500">*</span>
            </label>
            <select
              value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="CASHIER">Kasir Toko (Point of Sale)</option>
              <option value="ADMIN">Pemilik Toko (Full Admin)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Password Awal <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength="6"
              placeholder="Minimal 6 karakter"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="flex-1 py-2.5 px-4 border border-stone-300 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submittingCreate}
              className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
            >
              {submittingCreate ? 'Menyimpan...' : 'Buat Akun'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        title={`Reset Password: ${targetUser?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleResetSubmit} className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
            Mengatur ulang password untuk akun pengguna <span className="font-bold">{targetUser?.username}</span>.
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Password Baru <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength="6"
              placeholder="Minimal 6 karakter baru"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsResetOpen(false)}
              className="flex-1 py-2.5 px-4 border border-stone-300 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submittingReset}
              className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
            >
              {submittingReset ? 'Menyimpan...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
