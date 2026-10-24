import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  DollarSign,
  TrendingUp,
  Receipt,
  FileText,
  RefreshCw
} from 'lucide-react';
import { financeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function Finance() {
  const { user, showToast } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' | 'incomes' | 'summary'
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [expenseCategory, setExpenseCategory] = useState('all');
  const [incomeCategory, setIncomeCategory] = useState('all');

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'KEMASAN_PLASTIK',
    amount: '',
    paymentMethod: 'CASH',
    description: ''
  });
  const [submittingExpense, setSubmittingExpense] = useState(false);

  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [incomeForm, setIncomeForm] = useState({
    category: 'MODAL_AWAL',
    amount: '',
    paymentMethod: 'CASH',
    description: ''
  });
  const [submittingIncome, setSubmittingIncome] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expRes, incRes, sumRes] = await Promise.all([
        financeAPI.getExpenses({ category: expenseCategory }),
        isAdmin ? financeAPI.getIncomes({ category: incomeCategory }) : Promise.resolve({ data: { incomes: [] } }),
        isAdmin ? financeAPI.getSummary({}) : Promise.resolve({ data: { summary: null } })
      ]);

      if (expRes.data.success) setExpenses(expRes.data.expenses);
      if (incRes.data?.success) setIncomes(incRes.data.incomes);
      if (sumRes.data?.success) setSummary(sumRes.data.summary);
    } catch (err) {
      showToast('Gagal memuat data keuangan', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [expenseCategory, incomeCategory, activeTab]);

  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
      showToast('Nominal pengeluaran harus lebih dari 0', 'error');
      return;
    }
    if (!expenseForm.description.trim()) {
      showToast('Deskripsi pengeluaran wajib diisi', 'error');
      return;
    }

    setSubmittingExpense(true);
    try {
      const res = await financeAPI.createExpense(expenseForm);
      if (res.data.success) {
        showToast('Pengeluaran berhasil dicatat!', 'success');
        setIsExpenseModalOpen(false);
        setExpenseForm({ category: 'KEMASAN_PLASTIK', amount: '', paymentMethod: 'CASH', description: '' });
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menyimpan pengeluaran', 'error');
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleIncomeSubmit = async (e) => {
    e.preventDefault();
    if (!incomeForm.amount || Number(incomeForm.amount) <= 0) {
      showToast('Nominal pemasukan harus lebih dari 0', 'error');
      return;
    }
    if (!incomeForm.description.trim()) {
      showToast('Deskripsi pemasukan wajib diisi', 'error');
      return;
    }

    setSubmittingIncome(true);
    try {
      const res = await financeAPI.createIncome(incomeForm);
      if (res.data.success) {
        showToast('Pemasukan lain berhasil dicatat!', 'success');
        setIsIncomeModalOpen(false);
        setIncomeForm({ category: 'MODAL_AWAL', amount: '', paymentMethod: 'CASH', description: '' });
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menyimpan pemasukan', 'error');
    } finally {
      setSubmittingIncome(false);
    }
  };

  const expenseCategoryLabels = {
    STOK_BAHAN: 'Bahan & Stok Camilan',
    KEMASAN_PLASTIK: 'Plastik & Zipper Kemasan',
    TRANSPORTASI: 'Ongkir & Transportasi',
    LISTRIK_AIR: 'Listrik & Utilitas',
    GAJI: 'Gaji Pegawai',
    OPERASIONAL_LAIN: 'Operasional Lainnya'
  };

  const incomeCategoryLabels = {
    MODAL_AWAL: 'Suntikan Modal Pemilik',
    PENDAPATAN_LAIN: 'Pendapatan Lain di Luar POS',
    BONUS_SUPPLIER: 'Bonus / Diskon Supplier'
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Modul Keuangan Toko</h2>
          <p className="text-xs text-stone-500">
            Pencatatan pengeluaran operasional, modal, dan ringkasan arus kas toko.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Pengeluaran</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => setIsIncomeModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Pemasukan Lain</span>
            </button>
          )}
        </div>
      </div>

      {/* Financial Summary Highlight (if Admin) */}
      {isAdmin && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Total Omzet Penjualan</span>
            <div className="text-lg font-extrabold font-mono text-stone-900 mt-1">
              {formatIDR(summary.salesRevenue)}
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5">Dari transaksi kasir POS</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Estimasi Laba Kotor</span>
            <div className="text-lg font-extrabold font-mono text-emerald-700 mt-1">
              {formatIDR(summary.totalGrossProfit)}
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5">Omzet dikurangi HPP terjual</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Total Biaya Pengeluaran</span>
            <div className="text-lg font-extrabold font-mono text-rose-700 mt-1">
              {formatIDR(summary.totalExpenses)}
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5">Biaya operasional & kemasan</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Net Cash Flow</span>
            <div className={`text-lg font-extrabold font-mono mt-1 ${
              summary.netCashFlow >= 0 ? 'text-blue-700' : 'text-rose-700'
            }`}>
              {formatIDR(summary.netCashFlow)}
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5">Arus kas bersih masuk - keluar</div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-stone-200 gap-4">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'expenses'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Daftar Pengeluaran Toko
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('incomes')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'incomes'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Pemasukan Lain di Luar POS
          </button>
        )}
      </div>

      {/* TAB 1: Expenses Table */}
      {activeTab === 'expenses' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-semibold">Filter Kategori:</span>
            <select
              value={expenseCategory}
              onChange={(e) => setExpenseCategory(e.target.value)}
              className="px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Semua Kategori Biaya</option>
              {Object.entries(expenseCategoryLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50/80 border-b border-stone-200/80 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">No. Catatan</th>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Kategori Biaya</th>
                    <th className="py-3 px-4">Deskripsi / Keperluan</th>
                    <th className="py-3 px-4 text-center">Metode</th>
                    <th className="py-3 px-4 text-right">Nominal</th>
                    <th className="py-3 px-4">Dicatat Oleh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-stone-400">
                        Belum ada catatan pengeluaran.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-stone-900">
                          {exp.expenseNumber}
                        </td>
                        <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                          {new Date(exp.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 bg-rose-50 text-rose-800 rounded font-bold text-[10px]">
                            {expenseCategoryLabels[exp.category] || exp.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-stone-800 max-w-sm">
                          {exp.description}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-bold text-[10px] text-stone-600 uppercase">
                            {exp.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-rose-700 text-sm">
                          {formatIDR(exp.amount)}
                        </td>
                        <td className="py-3 px-4 text-stone-600 whitespace-nowrap">
                          {exp.user?.name}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Other Incomes Table */}
      {activeTab === 'incomes' && isAdmin && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50/80 border-b border-stone-200/80 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">No. Catatan</th>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Kategori Pemasukan</th>
                    <th className="py-3 px-4">Deskripsi</th>
                    <th className="py-3 px-4 text-center">Metode</th>
                    <th className="py-3 px-4 text-right">Nominal</th>
                    <th className="py-3 px-4">Dicatat Oleh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {incomes.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-stone-400">
                        Belum ada catatan pemasukan lain.
                      </td>
                    </tr>
                  ) : (
                    incomes.map((inc) => (
                      <tr key={inc.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-stone-900">
                          {inc.entryNumber}
                        </td>
                        <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                          {new Date(inc.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-bold text-[10px]">
                            {incomeCategoryLabels[inc.category] || inc.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-stone-800 max-w-sm">
                          {inc.description}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-[10px] text-stone-600 uppercase">
                          {inc.paymentMethod}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-700 text-sm">
                          {formatIDR(inc.amount)}
                        </td>
                        <td className="py-3 px-4 text-stone-600 whitespace-nowrap">
                          {inc.user?.name}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Catat Biaya Pengeluaran Toko"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleExpenseSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Kategori Pengeluaran <span className="text-rose-500">*</span>
            </label>
            <select
              value={expenseForm.category}
              onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {Object.entries(expenseCategoryLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Nominal Pengeluaran (Rp) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1000"
              step="500"
              required
              placeholder="Contoh: 35000"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl font-mono text-sm font-bold text-rose-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Metode Pembayaran
            </label>
            <select
              value={expenseForm.paymentMethod}
              onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="CASH">Uang Tunai Laci Kasir (Cash)</option>
              <option value="TRANSFER">Transfer Bank / Rekening Toko</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Keperluan / Keterangan <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows="3"
              placeholder="Contoh: Pembelian 2 pak plastik klip 12x20 dan kantong kresek HD untuk packing camilan"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(false)}
              className="flex-1 py-2.5 px-4 border border-stone-300 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submittingExpense}
              className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
            >
              {submittingExpense ? 'Menyimpan...' : 'Simpan Pengeluaran'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Income Modal */}
      <Modal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        title="Catat Pemasukan Lain di Luar POS"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleIncomeSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Kategori Pemasukan
            </label>
            <select
              value={incomeForm.category}
              onChange={(e) => setIncomeForm({ ...incomeForm, category: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {Object.entries(incomeCategoryLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Nominal Pemasukan (Rp) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1000"
              step="1000"
              required
              placeholder="Contoh: 500000"
              value={incomeForm.amount}
              onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl font-mono text-sm font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Metode Pembayaran
            </label>
            <select
              value={incomeForm.paymentMethod}
              onChange={(e) => setIncomeForm({ ...incomeForm, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="CASH">Uang Tunai Laci Kasir (Cash)</option>
              <option value="TRANSFER">Transfer Bank / Rekening Toko</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Keterangan <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows="3"
              placeholder="Contoh: Tambahan modal kas dari pemilik toko..."
              value={incomeForm.description}
              onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsIncomeModalOpen(false)}
              className="flex-1 py-2.5 px-4 border border-stone-300 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submittingIncome}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
            >
              {submittingIncome ? 'Menyimpan...' : 'Simpan Pemasukan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
