import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { employeeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function Employees() {
  const { showToast } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('ALL');

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    employeeCode: '',
    name: '',
    position: '',
    phone: '',
    address: '',
    hireDate: new Date().toISOString().split('T')[0],
    salary: '',
    isActive: true
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await employeeAPI.getAll();
      if (res.data.success) {
        setEmployees(res.data.employees || []);
      }
    } catch (err) {
      showToast('Gagal memuat data karyawan: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(Number(num) || 0);
  };

  const handleOpenCreate = () => {
    // Generate next employee code
    const nextCode = `KUE-${String(employees.length + 1).padStart(3, '0')}`;
    setFormData({
      employeeCode: nextCode,
      name: '',
      position: 'Baker & Pembuat Kue',
      phone: '',
      address: '',
      hireDate: new Date().toISOString().split('T')[0],
      salary: '3500000',
      isActive: true
    });
    setSelectedEmployee(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setSelectedEmployee(emp);
    setFormData({
      employeeCode: emp.employeeCode || '',
      name: emp.name || '',
      position: emp.position || '',
      phone: emp.phone || '',
      address: emp.address || '',
      hireDate: emp.hireDate ? emp.hireDate.split('T')[0] : '',
      salary: emp.salary ? String(emp.salary) : '',
      isActive: Boolean(emp.isActive)
    });
    setIsFormOpen(true);
  };

  const handleOpenDelete = (emp) => {
    setSelectedEmployee(emp);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (selectedEmployee) {
        await employeeAPI.update(selectedEmployee.id, formData);
        showToast('Data karyawan berhasil diperbarui!', 'success');
      } else {
        await employeeAPI.create(formData);
        showToast('Karyawan baru berhasil ditambahkan!', 'success');
      }
      setIsFormOpen(false);
      fetchEmployees();
    } catch (err) {
      showToast('Gagal menyimpan data: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;
    setSubmitting(true);
    try {
      await employeeAPI.delete(selectedEmployee.id);
      showToast(`Karyawan ${selectedEmployee.name} berhasil dihapus!`, 'success');
      setIsDeleteOpen(false);
      fetchEmployees();
    } catch (err) {
      showToast('Gagal menghapus karyawan: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
      emp.position.toLowerCase().includes(search.toLowerCase());

    const matchesActive =
      filterActive === 'ALL' ||
      (filterActive === 'ACTIVE' && emp.isActive) ||
      (filterActive === 'INACTIVE' && !emp.isActive);

    return matchesSearch && matchesActive;
  });

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.isActive).length;
  const totalPayroll = employees
    .filter(e => e.isActive)
    .reduce((acc, curr) => acc + Number(curr.salary || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-stone-900">Manajemen Data Karyawan</h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Kelola informasi staf toko kue, pembuat kue (baker), staf dekorasi, dan kasir penjualan
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Karyawan Baru</span>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Total Karyawan</div>
          <div className="text-2xl font-black text-stone-900 mt-1">{totalEmployees} Orang</div>
          <div className="text-[11px] text-stone-500 mt-0.5">Terdaftar di sistem toko</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Karyawan Aktif</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{activeEmployees} Orang</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            {totalEmployees > 0 ? `${Math.round((activeEmployees / totalEmployees) * 100)}% siap bertugas` : '-'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Estimasi Penggajian Bulanan</div>
          <div className="text-2xl font-black text-amber-700 mt-1">{formatIDR(totalPayroll)}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">Total gaji pokok staf aktif</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, kode (KUE-...), jabatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterActive('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterActive === 'ALL' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Semua ({totalEmployees})
            </button>
            <button
              onClick={() => setFilterActive('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterActive === 'ACTIVE' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Aktif ({activeEmployees})
            </button>
            <button
              onClick={() => setFilterActive('INACTIVE')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterActive === 'INACTIVE' ? 'bg-white text-rose-700 shadow-xs font-bold' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Nonaktif ({totalEmployees - activeEmployees})
            </button>
          </div>

          <button
            onClick={fetchEmployees}
            title="Refresh Data"
            className="p-2 border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-xl cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 text-stone-500 font-bold border-b border-stone-200 uppercase tracking-wider">
                <th className="py-3.5 px-4">Karyawan</th>
                <th className="py-3.5 px-4">Jabatan & Peran</th>
                <th className="py-3.5 px-4">Kontak & Alamat</th>
                <th className="py-3.5 px-4">Mulai Bekerja</th>
                <th className="py-3.5 px-4">Gaji Pokok</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-stone-400">
                    <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-amber-600" />
                    Memuat data karyawan toko...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-stone-400">
                    Tidak ditemukan karyawan yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-stone-900">{emp.name}</div>
                          <span className="font-mono text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-semibold">
                            {emp.employeeCode}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-stone-700 font-semibold">
                        <Briefcase className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{emp.position}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 text-stone-600">
                        {emp.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-stone-400" />
                            <span>{emp.phone}</span>
                          </div>
                        )}
                        {emp.address && (
                          <div className="flex items-center gap-1.5 text-stone-500 text-[11px] truncate max-w-[200px]" title={emp.address}>
                            <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                            <span>{emp.address}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-stone-600">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <span>
                          {emp.hireDate
                            ? new Date(emp.hireDate).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })
                            : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-800">
                      {formatIDR(emp.salary)}
                    </td>
                    <td className="py-3.5 px-4">
                      {emp.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 text-stone-600">
                          <XCircle className="w-3 h-3" />
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="p-1.5 text-stone-600 hover:text-amber-700 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Data Karyawan"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(emp)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Karyawan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal (Create / Edit) */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedEmployee ? 'Edit Data Karyawan Toko' : 'Tambah Karyawan Baru'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Kode Karyawan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.employeeCode}
                onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                placeholder="Contoh: KUE-001"
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Status Karyawan
              </label>
              <select
                value={formData.isActive ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="true">Aktif Bekerja</option>
                <option value="false">Nonaktif / Cuti Panjang</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Nama Lengkap <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nama lengkap karyawan"
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Jabatan / Posisi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Contoh: Baker & Pembuat Kue"
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Nomor Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08xx-xxxx-xxxx"
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Tanggal Mulai Kerja
              </label>
              <input
                type="date"
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Gaji Pokok (IDR)
              </label>
              <input
                type="number"
                min="0"
                step="50000"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                placeholder="Contoh: 3500000"
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Alamat Domisili
            </label>
            <textarea
              rows="2"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Alamat lengkap tempat tinggal karyawan"
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 border border-stone-300 hover:bg-stone-100 rounded-xl text-xs font-semibold text-stone-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : selectedEmployee ? 'Simpan Perubahan' : 'Tambah Karyawan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Hapus Data Karyawan"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <div className="font-bold">Peringatan Penghapusan Data</div>
              <p className="mt-0.5">
                Apakah Anda yakin ingin menghapus data karyawan{' '}
                <span className="font-bold underline">{selectedEmployee?.name}</span> ({selectedEmployee?.employeeCode})?
                Seluruh catatan riwayat presensi dan evaluasi karyawan ini akan ikut terhapus.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 border border-stone-300 hover:bg-stone-100 rounded-xl text-xs font-semibold text-stone-700 cursor-pointer"
            >
              Batalkan
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Menghapus...' : 'Ya, Hapus Data'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
