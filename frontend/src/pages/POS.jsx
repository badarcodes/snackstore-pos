import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Printer,
  Sparkles
} from 'lucide-react';
import { posAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ThermalReceipt from '../components/ThermalReceipt';
import Modal from '../components/Modal';

export default function POS() {
  const { user, showToast, activeSession } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Cart state: [ { product, qty } ]
  const [cart, setCart] = useState([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [notes, setNotes] = useState('');

  // Transaction submission & receipt modal
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const searchInputRef = useRef(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await posAPI.getProducts();
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (err) {
      showToast('Gagal memuat katalog produk', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  // Categories list
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category?.name).filter(Boolean)))];

  // Filtered products
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || p.category?.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Cart operations
  const addToCart = (product) => {
    if (product.stock <= 0) {
      showToast(`Stok ${product.name} telah habis!`, 'error');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.qty + 1 > product.stock) {
          showToast(`Stok hanya tersisa ${product.stock} ${product.unit}`, 'error');
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (productId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.qty + delta;
          if (newQty <= 0) return null;
          if (newQty > item.product.stock) {
            showToast(`Stok hanya tersisa ${item.product.stock} ${item.product.unit}`, 'error');
            return item;
          }
          return { ...item, qty: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setCashReceived('');
    setNotes('');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.product.sellingPrice) * item.qty), 0);
  const discount = Math.min(Number(discountAmount) || 0, subtotal);
  const total = Math.max(0, subtotal - discount);

  // Change amount
  const numericCashReceived = Number(cashReceived) || 0;
  const changeAmount = paymentMethod === 'CASH' ? Math.max(0, numericCashReceived - total) : 0;
  const isCashInsufficient = paymentMethod === 'CASH' && numericCashReceived < total;

  // Preset cash buttons
  const setQuickCash = (amount) => {
    setCashReceived(String(amount));
  };

  // Checkout submission
  const handleCheckout = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      showToast('Keranjang belanja masih kosong', 'error');
      return;
    }

    if (paymentMethod === 'CASH' && numericCashReceived < total) {
      showToast(`Uang tunai kurang Rp ${(total - numericCashReceived).toLocaleString('id-ID')}`, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        items: cart.map(item => ({
          productId: item.product.id,
          qty: item.qty
        })),
        discountAmount: discount,
        paymentMethod,
        cashReceived: paymentMethod === 'CASH' ? numericCashReceived : total,
        notes
      };

      const res = await posAPI.checkout(payload);
      if (res.data.success) {
        setCompletedSale(res.data.sale);
        setIsReceiptOpen(true);
        clearCart();
        fetchProducts(); // Refresh stocks
        showToast('Transaksi berhasil disimpan!', 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal memproses transaksi', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT: Product Catalog (7 cols on lg) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Search & Category Header */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Cari camilan berdasarkan nama atau SKU (misal: Makaroni, Basreng, BSR-DJ-100)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium transition-all"
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-snack-950 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat === 'all' ? 'Semua Kategori' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {loading ? (
            <div className="col-span-full py-16 text-center text-xs text-stone-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-600" />
              Memuat katalog camilan...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full py-16 text-center text-xs text-stone-400">
              Tidak ada produk camilan yang cocok dengan pencarian.
            </div>
          ) : (
            filteredProducts.map((prod) => {
              const isOutOfStock = prod.stock <= 0;
              return (
                <div
                  key={prod.id}
                  onClick={() => !isOutOfStock && addToCart(prod)}
                  className={`bg-white rounded-2xl border p-3 flex flex-col justify-between transition-all select-none ${
                    isOutOfStock
                      ? 'border-stone-200 opacity-60 cursor-not-allowed'
                      : 'border-stone-200/80 hover:border-amber-400 hover:shadow-md cursor-pointer active:scale-98'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono font-semibold text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded">
                        {prod.sku}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isOutOfStock
                          ? 'bg-rose-100 text-rose-800'
                          : prod.stock <= prod.minStock
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-50 text-emerald-800'
                      }`}>
                        {isOutOfStock ? 'Habis' : `Stok: ${prod.stock}`}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-stone-900 leading-snug line-clamp-2 mt-1">
                      {prod.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-extrabold font-mono text-amber-700">
                      {formatIDR(prod.sellingPrice)}
                    </span>
                    <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                      +
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Cart & Checkout Drawer (5 cols on lg) */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200/80 shadow-sm p-5 space-y-4 sticky top-20">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-stone-900">Keranjang Kasir</h3>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
            >
              Kosongkan Keranjang
            </button>
          )}
        </div>

        {/* Cart Item List */}
        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          {cart.length === 0 ? (
            <div className="text-center py-10 text-stone-400 text-xs">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Keranjang masih kosong. Klik camilan di sebelah kiri untuk menambahkan.
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-100"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="text-xs font-bold text-stone-900 truncate">
                    {item.product.name}
                  </div>
                  <div className="text-[11px] text-stone-500 font-mono">
                    {formatIDR(item.product.sellingPrice)} x {item.qty} = <span className="font-bold text-stone-800">{formatIDR(item.product.sellingPrice * item.qty)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => updateQty(item.product.id, -1)}
                    className="w-6 h-6 rounded-lg bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 flex items-center justify-center font-bold text-xs"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center font-mono text-xs font-bold text-stone-900">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.product.id, 1)}
                    className="w-6 h-6 rounded-lg bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 flex items-center justify-center font-bold text-xs"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-stone-400 hover:text-rose-600 transition-colors ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pricing Subtotal, Discount & Total */}
        <div className="pt-3 border-t border-stone-100 space-y-2 text-xs">
          <div className="flex justify-between text-stone-600">
            <span>Subtotal Belanja:</span>
            <span className="font-mono font-semibold">{formatIDR(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-stone-600">Diskon (Rp):</span>
            <input
              type="number"
              min="0"
              max={subtotal}
              placeholder="0"
              value={discountAmount || ''}
              onChange={(e) => setDiscountAmount(Number(e.target.value))}
              className="w-24 px-2 py-1 border border-stone-300 rounded-lg text-right font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex justify-between text-base font-extrabold text-stone-950 pt-2 border-t border-stone-200">
            <span>Total Tagihan:</span>
            <span className="font-mono text-lg text-amber-800">{formatIDR(total)}</span>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider">
            Metode Pembayaran
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'CASH', label: 'Tunai', icon: Banknote },
              { id: 'QRIS', label: 'QRIS', icon: QrCode },
              { id: 'TRANSFER', label: 'Transfer', icon: CreditCard }
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = paymentMethod === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cash Input & Auto Change (if Tunai) */}
        {paymentMethod === 'CASH' && (
          <div className="space-y-2 pt-2 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Uang Diterima dari Pelanggan (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="500"
                placeholder="Contoh: 50000"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Quick Cash Presets */}
            <div className="flex gap-1.5 flex-wrap">
              {[total, 20000, 50000, 100000].map((amt) => {
                if (amt < total && amt !== total) return null;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setQuickCash(amt)}
                    className="px-2 py-1 bg-white border border-amber-300 rounded-lg text-[10px] font-mono font-bold text-amber-900 hover:bg-amber-100"
                  >
                    {amt === total ? 'Uang Pas' : formatIDR(amt)}
                  </button>
                );
              })}
            </div>

            {/* Change Display */}
            {cashReceived !== '' && (
              <div className={`p-2.5 rounded-xl flex items-center justify-between font-mono text-xs font-bold ${
                isCashInsufficient
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-emerald-100 text-emerald-900'
              }`}>
                <span>{isCashInsufficient ? 'Kurang:' : 'Kembalian:'}</span>
                <span className="text-sm">
                  {isCashInsufficient
                    ? formatIDR(total - numericCashReceived)
                    : formatIDR(changeAmount)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <input
            type="text"
            placeholder="Catatan transaksi (opsional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-1.5 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Submit Transaction Button */}
        <button
          onClick={handleCheckout}
          disabled={cart.length === 0 || isSubmitting || isCashInsufficient}
          className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <span>Menyimpan Transaksi...</span>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan & Bayar ({formatIDR(total)})</span>
            </>
          )}
        </button>
      </div>

      {/* Printable Receipt Modal */}
      <Modal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        title="Struk Pembayaran Transaksi"
        maxWidth="max-w-sm"
      >
        <ThermalReceipt
          sale={completedSale}
          onClose={() => setIsReceiptOpen(false)}
        />
      </Modal>
    </div>
  );
}
