const { z } = require('zod');
const prisma = require('../config/db');
const { logAudit } = require('../utils/audit');

const adjustStockSchema = z.object({
  productId: z.coerce.number().int().positive(),
  type: z.enum(['ADJUSTMENT', 'PURCHASE', 'DAMAGE', 'EXPIRED']),
  qtyChange: z.coerce.number().int(), // Positive for stock in, negative for reduction, or absolute difference
  reason: z.string().min(3, 'Alasan penyesuaian stok wajib diisi minimal 3 karakter')
});

const purchaseStockSchema = z.object({
  supplierId: z.coerce.number().int().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.coerce.number().int().positive(),
    qty: z.coerce.number().int().positive('Jumlah harus lebih dari 0'),
    unitCost: z.coerce.number().min(0, 'Harga modal beli tidak boleh negatif')
  })).min(1, 'Minimal satu barang pembelian')
});

/**
 * Get current stock overview with low stock & out-of-stock highlights
 */
async function getStockOverview(req, res, next) {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: { select: { id: true, name: true } }
      },
      orderBy: { stock: 'asc' }
    });

    const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock);
    const outOfStock = products.filter(p => p.stock <= 0);

    return res.json({
      success: true,
      totalProducts: products.length,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      products,
      lowStock,
      outOfStock
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Adjust stock manually with mandatory reason and transactional log
 */
async function adjustStock(req, res, next) {
  try {
    const { productId, type, qtyChange, reason } = adjustStockSchema.parse(req.body);

    if (qtyChange === 0) {
      return res.status(400).json({
        success: false,
        message: 'Perubahan jumlah stok tidak boleh 0.'
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        throw new Error('Produk tidak ditemukan.');
      }

      const qtyBefore = product.stock;
      const qtyAfter = qtyBefore + qtyChange;

      if (qtyAfter < 0) {
        throw new Error(`Stok tidak mencukupi. Stok saat ini: ${qtyBefore}, perubahan: ${qtyChange}. Stok tidak boleh negatif.`);
      }

      // Update product stock
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { stock: qtyAfter }
      });

      // Record stock movement
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          type,
          qtyBefore,
          qtyChange,
          qtyAfter,
          reason: reason.trim(),
          userId: req.user.id,
          refType: 'MANUAL_ADJUSTMENT'
        }
      });

      return { product: updatedProduct, movement };
    });

    await logAudit({
      userId: req.user.id,
      action: 'STOCK_ADJUSTMENT',
      entity: 'STOCK',
      entityId: String(productId),
      details: `${type} for ${result.product.name}: ${qtyChange > 0 ? '+' : ''}${qtyChange} (Before: ${result.movement.qtyBefore}, After: ${result.movement.qtyAfter}). Reason: ${reason}`,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: 'Penyesuaian stok berhasil disimpan.',
      data: result
    });
  } catch (error) {
    if (error.message.includes('Stok tidak boleh negatif') || error.message.includes('Produk tidak ditemukan')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
}

/**
 * Record stock purchase from supplier (Goods In / Pembelian Barang)
 */
async function recordPurchase(req, res, next) {
  try {
    const data = purchaseStockSchema.parse(req.body);

    const now = new Date();
    const invoiceNumber = `PO-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;

      // Calculate total
      for (const item of data.items) {
        totalAmount += item.qty * item.unitCost;
      }

      // 1. Create Purchase
      const purchase = await tx.purchase.create({
        data: {
          invoiceNumber,
          supplierId: data.supplierId || null,
          totalAmount,
          notes: data.notes ? data.notes.trim() : null,
          userId: req.user.id
        }
      });

      // 2. Process each item, update stock, create purchase_item, record movement
      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) {
          throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
        }

        const subtotal = item.qty * item.unitCost;

        await tx.purchaseItem.create({
          data: {
            purchaseId: purchase.id,
            productId: item.productId,
            qty: item.qty,
            unitCost: item.unitCost,
            subtotal
          }
        });

        const qtyBefore = product.stock;
        const qtyAfter = qtyBefore + item.qty;

        // Update product stock and optionally cost price
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: qtyAfter,
            costPrice: item.unitCost // Update cost price to latest purchase cost
          }
        });

        // Record stock movement
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'PURCHASE',
            qtyBefore,
            qtyChange: item.qty,
            qtyAfter,
            reason: `Pembelian stok (${invoiceNumber})`,
            userId: req.user.id,
            refType: 'PURCHASE',
            refId: invoiceNumber
          }
        });
      }

      return purchase;
    });

    await logAudit({
      userId: req.user.id,
      action: 'STOCK_PURCHASE',
      entity: 'PURCHASE',
      entityId: String(result.id),
      details: `Recorded purchase ${invoiceNumber} for total Rp ${result.totalAmount}`,
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Pencatatan pembelian stok berhasil disimpan.',
      purchase: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get stock movements history with filters
 */
async function getStockMovements(req, res, next) {
  try {
    const { productId, categoryId, type, startDate, endDate } = req.query;

    const where = {};

    if (productId && productId !== 'all') {
      where.productId = parseInt(productId);
    }

    if (categoryId && categoryId !== 'all') {
      where.product = { categoryId: parseInt(categoryId) };
    }

    if (type && type !== 'all') {
      where.type = type;
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

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true, sku: true, unit: true, category: { select: { name: true } } }
        },
        user: {
          select: { id: true, name: true, username: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    });

    return res.json({
      success: true,
      count: movements.length,
      movements
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get suppliers list
 */
async function getSuppliers(req, res, next) {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' }
    });
    return res.json({ success: true, suppliers });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStockOverview,
  adjustStock,
  recordPurchase,
  getStockMovements,
  getSuppliers
};
