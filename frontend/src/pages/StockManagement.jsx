import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  History,
  Search,
  Filter,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import { stockAPI, productAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function StockManagement() {
  const { user, showToast } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [overview, setOverview] = useState(null);
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab: 'overview' | 'movements'
  const [activeTab, setActiveTab] = useState('overview');

  // Movement filter
  const [movementType, setMovementType] = useState('all');

  // Manual Adjustment Modal state
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustType, setAdjustType] = useState('ADJUSTMENT');
  const [qtyChange, setQtyChange] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  // Purchase / Goods In Modal state
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseSupplierId, setPurchaseSupplierId] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([
    { productId: '', qty: 10, unitCost: 6000 }
  ]);
  const [submittingPurchase, setSubmittingPurchase] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewRes, movRes, prodRes, supRes] = await Promise.all([
        stockAPI.getOverview(),
        stockAPI.getMovements({ type: movementType }),
        productAPI.getAll({ status: 'active' }),
        stockAPI.getSuppliers()
      ]);

      if (overviewRes.data.success) setOverview(overviewRes.data);
      if (movRes.data.success) setMovements(movRes.data.movements);
      if (prodRes.data.success) setProducts(prodRes.data.products);
      if (supRes.data.success) setSuppliers(supRes.data.suppliers);
    } catch (err) {
      showToast('Gagal memuat data stok', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [movementType]);

  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  // Open adjustment modal for a specific product
  const openAdjustment = (prod) => {
    setSelectedProduct(prod);
    setAdjustType('ADJUSTMENT');
    setQtyChange('');
    setAdjustReason('');
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!qtyChange || Number(qtyChange) === 0) {
      showToast('Perubahan stok tidak boleh 0', 'error');
      return;
    }
    if (!adjustReason.trim() || adjustReason.trim().length < 3) {
      showToast('Alasan penyesuaian stok wajib diisi minimal 3 karakter', 'error');
      return;
    }

    setSubmittingAdjust(true);
    try {
      const res = await stockAPI.adjust({
        productId: selectedProduct.id,
        type: adjustType,
        qtyChange: Number(qtyChange),
        reason: adjustReason
      });

      if (res.data.success) {
        showToast('Penyesuaian stok berhasil disimpan!', 'success');
        setIsAdjustModalOpen(false);
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menyesuaikan stok', 'error');
    } finally {
      setSubmittingAdjust(false);
    }
  };

  // Purchase items handling
  const addPurchaseRow = () => {
    setPurchaseItems([...purchaseItems, { productId: '', qty: 10, unitCost: 5000 }]);
  };

  const updatePurchaseRow = (idx, field, value) => {
    setPurchaseItems(prev => {
      const copy = [...prev];
      copy[idx][field] = value;
      // Auto fill cost price if productId selected
      if (field === 'productId') {
        const prod = products.find(p => p.id === Number(value));
        if (prod) copy[idx].unitCost = Number(prod.costPrice);
      }
      return copy;
    });
  };

  const removePurchaseRow = (idx) => {
    if (purchaseItems.length === 1) return;
    setPurchaseItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    const validItems = purchaseItems.filter(item => item.productId && Number(item.qty) > 0);
    if (validItems.length === 0) {
      showToast('Pilih minimal satu produk dan jumlah beli yang valid', 'error');
      return;
    }

    setSubmittingPurchase(true);
    try {
      const res = await stockAPI.purchase({
        supplierId: purchaseSupplierId ? Number(purchaseSupplierId) : undefined,
        notes: purchaseNotes,
        items: validItems.map(item => ({
          productId: Number(item.productId),
          qty: Number(item.qty),
          unitCost: Number(item.unitCost)
        }))
      });

      if (res.data.success) {
        showToast('Pembelian stok berhasil dicatat!', 'success');
        setIsPurchaseModalOpen(false);
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal mencatat pembelian stok', 'error');
    } finally {
      setSubmittingPurchase(false);
    }
  };

  const typeBadges = {
    INITIAL: 'bg-stone-100 text-stone-700',
    PURCHASE: 'bg-emerald-100 text-emerald-800',
    SALE: 'bg-amber-100 text-amber-800',
    ADJUSTMENT: 'bg-blue-100 text-blue-800',
    DAMAGE: 'bg-rose-100 text-rose-800',
    EXPIRED: 'bg-purple-100 text-purple-800',
    RETURN: 'bg-teal-100 text-teal-800'
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Manajemen Stok Camilan</h2>
          <p className="text-xs text-stone-500">
            Monitoring stok barang, catat barang masuk, dan penyesuaian stok rusak/kedaluwarsa.
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => {
                setPurchaseItems([{ productId: products[0]?.id || '', qty: 10, unitCost: 6000 }]);
                setIsPurchaseModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Barang Masuk / Beli Stok</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Total Item Produk</span>
            <h3 className="text-xl font-extrabold text-stone-900 font-mono mt-1">
              {overview?.totalProducts || 0}
            </h3>
          </div>
          <div className="p-2.5 bg-stone-100 rounded-xl text-stone-700">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Stok Menipis</span>
            <h3 className="text-xl font-extrabold text-amber-700 font-mono mt-1">
              {overview?.lowStockCount || 0}
            </h3>
          </div>
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Stok Habis</span>
            <h3 className="text-xl font-extrabold text-rose-700 font-mono mt-1">
              {overview?.outOfStockCount || 0}
            </h3>
          </div>
          <div className="p-2.5 bg-rose-50 rounded-xl text-rose-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-stone-200 gap-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Daftar Stok Produk
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'movements'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Riwayat Pergerakan Stok (Audit Mutasi)
        </button>
      </div>

      {/* TAB 1: Products Stock Table */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200/80 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">SKU & Nama Produk</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-center">Batas Minimum</th>
                  <th className="py-3 px-4 text-center">Stok Saat Ini</th>
                  <th className="py-3 px-4 text-center">Status Stok</th>
                  {isAdmin && <th className="py-3 px-4 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {overview?.products?.map((prod) => (
                  <tr key={prod.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900">{prod.name}</div>
                      <div className="font-mono text-[10px] text-stone-400">SKU: {prod.sku}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-stone-600 font-medium">{prod.category?.name}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-stone-500">
                      {prod.minStock} {prod.unit}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-extrabold text-sm text-stone-900">
                        {prod.stock} {prod.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        prod.stock <= 0
                          ? 'bg-rose-100 text-rose-800'
                          : prod.stock <= prod.minStock
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-50 text-emerald-800'
                      }`}>
                        {prod.stock <= 0 ? 'Habis' : prod.stock <= prod.minStock ? 'Menipis' : 'Aman'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => openAdjustment(prod)}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Sesuaikan Stok
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Stock Movements Audit Table */}
      {activeTab === 'movements' && (
        <div className="space-y-3">
          {/* Movement Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-semibold">Filter Jenis Mutasi:</span>
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
              className="px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Semua Mutasi</option>
              <option value="SALE">Penjualan Kasir</option>
              <option value="PURCHASE">Pembelian / Barang Masuk</option>
              <option value="ADJUSTMENT">Penyesuaian Manual</option>
              <option value="DAMAGE">Barang Rusak</option>
              <option value="EXPIRED">Kedaluwarsa</option>
              <option value="RETURN">Retur / Pembatalan</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50/80 border-b border-stone-200/80 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Produk</th>
                    <th className="py-3 px-4 text-center">Jenis Mutasi</th>
                    <th className="py-3 px-4 text-center">Sebelum</th>
                    <th className="py-3 px-4 text-center">Perubahan</th>
                    <th className="py-3 px-4 text-center">Sesudah</th>
                    <th className="py-3 px-4">Alasan / Referensi</th>
                    <th className="py-3 px-4">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-stone-400">
                        Tidak ada riwayat pergerakan stok.
                      </td>
                    </tr>
                  ) : (
                    movements.map((mov) => (
                      <tr key={mov.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                          {new Date(mov.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-900">{mov.product?.name}</div>
                          <div className="font-mono text-[10px] text-stone-400">SKU: {mov.product?.sku}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${typeBadges[mov.type] || 'bg-stone-100'}`}>
                            {mov.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-stone-500">
                          {mov.qtyBefore}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold">
                          <span className={mov.qtyChange > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {mov.qtyChange > 0 ? `+${mov.qtyChange}` : mov.qtyChange}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-stone-900">
                          {mov.qtyAfter}
                        </td>
                        <td className="py-3 px-4 text-stone-700 max-w-xs truncate">
                          {mov.reason}
                        </td>
                        <td className="py-3 px-4 text-stone-600 font-medium whitespace-nowrap">
                          {mov.user?.name}
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

      {/* Manual Stock Adjustment Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={`Penyesuaian Stok: ${selectedProduct?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
            Stok saat ini: <span className="font-mono font-bold text-sm">{selectedProduct?.stock} {selectedProduct?.unit}</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Jenis Penyesuaian
            </label>
            <select
              value={adjustType}
              onChange={(e) => setAdjustType(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ADJUSTMENT">Koreksi Stok Fisik (+ atau -)</option>
              <option value="DAMAGE">Barang Rusak (-)</option>
              <option value="EXPIRED">Kedaluwarsa (-)</option>
              <option value="PURCHASE">Barang Masuk (+)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Perubahan Jumlah Stok <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              placeholder="Gunakan tanda minus (-) untuk pengurangan, misal: -5"
              value={qtyChange}
              onChange={(e) => setQtyChange(e.target.value)}
              className="w-full px-3.5 py-2 border border-stone-300 rounded-xl font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Contoh: ketik <span className="font-mono text-emerald-600 font-bold">+10</span> jika bertambah, atau <span className="font-mono text-rose-600 font-bold">-3</span> jika berkurang.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Alasan Penyesuaian (Wajib Diisi) <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows="3"
              placeholder="Contoh: Kemasan basreng bocor digigit tikus, selisih stock opname bulanan..."
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="flex-1 py-2.5 px-4 border border-stone-300 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submittingAdjust}
              className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
            >
              {submittingAdjust ? 'Menyimpan...' : 'Simpan Penyesuaian'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Purchase / Goods In Modal */}
      <Modal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        title="Pencatatan Pembelian Stok (Barang Masuk)"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handlePurchaseSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Supplier (Opsional)
              </label>
              <select
                value={purchaseSupplierId}
                onChange={(e) => setPurchaseSupplierId(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Pilih Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Catatan Pembelian
              </label>
              <input
                type="text"
                placeholder="Contoh: Faktur No. 98122 supplier sentra Bandung"
                value={purchaseNotes}
                onChange={(e) => setPurchaseNotes(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-700">
              Daftar Barang yang Diterima
            </label>

            {purchaseItems.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-center bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                <select
                  required
                  value={item.productId}
                  onChange={(e) => updatePurchaseRow(idx, 'productId', e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                >
                  <option value="">Pilih Produk Camilan</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock})</option>
                  ))}
                </select>

                <div className="w-24">
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Qty"
                    value={item.qty}
                    onChange={(e) => updatePurchaseRow(idx, 'qty', e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-mono text-center"
                  />
                </div>

                <div className="w-32">
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    placeholder="Harga Modal"
                    value={item.unitCost}
                    onChange={(e) => updatePurchaseRow(idx, 'unitCost', e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-mono text-right"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removePurchaseRow(idx)}
                  className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg"
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addPurchaseRow}
              className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
            >
              + Tambah Baris Barang
            </button>
          </div>

          <div className="flex gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setIsPurchaseModalOpen(false)}
              className="flex-1 py-2.5 px-4 border border-stone-300 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submittingPurchase}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
            >
              {submittingPurchase ? 'Menyimpan...' : 'Simpan Pembelian Stok'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
