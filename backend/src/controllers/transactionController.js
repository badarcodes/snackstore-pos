const prisma = require('../config/db');
const { logAudit } = require('../utils/audit');

/**
 * Get transactions history with search, filters, pagination, and sales summary
 */
async function getTransactions(req, res, next) {
  try {
    const { search, cashierId, paymentMethod, status, startDate, endDate, page = 1, limit = 20 } = req.query;

    const where = {};

    if (search) {
      where.invoiceNumber = { contains: search };
    }

    if (cashierId && cashierId !== 'all') {
      where.cashierId = parseInt(cashierId);
    }

    if (paymentMethod && paymentMethod !== 'all') {
      where.paymentMethod = paymentMethod;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        where.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`);
      }
    }

    // Cashiers only see their own transactions unless Admin
    if (req.user.role === 'CASHIER') {
      where.cashierId = req.user.id;
    }

    const pageNum = parseInt(page);
    const take = parseInt(limit);
    const skip = (pageNum - 1) * take;

    const [totalCount, transactions, summary] = await Promise.all([
      prisma.sale.count({ where }),
      prisma.sale.findMany({
        where,
        include: {
          cashier: { select: { id: true, name: true, username: true } },
          cancelledBy: { select: { id: true, name: true } },
          _count: { select: { items: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.sale.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { finalAmount: true },
        _count: { id: true }
      })
    ]);

    return res.json({
      success: true,
      totalCount,
      totalPages: Math.ceil(totalCount / take),
      currentPage: pageNum,
      summary: {
        completedCount: summary._count.id,
        totalSales: summary._sum.finalAmount || 0
      },
      transactions
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single transaction detail by ID or invoice number
 */
async function getTransactionDetail(req, res, next) {
  try {
    const { id } = req.params;

    const sale = await prisma.sale.findFirst({
      where: {
        OR: [
          { id: isNaN(Number(id)) ? -1 : parseInt(id) },
          { invoiceNumber: id }
        ]
      },
      include: {
        cashier: { select: { id: true, name: true, username: true } },
        cancelledBy: { select: { id: true, name: true } },
        items: true,
        payments: true
      }
    });

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
    }

    return res.json({ success: true, sale });
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel / Void transaction with stock restoration and cash adjustment (Admin only)
 */
async function cancelTransaction(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { reason } = req.body;

    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Alasan pembatalan transaksi wajib diisi minimal 3 karakter.'
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!sale) {
        throw new Error('Transaksi tidak ditemukan.');
      }

      if (sale.status === 'CANCELLED') {
        throw new Error('Transaksi ini sudah berstatus dibatalkan sebelumnya.');
      }

      // 1. Mark sale as CANCELLED
      const updatedSale = await tx.sale.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason.trim(),
          cancelledById: req.user.id,
          cancelledAt: new Date()
        }
      });

      // 2. Restore stocks for each item
      for (const item of sale.items) {
        if (item.productId) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (product) {
            const qtyBefore = product.stock;
            const qtyAfter = qtyBefore + item.qty;

            await tx.product.update({
              where: { id: item.productId },
              data: { stock: qtyAfter }
            });

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                type: 'RETURN',
                qtyBefore,
                qtyChange: item.qty,
                qtyAfter,
                reason: `Pengembalian stok dari pembatalan transaksi ${sale.invoiceNumber}. Alasan: ${reason.trim()}`,
                userId: req.user.id,
                refType: 'SALE_CANCEL',
                refId: sale.invoiceNumber
              }
            });
          }
        }
      }

      // 3. If paid with CASH and linked to a cash session, adjust expected cash
      if (sale.paymentMethod === 'CASH' && sale.cashSessionId) {
        const session = await tx.cashSession.findUnique({
          where: { id: sale.cashSessionId }
        });

        if (session && session.status === 'OPEN') {
          const currentSales = Number(session.totalCashSales);
          const currentExpected = Number(session.expectedCash);
          const refundAmount = Number(sale.finalAmount);

          await tx.cashSession.update({
            where: { id: session.id },
            data: {
              totalCashSales: Math.max(0, currentSales - refundAmount),
              expectedCash: Math.max(0, currentExpected - refundAmount)
            }
          });

          await tx.cashMovement.create({
            data: {
              cashSessionId: session.id,
              type: 'OUT',
              amount: refundAmount,
              reason: `Koreksi kas pembatalan transaksi ${sale.invoiceNumber}`,
              userId: req.user.id
            }
          });
        }
      }

      return updatedSale;
    });

    await logAudit({
      userId: req.user.id,
      action: 'SALE_CANCEL',
      entity: 'SALE',
      entityId: String(id),
      details: `Transaction ${result.invoiceNumber} cancelled. Reason: ${reason}`,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: 'Transaksi berhasil dibatalkan dan stok produk telah dikembalikan.',
      sale: result
    });
  } catch (error) {
    if (error.message.includes('dibatalkan') || error.message.includes('tidak ditemukan')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
}

module.exports = {
  getTransactions,
  getTransactionDetail,
  cancelTransaction
};
