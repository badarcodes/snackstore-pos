import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Eye,
  Printer,
  Ban,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { transactionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ThermalReceipt from '../components/ThermalReceipt';

export default function Transactions() {
  const { user, showToast } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ completedCount: 0, totalSales: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [status, setStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [selectedSale, setSelectedSale] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Cancel Transaction Modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await transactionAPI.getAll({
        search,
        paymentMethod,
        status,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });

      if (res.data.success) {
        setTransactions(res.data.transactions);
        if (res.data.summary) setSummary(res.data.summary);
      }
    } catch (err) {
      showToast('Gagal memuat riwayat transaksi', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [paymentMethod, status]);

  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTransactions();
  };

  const openDetail = async (sale) => {
    try {
      const res = await transactionAPI.getById(sale.id);
      if (res.data.success) {
        setSelectedSale(res.data.sale);
        setIsDetailOpen(true);
      }
    } catch {
      setSelectedSale(sale);
      setIsDetailOpen(true);
    }
  };

  const openReceipt = async (sale) => {
    try {
      const res = await transactionAPI.getById(sale.id);
      if (res.data.success) {
        setSelectedSale(res.data.sale);
        setIsReceiptOpen(true);
      }
    } catch {
      setSelectedSale(sale);
      setIsReceiptOpen(true);
    }
  };

  const openCancelModal = (sale) => {
    setSelectedSale(sale);
    setCancelReason('');
    setIsCancelModalOpen(true);
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim() || cancelReason.trim().length < 3) {
      showToast('Alasan pembatalan transaksi wajib diisi minimal 3 karakter', 'error');
      return;
    }

    setSubmittingCancel(true);
    try {
      const res = await transactionAPI.cancel(selectedSale.id, cancelReason);
      if (res.data.success) {
        showToast(res.data.message, 'success');
        setIsCancelModalOpen(false);
        setIsDetailOpen(false);
        fetchTransactions();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal membatalkan transaksi', 'error');
    } finally {
      setSubmittingCancel(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Riwayat Transaksi Penjualan</h2>
          <p className="text-xs text-stone-500">
            Daftar lengkap struk transaksi kasir, metode pembayaran, dan status transaksi.
          </p>
        </div>

        {/* Total Summary Pill */}
        <div className="bg-white px-4 py-2 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-xl text-amber-700">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Total Penjualan Selesai</div>
            <div className="text-sm font-mono font-extrabold text-stone-900">
              {formatIDR(summary.totalSales)} ({summary.completedCount} Trx)
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nomor invoice (misal: TRX-2026...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            />
          </form>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            {/* Payment Method */}
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="px-3 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Semua Pembayaran</option>
              <option value="CASH">Tunai (Cash)</option>
              <option value="QRIS">QRIS</option>
              <option value="TRANSFER">Transfer Bank</option>
            </select>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Semua Status</option>
              <option value="COMPLETED">Selesai (Lunas)</option>
              <option value="CANCELLED">Dibatalkan (Void)</option>
            </select>

            {/* Date Filters */}
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 border border-stone-200 rounded-xl text-xs text-stone-700"
            />
            <span className="text-xs text-stone-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-stone-200 rounded-xl text-xs text-stone-700"
            />

            <button
              onClick={fetchTransactions}
              className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Terapkan
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200/80 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">No. Transaksi</th>
                <th className="py-3 px-4">Tanggal & Waktu</th>
                <th className="py-3 px-4">Kasir</th>
                <th className="py-3 px-4 text-center">Metode</th>
                <th className="py-3 px-4 text-right">Total Tagihan</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-stone-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-600" />
                    Memuat riwayat transaksi...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-stone-400">
                    Tidak ada transaksi ditemukan.
                  </td>
                </tr>
              ) : (
                transactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-stone-900">{trx.invoiceNumber}</div>
                      <div className="text-[10px] text-stone-400">{trx._count?.items || 1} jenis barang</div>
                    </td>
                    <td className="py-3 px-4 text-stone-600 whitespace-nowrap">
                      {new Date(trx.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-stone-800">
                      {trx.cashier?.name}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 bg-stone-100 text-stone-800 rounded font-bold text-[10px] uppercase">
                        {trx.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-stone-900 text-sm">
                      {formatIDR(trx.finalAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        trx.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {trx.status === 'COMPLETED' ? 'Lunas' : 'Dibatalkan'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openDetail(trx)}
                          className="p-1.5 text-stone-600 hover:text-amber-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                          title="Lihat Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openReceipt(trx)}
                          className="p-1.5 text-stone-600 hover:text-amber-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                          title="Cetak Struk"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && trx.status === 'COMPLETED' && (
                          <button
                            onClick={() => openCancelModal(trx)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Batalkan Transaksi"
                          >
                            <Ban className="w-3.5 h-3.5" />
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

      {/* Transaction Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Detail Transaksi: ${selectedSale?.invoiceNumber}`}
        maxWidth="max-w-lg"
      >
        {selectedSale && (
          <div className="space-y-4 text-xs">
            {/* Status Banner */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              selectedSale.status === 'COMPLETED'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}>
              <span className="font-bold">Status Transaksi:</span>
              <span className="font-extrabold uppercase">
                {selectedSale.status === 'COMPLETED' ? 'Lunas / Berhasil' : 'DIBATALKAN (VOID)'}
              </span>
            </div>

            {selectedSale.status === 'CANCELLED' && (
              <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 text-rose-800 space-y-1">
                <div><span className="font-bold">Dibatalkan Oleh:</span> {selectedSale.cancelledBy?.name || 'Admin'}</div>
                <div><span className="font-bold">Waktu Batal:</span> {new Date(selectedSale.cancelledAt).toLocaleString('id-ID')}</div>
                <div><span className="font-bold">Alasan:</span> {selectedSale.cancellationReason}</div>
              </div>
            )}

            {/* Information Grid */}
            <div className="grid grid-cols-2 gap-2 text-stone-600 bg-stone-50 p-3 rounded-xl">
              <div>Kasir: <span className="font-bold text-stone-900">{selectedSale.cashier?.name}</span></div>
              <div>Metode: <span className="font-bold text-stone-900 uppercase">{selectedSale.paymentMethod}</span></div>
              <div>Waktu: <span className="font-mono text-stone-900">{new Date(selectedSale.createdAt).toLocaleString('id-ID')}</span></div>
              {selectedSale.notes && <div>Catatan: <span className="text-stone-800">{selectedSale.notes}</span></div>}
            </div>

            {/* Item List */}
            <div>
              <h4 className="font-bold text-stone-900 mb-2">Daftar Barang Belanja</h4>
              <div className="space-y-1.5 border border-stone-200 rounded-xl p-3 bg-white">
                {selectedSale.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1 border-b border-stone-100 last:border-0">
                    <div>
                      <div className="font-bold text-stone-900">{item.productName}</div>
                      <div className="text-[10px] text-stone-500 font-mono">
                        {item.qty} x {formatIDR(item.unitPrice)}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-stone-900">
                      {formatIDR(item.subtotal)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="space-y-1 border-t border-stone-200 pt-3 text-stone-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono">{formatIDR(selectedSale.totalAmount)}</span>
              </div>
              {Number(selectedSale.discountAmount) > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Diskon</span>
                  <span className="font-mono">- {formatIDR(selectedSale.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-stone-950 pt-1 border-t border-stone-200">
                <span>Total Akhir</span>
                <span className="font-mono text-amber-800">{formatIDR(selectedSale.finalAmount)}</span>
              </div>
              {selectedSale.paymentMethod === 'CASH' && (
                <>
                  <div className="flex justify-between text-stone-500">
                    <span>Uang Diterima</span>
                    <span className="font-mono">{formatIDR(selectedSale.cashReceived)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-stone-900">
                    <span>Kembalian</span>
                    <span className="font-mono">{formatIDR(selectedSale.changeAmount)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2 pt-3">
              <button
                type="button"
                onClick={() => {
                  setIsDetailOpen(false);
                  setIsReceiptOpen(true);
                }}
                className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Struk Pembelian</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Transaction Confirmation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Pembatalan Transaksi (Void Transaksi)"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCancelSubmit} className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 leading-relaxed">
            <div className="font-bold flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Perhatian Pembatalan Transaksi
            </div>
            Membatalkan transaksi <span className="font-mono font-bold">{selectedSale?.invoiceNumber}</span> akan secara otomatis mengembalikan jumlah stok produk ke sistem inventory toko dan mengoreksi kas.
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Alasan Pembatalan (Wajib Diisi) <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows="3"
              placeholder="Contoh: Pelanggan salah beli rasa basreng, transaksi ganda kasir..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(false)}
              className="flex-1 py-2.5 px-4 border border-stone-300 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submittingCancel}
              className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
            >
              {submittingCancel ? 'Memproses Batal...' : 'Ya, Batalkan Transaksi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Thermal Receipt Print Modal */}
      <Modal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        title="Cetak Struk Transaksi"
        maxWidth="max-w-sm"
      >
        <ThermalReceipt
          sale={selectedSale}
          onClose={() => setIsReceiptOpen(false)}
        />
      </Modal>
    </div>
  );
}
