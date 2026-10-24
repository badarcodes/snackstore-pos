import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  Boxes,
  Activity,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';
import { reportAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Reports() {
  const { user, showToast } = useAuth();
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' | 'valuation' | 'audit'

  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Report states
  const [salesReport, setSalesReport] = useState(null);
  const [stockValuation, setStockValuation] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSalesReport = async () => {
    setLoading(true);
    try {
      const res = await reportAPI.getSales({ startDate, endDate });
      if (res.data.success) {
        setSalesReport(res.data);
      }
    } catch {
      showToast('Gagal memuat laporan penjualan', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStockValuation = async () => {
    setLoading(true);
    try {
      const res = await reportAPI.getStockValuation();
      if (res.data.success) {
        setStockValuation(res.data);
      }
    } catch {
      showToast('Gagal memuat valuasi stok', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await reportAPI.getAuditLogs({ startDate, endDate });
      if (res.data.success) {
        setAuditLogs(res.data.logs);
      }
    } catch {
      showToast('Gagal memuat audit log', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'sales') fetchSalesReport();
    else if (activeTab === 'valuation') fetchStockValuation();
    else if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab]);

  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  // CSV Exporter
  const exportToCSV = () => {
    if (activeTab === 'sales' && salesReport?.sales) {
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'No. Invoice,Tanggal,Kasir,Total,Diskon,Final,Metode\n';
      salesReport.sales.forEach(s => {
        csvContent += `"${s.invoiceNumber}","${s.createdAt}","${s.cashier?.name}",${s.totalAmount},${s.discountAmount},${s.finalAmount},"${s.paymentMethod}"\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `laporan-penjualan-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (activeTab === 'valuation' && stockValuation?.inventory) {
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'SKU,Nama Produk,Kategori,Stok,Satuan,HPP Modal,Harga Jual,Total Nilai Modal,Total Nilai Jual\n';
      stockValuation.inventory.forEach(p => {
        csvContent += `"${p.sku}","${p.name}","${p.category}",${p.stock},"${p.unit}",${p.costPrice},${p.sellingPrice},${p.valueAtCost},${p.valueAtRetail}\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `laporan-stok-valuasi-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Laporan Keuangan & Analisis Toko</h2>
          <p className="text-xs text-stone-500">
            Laporan laba kotor, perbandingan omzet vs HPP modal, valuasi persediaan, dan log aktivitas.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor CSV (Excel)</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Halaman</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-stone-200 gap-4">
        <button
          onClick={() => setActiveTab('sales')}
          className={`pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'sales'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Laporan Penjualan & Laba Kotor
        </button>
        <button
          onClick={() => setActiveTab('valuation')}
          className={`pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'valuation'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Laporan Valuasi Aset Stok
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'audit'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Catatan Aktivitas Pengguna (Audit)
        </button>
      </div>

      {/* Date Filter Bar (for Sales and Audit) */}
      {(activeTab === 'sales' || activeTab === 'audit') && (
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-2 flex-wrap text-xs">
          <Calendar className="w-4 h-4 text-stone-400" />
          <span className="font-semibold text-stone-700">Periode:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 border border-stone-200 rounded-xl"
          />
          <span className="text-stone-400">sampai</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 border border-stone-200 rounded-xl"
          />
          <button
            onClick={activeTab === 'sales' ? fetchSalesReport : fetchAuditLogs}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-colors cursor-pointer"
          >
            Terapkan Filter
          </button>
        </div>
      )}

      {/* TAB 1: Sales & Gross Profit Report */}
      {activeTab === 'sales' && (
        <div className="space-y-4">
          {salesReport?.summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Total Omzet Penjualan</span>
                <div className="text-xl font-extrabold font-mono text-stone-900 mt-1">
                  {formatIDR(salesReport.summary.totalRevenue)}
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">{salesReport.summary.transactionCount} Transaksi Selesai</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Total HPP Barang Terjual</span>
                <div className="text-xl font-extrabold font-mono text-stone-700 mt-1">
                  {formatIDR(salesReport.summary.totalCOGS)}
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">Harga Pokok Penjualan modal</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Laba Kotor Toko</span>
                <div className="text-xl font-extrabold font-mono text-emerald-700 mt-1">
                  {formatIDR(salesReport.summary.totalGrossProfit)}
                </div>
                <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                  Margin: {salesReport.summary.profitMargin}%
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
                <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">Potongan Diskon</span>
                <div className="text-xl font-extrabold font-mono text-rose-700 mt-1">
                  {formatIDR(salesReport.summary.totalDiscount)}
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">Diskon kasir yang diberikan</div>
              </div>
            </div>
          )}

          {/* Sales Breakdown Table */}
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50/80 border-b border-stone-200/80 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">No. Invoice</th>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Kasir</th>
                    <th className="py-3 px-4 text-right">Subtotal</th>
                    <th className="py-3 px-4 text-right">Diskon</th>
                    <th className="py-3 px-4 text-right">Total Akhir</th>
                    <th className="py-3 px-4 text-center">Metode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {salesReport?.sales?.map((sale) => (
                    <tr key={sale.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">{sale.invoiceNumber}</td>
                      <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                        {new Date(sale.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-stone-800">{sale.cashier?.name}</td>
                      <td className="py-3 px-4 text-right font-mono text-stone-600">{formatIDR(sale.totalAmount)}</td>
                      <td className="py-3 px-4 text-right font-mono text-rose-600">{formatIDR(sale.discountAmount)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">{formatIDR(sale.finalAmount)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-[10px] uppercase text-stone-600">{sale.paymentMethod}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Inventory Valuation Report */}
      {activeTab === 'valuation' && (
        <div className="space-y-4">
          {stockValuation?.summary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Total Nilai Aset (Harga Modal HPP)</span>
                <div className="text-xl font-extrabold font-mono text-stone-800 mt-1">
                  {formatIDR(stockValuation.summary.totalAssetAtCost)}
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">Dari {stockValuation.summary.totalStockQty} total bungkus stok</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
                <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Total Nilai Eceran (Harga Jual)</span>
                <div className="text-xl font-extrabold font-mono text-amber-800 mt-1">
                  {formatIDR(stockValuation.summary.totalAssetAtRetail)}
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">Jika seluruh stok toko terjual</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Potensi Laba Kotor</span>
                <div className="text-xl font-extrabold font-mono text-emerald-700 mt-1">
                  {formatIDR(stockValuation.summary.totalPotentialProfit)}
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">Nilai jual dikurangi modal</div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50/80 border-b border-stone-200/80 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">SKU & Produk</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4 text-center">Stok</th>
                    <th className="py-3 px-4 text-right">Modal / Unit</th>
                    <th className="py-3 px-4 text-right">Jual / Unit</th>
                    <th className="py-3 px-4 text-right">Total Nilai Modal</th>
                    <th className="py-3 px-4 text-right">Total Nilai Jual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {stockValuation?.inventory?.map((p) => (
                    <tr key={p.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900">{p.name}</div>
                        <div className="font-mono text-[10px] text-stone-400">SKU: {p.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-stone-600">{p.category}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-stone-800">
                        {p.stock} {p.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-stone-600">{formatIDR(p.costPrice)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">{formatIDR(p.sellingPrice)}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-stone-800">{formatIDR(p.valueAtCost)}</td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-amber-800">{formatIDR(p.valueAtRetail)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Audit Activity Logs Report */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200/80 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Pengguna</th>
                  <th className="py-3 px-4">Aksi</th>
                  <th className="py-3 px-4">Objek / Entitas</th>
                  <th className="py-3 px-4">Rincian Tindakan</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-stone-400">
                      Tidak ada catatan aktivitas.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3 px-4 font-bold text-stone-800 whitespace-nowrap">
                        {log.user?.name || 'Sistem'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 bg-stone-100 text-stone-800 rounded font-mono font-bold text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-stone-600">{log.entity}</td>
                      <td className="py-3 px-4 text-stone-800 max-w-sm">{log.details}</td>
                      <td className="py-3 px-4 font-mono text-[10px] text-stone-400">{log.ipAddress || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
