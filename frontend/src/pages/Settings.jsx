import React, { useState, useEffect } from 'react';
import { Store, Save, Printer, Database, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { settingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { storeSettings, refreshSettings, showToast } = useAuth();
  const [formData, setFormData] = useState({
    store_name: '',
    store_address: '',
    store_phone: '',
    store_receipt_footer: '',
    receipt_paper_width: '58mm'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (storeSettings) {
      setFormData({
        store_name: storeSettings.store_name || 'SnackStore Berkah Renyah',
        store_address: storeSettings.store_address || 'Jl. Camilan Gurih No. 88, Bandung',
        store_phone: storeSettings.store_phone || '0812-3456-7890',
        store_receipt_footer: storeSettings.store_receipt_footer || 'Terima kasih atas kunjungan Anda!\nCamilan Renyah Bikin Nagih.',
        receipt_paper_width: storeSettings.receipt_paper_width || '58mm'
      });
    }
  }, [storeSettings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await settingAPI.updateSettings(formData);
      if (res.data.success) {
        showToast('Pengaturan toko dan struk berhasil disimpan!', 'success');
        refreshSettings();
      }
    } catch {
      showToast('Gagal menyimpan pengaturan toko', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-lg font-bold text-stone-900">Pengaturan Toko & Printer Struk</h2>
        <p className="text-xs text-stone-500">
          Ubah identitas toko camilan, nomor kontak, catatan kaki struk kasir, dan ukuran kertas printer thermal.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identitas Toko */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
              <Store className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-stone-900">Profil & Identitas Toko Camilan</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Nama Toko Camilan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.store_name}
                onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Nomor Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={formData.store_phone}
                onChange={(e) => setFormData({ ...formData, store_phone: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Alamat Lengkap Toko <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows="2"
              value={formData.store_address}
              onChange={(e) => setFormData({ ...formData, store_address: e.target.value })}
              className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Konfigurasi Printer Struk Thermal */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
              <Printer className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-stone-900">Format Printer Thermal & Catatan Struk</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Lebar Kertas Printer Thermal
              </label>
              <select
                value={formData.receipt_paper_width}
                onChange={(e) => setFormData({ ...formData, receipt_paper_width: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="58mm">58 mm (Printer Kasir Mini Thermal)</option>
                <option value="80mm">80 mm (Printer Kasir Standard Thermal)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Pesan / Catatan Kaki Struk (Footer)
            </label>
            <textarea
              rows="3"
              value={formData.store_receipt_footer}
              onChange={(e) => setFormData({ ...formData, store_receipt_footer: e.target.value })}
              className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Database & System Info */}
        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs text-stone-600 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="font-bold text-stone-900">Database MySQL Aktif (Prisma ORM)</div>
              <div className="text-[11px] text-stone-500">snackstore_pos @ 127.0.0.1:3306</div>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[10px]">
            Terhubung
          </span>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan Pengaturan'}</span>
        </button>
      </form>
    </div>
  );
}
