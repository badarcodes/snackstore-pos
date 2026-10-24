const { z } = require('zod');
const prisma = require('../config/db');
const { logAudit } = require('../utils/audit');

const productSchema = z.object({
  sku: z.string().min(1, 'SKU wajib diisi').max(50),
  name: z.string().min(2, 'Nama produk minimal 2 karakter').max(150),
  categoryId: z.coerce.number().int().positive('Kategori wajib dipilih'),
  costPrice: z.coerce.number().min(0, 'Harga modal tidak boleh bernilai negatif'),
  sellingPrice: z.coerce.number().min(0, 'Harga jual tidak boleh bernilai negatif'),
  stock: z.coerce.number().int().min(0, 'Stok awal tidak boleh bernilai negatif').default(0),
  unit: z.string().min(1, 'Satuan wajib diisi').default('bungkus'),
  minStock: z.coerce.number().int().min(0, 'Batas minimum stok tidak boleh negatif').default(5),
  isActive: z.coerce.boolean().default(true)
});

const updateProductSchema = productSchema.partial();

/**
 * Get all products with search, category filter, active filter
 */
async function getAllProducts(req, res, next) {
  try {
    const { search, categoryId, status, page, limit } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } }
      ];
    }

    if (categoryId && categoryId !== 'all') {
      where.categoryId = parseInt(categoryId);
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    // If user is CASHIER, force only active products
    if (req.user && req.user.role === 'CASHIER') {
      where.isActive = true;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single product by ID or SKU
 */
async function getProductById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        stockMovements: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true } }
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    }

    return res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
}

/**
 * Create new product (Admin only)
 */
async function createProduct(req, res, next) {
  try {
    const data = productSchema.parse(req.body);
    const imagePath = req.file ? `/uploads/products/${req.file.filename}` : null;

    // Check SKU uniqueness
    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku.trim() }
    });

    if (existingSku) {
      return res.status(400).json({
        success: false,
        message: `SKU '${data.sku}' sudah digunakan oleh produk lain.`
      });
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId }
    });
    if (!category) {
      return res.status(400).json({ success: false, message: 'Kategori tidak valid.' });
    }

    // Create product and initial stock movement inside transaction
    const newProduct = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.create({
        data: {
          sku: data.sku.trim().toUpperCase(),
          name: data.name.trim(),
          categoryId: data.categoryId,
          costPrice: data.costPrice,
          sellingPrice: data.sellingPrice,
          stock: data.stock,
          unit: data.unit.trim(),
          minStock: data.minStock,
          isActive: data.isActive,
          image: imagePath
        },
        include: { category: true }
      });

      if (data.stock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: prod.id,
            type: 'INITIAL',
            qtyBefore: 0,
            qtyChange: data.stock,
            qtyAfter: data.stock,
            reason: 'Stok awal produk baru',
            userId: req.user.id,
            refType: 'PRODUCT_CREATE'
          }
        });
      }

      return prod;
    });

    await logAudit({
      userId: req.user.id,
      action: 'PRODUCT_CREATE',
      entity: 'PRODUCT',
      entityId: String(newProduct.id),
      details: `Created product ${newProduct.name} (${newProduct.sku}) with initial stock ${data.stock}`,
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Produk berhasil ditambahkan.',
      product: newProduct
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update existing product (Admin only)
 */
async function updateProduct(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const data = updateProductSchema.parse(req.body);

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    }

    // If SKU changed, verify uniqueness
    if (data.sku && data.sku.trim().toUpperCase() !== existingProduct.sku) {
      const skuCheck = await prisma.product.findUnique({
        where: { sku: data.sku.trim().toUpperCase() }
      });
      if (skuCheck) {
        return res.status(400).json({
          success: false,
          message: `SKU '${data.sku}' sudah digunakan oleh produk lain.`
        });
      }
    }

    const updatePayload = {
      ...(data.sku && { sku: data.sku.trim().toUpperCase() }),
      ...(data.name && { name: data.name.trim() }),
      ...(data.categoryId && { categoryId: data.categoryId }),
      ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
      ...(data.sellingPrice !== undefined && { sellingPrice: data.sellingPrice }),
      ...(data.unit && { unit: data.unit.trim() }),
      ...(data.minStock !== undefined && { minStock: data.minStock }),
      ...(data.isActive !== undefined && { isActive: data.isActive })
    };

    if (req.file) {
      updatePayload.image = `/uploads/products/${req.file.filename}`;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updatePayload,
      include: { category: true }
    });

    await logAudit({
      userId: req.user.id,
      action: 'PRODUCT_UPDATE',
      entity: 'PRODUCT',
      entityId: String(id),
      details: `Updated product ${updated.name} (${updated.sku})`,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: 'Produk berhasil diperbarui.',
      product: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle active status / Soft delete product (Admin only)
 */
async function toggleProductStatus(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existingProduct = await prisma.product.findUnique({ where: { id } });

    if (!existingProduct) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    }

    const newStatus = !existingProduct.isActive;

    const updated = await prisma.product.update({
      where: { id },
      data: { isActive: newStatus }
    });

    await logAudit({
      userId: req.user.id,
      action: newStatus ? 'PRODUCT_ACTIVATE' : 'PRODUCT_DEACTIVATE',
      entity: 'PRODUCT',
      entityId: String(id),
      details: `${newStatus ? 'Activated' : 'Deactivated'} product ${updated.name}`,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Status produk berhasil diubah menjadi ${newStatus ? 'Aktif' : 'Nonaktif'}.`,
      product: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all categories
 */
async function getAllCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    return res.json({ success: true, categories });
  } catch (error) {
    next(error);
  }
}

/**
 * Create Category (Admin only)
 */
async function createCategory(req, res, next) {
  try {
    const { name, description } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug,
        description: description ? description.trim() : null
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Kategori berhasil dibuat.',
      category
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleProductStatus,
  getAllCategories,
  createCategory
};
