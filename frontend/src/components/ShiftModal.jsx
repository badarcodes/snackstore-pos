import React, { useState } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, Lock, Unlock, AlertCircle } from 'lucide-react';
import Modal from './Modal';
import { cashSessionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ShiftModal({ isOpen, onClose }) {
  const { activeSession, refreshSession, showToast, user } = useAuth();
  const [tab, setTab] = useState(activeSession ? 'close' : 'open');
  const [loading, setLoading] = useState(false);

  // Form states
  const [openingCash, setOpeningCash] = useState('200000');
  const [actualCash, setActualCash] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');
  
  // Movement form
  const [movementType, setMovementType] = useState('OUT');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('');

  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  const handleOpenShift = async (e) => {
    e.preventDefault();
    if (Number(openingCash) < 0) {
      showToast('Modal awal kasir tidak boleh negatif', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await cashSessionAPI.open({
        openingCash: Number(openingCash),
        notes: shiftNotes
      });
      if (res.data.success) {
        showToast('Shift kasir berhasil dibuka!', 'success');
        await refreshSession();
        onClose();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal membuka shift', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShift = async (e) => {
    e.preventDefault();
    if (actualCash === '' || Number(actualCash) < 0) {
      showToast('Masukkan jumlah uang fisik kasir dengan benar', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await cashSessionAPI.close(activeSession.id, {
        actualCash: Number(actualCash),
        notes: shiftNotes
      });
      if (res.data.success) {
        showToast(res.data.message, 'success');
        await refreshSession();
        onClose();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menutup shift', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMovement = async (e) => {
    e.preventDefault();
    if (!movementAmount || Number(movementAmount) <= 0) {
      showToast('Nominal pergerakan kas harus lebih dari 0', 'error');
      return;
    }
    if (!movementReason.trim()) {
      showToast('Alasan pergerakan kas wajib diisi', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await cashSessionAPI.addMovement(activeSession.id, {
        type: movementType,
        amount: Number(movementAmount),
        reason: movementReason
      });
      if (res.data.success) {
        showToast(res.data.message, 'success');
        setMovementAmount('');
        setMovementReason('');
        await refreshSession();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal mencatat pergerakan kas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const expectedAmount = activeSession ? Number(activeSession.expectedCash) : 0;
  const difference = actualCash !== '' ? Number(actualCash) - expectedAmount : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activeSession ? 'Pengelolaan Shift & Laci Kasir' : 'Buka Shift Kasir Baru'}
      maxWidth="max-w-md"
    >
      {activeSession ? (
        <div>
          {/* Navigation Tabs */}
          <div className="flex border-b border-stone-200 mb-5">
            <button
              onClick={() => setTab('close')}
              className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                tab === 'close'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              Tutup Shift Kasir
            </button>
            <button
              onClick={() => setTab('movement')}
              className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                tab === 'movement'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              Kas Masuk / Keluar
            </button>
          </div>

          {tab === 'close' && (
            <form onSubmit={handleCloseShift} className="space-y-4">
              {/* Summary of Active Session */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 space-y-1.5 text-xs text-stone-700">
                <div className="flex justify-between">
                  <span className="text-stone-500">Kasir:</span>
                  <span className="font-semibold text-stone-800">{activeSession.cashier?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Modal Awal Kas:</span>
                  <span className="font-mono">{formatIDR(activeSession.openingCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Total Penjualan Tunai:</span>
                  <span className="font-mono text-emerald-700 font-semibold">+{formatIDR(activeSession.totalCashSales)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Kas Masuk Lainnya:</span>
                  <span className="font-mono text-emerald-700">+{formatIDR(activeSession.totalCashIn)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Kas Keluar / Biaya:</span>
                  <span className="font-mono text-rose-700">-{formatIDR(activeSession.totalCashOut)}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-amber-200 text-sm font-bold text-amber-950">
                  <span>Kas yang Seharusnya:</span>
                  <span className="font-mono">{formatIDR(expectedAmount)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Hitung Uang Fisik di Laci (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  required
                  placeholder="Contoh: 350000"
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl font-mono text-base font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {actualCash !== '' && (
                <div className={`p-3 rounded-xl border text-xs flex items-center justify-between font-bold ${
                  difference === 0
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : difference > 0
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  <span>Selisih Kas:</span>
                  <span className="font-mono text-sm">
                    {difference > 0 ? `+${formatIDR(difference)} (Lebih)` : difference < 0 ? `${formatIDR(difference)} (Kurang)` : 'Pas (Sesuai)'}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Keterangan / Catatan Penutupan Shift
                </label>
                <textarea
                  rows="2"
                  placeholder="Catatan bila ada uang rusak, selisih kembalian, dll..."
                  value={shiftNotes}
                  onChange={(e) => setShiftNotes(e.target.value)}
                  className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 border border-stone-300 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  {loading ? 'Menyimpan...' : 'Tutup Shift Sekarang'}
                </button>
              </div>
            </form>
          )}

          {tab === 'movement' && (
            <form onSubmit={handleAddMovement} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMovementType('IN')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    movementType === 'IN'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20'
                      : 'bg-stone-50 text-stone-600 border-stone-200'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                  Kas Masuk (In)
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType('OUT')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    movementType === 'OUT'
                      ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/20'
                      : 'bg-stone-50 text-stone-600 border-stone-200'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 text-rose-600" />
                  Kas Keluar (Out)
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nominal (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="500"
                  step="500"
                  required
                  placeholder="Contoh: 50000"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl font-mono text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Alasan / Keterangan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beli lakban & kantong kresek darurat"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                {loading ? 'Menyimpan...' : 'Simpan Pergerakan Kas'}
              </button>
            </form>
          )}
        </div>
      ) : (
        /* Open Shift Form */
        <form onSubmit={handleOpenShift} className="space-y-4">
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 leading-relaxed">
            Belum ada shift kasir yang aktif. Masukkan saldo uang tunai modal awal di laci kasir untuk mulai transaksi.
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Modal Awal Laci Kasir (Rp) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              required
              placeholder="Contoh: 200000"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl font-mono text-base font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-[11px] text-stone-500 mt-1">Uang kembalian yang disiapkan di awal hari.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Keterangan Shift (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Shift Pagi Kasir Toko Camilan"
              value={shiftNotes}
              onChange={(e) => setShiftNotes(e.target.value)}
              className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-stone-300 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              {loading ? 'Membuka...' : 'Buka Shift Kasir'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
