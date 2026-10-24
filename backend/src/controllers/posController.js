const { z } = require('zod');
const prisma = require('../config/db');
const { generateInvoiceNumber } = require('../utils/helpers');
const { logAudit } = require('../utils/audit');

const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.coerce.number().int().positive(),
    qty: z.coerce.number().int().positive('Jumlah barang harus minimal 1')
  })).min(1, 'Keranjang belanja tidak boleh kosong'),
  discountAmount: z.coerce.number().min(0).default(0),
  paymentMethod: z.enum(['CASH', 'QRIS', 'TRANSFER']),
  cashReceived: z.coerce.number().min(0),
  notes: z.string().optional()
});

/**
 * Get active products for POS catalog
 */
async function getPOSProducts(req, res, next) {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: { select: { id: true, name: true, slug: true } }
      },
      orderBy: { name: 'asc' }
    });

    return res.json({ success: true, products });
  } catch (error) {
    next(error);
  }
}

/**
 * Process Sale / Checkout transactionally
 */
async function processCheckout(req, res, next) {
  try {
    const data = checkoutSchema.parse(req.body);
    const cashierId = req.user.id;

    const invoiceNumber = generateInvoiceNumber();

    // Execute everything in a single atomic database transaction
    const saleResult = await prisma.$transaction(async (tx) => {
      let calculatedTotal = 0;
      let calculatedTotalProfit = 0;
      const verifiedItems = [];

      // 1. Fetch and validate each product from DB (Single Source of Truth)
      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) {
          throw new Error(`Produk dengan ID #${item.productId} tidak ditemukan.`);
        }

        if (!product.isActive) {
          throw new Error(`Produk '${product.name}' sedang nonaktif dan tidak dapat dijual.`);
        }

        if (product.stock < item.qty) {
          throw new Error(
            `Stok '${product.name}' tidak mencukupi! Tersedia: ${product.stock} ${product.unit}, diminta: ${item.qty} ${product.unit}.`
          );
        }

        const unitPrice = Number(product.sellingPrice);
        const unitCost = Number(product.costPrice);
        const subtotal = unitPrice * item.qty;
        const profit = subtotal - (unitCost * item.qty);

        calculatedTotal += subtotal;
        calculatedTotalProfit += profit;

        verifiedItems.push({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          unitCost,
          unitPrice,
          qty: item.qty,
          subtotal,
          profit,
          currentStock: product.stock,
          unit: product.unit
        });
      }

      // 2. Validate discount and compute final amount
      const discount = Math.min(data.discountAmount, calculatedTotal);
      const finalAmount = calculatedTotal - discount;

      // 3. Validate payment
      let cashReceived = Number(data.cashReceived);
      let changeAmount = 0;

      if (data.paymentMethod === 'CASH') {
        if (cashReceived < finalAmount) {
          throw new Error(
            `Uang tunai yang diterima (Rp ${cashReceived.toLocaleString('id-ID')}) kurang dari total belanja (Rp ${finalAmount.toLocaleString('id-ID')}).`
          );
        }
        changeAmount = cashReceived - finalAmount;
      } else {
        // For QRIS and TRANSFER, cash received is exactly the final amount
        cashReceived = finalAmount;
        changeAmount = 0;
      }

      // 4. Create Sale Record
      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          cashierId,
          totalAmount: calculatedTotal,
          discountAmount: discount,
          finalAmount,
          paymentMethod: data.paymentMethod,
          cashReceived,
          changeAmount,
          status: 'COMPLETED',
          notes: data.notes ? data.notes.trim() : null
        }
      });

      // 5. Create Sale Items and update stocks
      for (const item of verifiedItems) {
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            unitCost: item.unitCost,
            unitPrice: item.unitPrice,
            qty: item.qty,
            subtotal: item.subtotal,
            profit: item.profit
          }
        });

        // Decrement product stock
        const newStock = item.currentStock - item.qty;
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: newStock }
        });

        // Record stock movement
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'SALE',
            qtyBefore: item.currentStock,
            qtyChange: -item.qty,
            qtyAfter: newStock,
            reason: `Penjualan kasir (${invoiceNumber})`,
            userId: cashierId,
            refType: 'SALE',
            refId: invoiceNumber
          }
        });
      }

      // 6. Record Payment
      await tx.payment.create({
        data: {
          saleId: sale.id,
          paymentMethod: data.paymentMethod,
          amount: finalAmount,
          status: 'COMPLETED'
        }
      });

      return {
        sale,
        items: verifiedItems,
        calculatedTotal,
        discount,
        finalAmount,
        cashReceived,
        changeAmount
      };
    });

    // Record audit
    await logAudit({
      userId: req.user.id,
      action: 'SALE_CREATE',
      entity: 'SALE',
      entityId: String(saleResult.sale.id),
      details: `Sale ${invoiceNumber} created by ${req.user.name}. Total: Rp ${saleResult.finalAmount}, Method: ${data.paymentMethod}`,
      ipAddress: req.ip
    });

    // Fetch complete sale for response & receipt printing
    const completeSale = await prisma.sale.findUnique({
      where: { id: saleResult.sale.id },
      include: {
        cashier: { select: { id: true, name: true, username: true } },
        items: true,
        payments: true
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Transaksi berhasil disimpan.',
      sale: completeSale
    });
  } catch (error) {
    if (error.message.includes('Stok') || error.message.includes('Uang tunai') || error.message.includes('tidak ditemukan')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
}

module.exports = {
  getPOSProducts,
  processCheckout
};
