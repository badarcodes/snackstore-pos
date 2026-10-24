import React, { useRef } from 'react';
import { Printer, Download, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ThermalReceipt({ sale, onClose }) {
  const { storeSettings } = useAuth();
  const printRef = useRef(null);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  const paperWidth = storeSettings.receipt_paper_width || '58mm';
  const widthClass = paperWidth === '80mm' ? 'max-w-[320px]' : 'max-w-[260px]';

  return (
    <div className="flex flex-col items-center">
      {/* Top Action Bar (hidden on print) */}
      <div className="w-full flex items-center justify-between pb-4 mb-4 border-b border-stone-200 print:hidden">
        <div className="flex items-center gap-2 text-stone-600 text-xs font-semibold uppercase tracking-wider">
          <span>Format: {paperWidth}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Struk
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Printable Receipt Paper Container */}
      <div
        id="thermal-receipt-print-area"
        ref={printRef}
        className={`${widthClass} w-full bg-white text-stone-900 font-mono text-xs p-4 border border-stone-200 rounded-xl shadow-xs leading-tight`}
      >
        {/* Store Header */}
        <div className="text-center pb-2 border-b border-dashed border-stone-400">
          <div className="text-sm font-extrabold uppercase tracking-wide text-stone-950">
            {storeSettings.store_name || 'Toko Kue Jaya Baru'}
          </div>
          <div className="text-[11px] text-stone-600 mt-1 whitespace-pre-line">
            {storeSettings.store_address || 'Jl. Raya Kue Tradisional & Modern No. 88, Bandung'}
          </div>
          {storeSettings.store_phone && (
            <div className="text-[11px] text-stone-600">Telp: {storeSettings.store_phone}</div>
          )}
        </div>

        {/* Transaction Info */}
        <div className="py-2 border-b border-dashed border-stone-400 space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="text-stone-500">No. Transaksi:</span>
            <span className="font-bold text-stone-900">{sale.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Waktu:</span>
            <span>{new Date(sale.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Kasir:</span>
            <span>{sale.cashier?.name || sale.cashierName || 'Kasir'}</span>
          </div>
        </div>

        {/* Items List */}
        <div className="py-2 border-b border-dashed border-stone-400">
          <table className="w-full text-left text-[11px]">
            <tbody>
              {sale.items && sale.items.map((item, idx) => (
                <tr key={idx} className="align-top">
                  <td colSpan="3" className="pt-1.5 font-semibold text-stone-900">
                    {item.productName}
                    <div className="flex justify-between text-stone-600 font-normal pt-0.5">
                      <span>{item.qty} x {formatIDR(item.unitPrice)}</span>
                      <span className="font-semibold text-stone-900">{formatIDR(item.subtotal)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total Calculations */}
        <div className="py-2 border-b border-dashed border-stone-400 space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatIDR(sale.totalAmount)}</span>
          </div>
          {Number(sale.discountAmount) > 0 && (
            <div className="flex justify-between text-rose-600">
              <span>Diskon</span>
              <span>- {formatIDR(sale.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs font-extrabold text-stone-950 pt-1 border-t border-dotted border-stone-300">
            <span>TOTAL</span>
            <span>{formatIDR(sale.finalAmount)}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-stone-500">Metode Bayar:</span>
            <span className="font-semibold uppercase">{sale.paymentMethod}</span>
          </div>
          {sale.paymentMethod === 'CASH' && (
            <>
              <div className="flex justify-between">
                <span>Tunai Diterima</span>
                <span>{formatIDR(sale.cashReceived)}</span>
              </div>
              <div className="flex justify-between font-bold text-stone-950">
                <span>Kembalian</span>
                <span>{formatIDR(sale.changeAmount)}</span>
              </div>
            </>
          )}
        </div>

        {/* Footer Note */}
        <div className="pt-3 text-center text-[10px] text-stone-500 whitespace-pre-line leading-relaxed">
          {storeSettings.store_receipt_footer || 'Terima kasih atas kunjungan Anda!\nKue Lezat & Segar Setiap Hari.'}
        </div>
      </div>
    </div>
  );
}
