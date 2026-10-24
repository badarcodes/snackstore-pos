/**
 * Generate unique Sale Invoice Number: TRX-YYYYMMDD-XXXX
 */
function generateInvoiceNumber() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TRX-${yyyy}${mm}${dd}-${random}`;
}

/**
 * Generate unique Expense Number: EXP-YYYYMMDD-XXXX
 */
function generateExpenseNumber() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `EXP-${yyyy}${mm}${dd}-${random}`;
}

/**
 * Generate unique Income Entry Number: INC-YYYYMMDD-XXXX
 */
function generateIncomeNumber() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INC-${yyyy}${mm}${dd}-${random}`;
}

/**
 * Format currency to IDR
 */
function formatRupiah(number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(number);
}

module.exports = {
  generateInvoiceNumber,
  generateExpenseNumber,
  generateIncomeNumber,
  formatRupiah
};
