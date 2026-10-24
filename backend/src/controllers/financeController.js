const { z } = require('zod');
const prisma = require('../config/db');
const { generateExpenseNumber, generateIncomeNumber } = require('../utils/helpers');
const { logAudit } = require('../utils/audit');

const expenseSchema = z.object({
  category: z.enum(['STOK_BAHAN', 'KEMASAN_DUS_PLASTIK', 'TRANSPORTASI', 'LISTRIK_AIR_GAS', 'GAJI_KARYAWAN', 'OPERASIONAL_LAIN']),
  amount: z.coerce.number().positive('Nominal pengeluaran harus lebih dari 0'),
  paymentMethod: z.enum(['CASH', 'TRANSFER']).default('CASH'),
  description: z.string().min(3, 'Deskripsi pengeluaran wajib diisi minimal 3 karakter')
});

const incomeSchema = z.object({
  category: z.enum(['MODAL_AWAL', 'PENDAPATAN_LAIN', 'BONUS_SUPPLIER']),
  amount: z.coerce.number().positive('Nominal pemasukan harus lebih dari 0'),
  paymentMethod: z.enum(['CASH', 'TRANSFER']).default('CASH'),
  description: z.string().min(3, 'Deskripsi pemasukan wajib diisi minimal 3 karakter')
});

/**
 * Get all expenses with filters and category breakdown
 */
async function getExpenses(req, res, next) {
  try {
    const { category, paymentMethod, startDate, endDate } = req.query;

    const where = {};

    if (category && category !== 'all') {
      where.category = category;
    }

    if (paymentMethod && paymentMethod !== 'all') {
      where.paymentMethod = paymentMethod;
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

    const [expenses, aggregate] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, username: true } },
          purchase: { select: { id: true, invoiceNumber: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.expense.aggregate({
        where,
        _sum: { amount: true },
        _count: { id: true }
      })
    ]);

    return res.json({
      success: true,
      totalCount: aggregate._count.id,
      totalAmount: aggregate._sum.amount || 0,
      expenses
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Record new Expense
 */
async function createExpense(req, res, next) {
  try {
    const data = expenseSchema.parse(req.body);
    const expenseNumber = generateExpenseNumber();

    const expense = await prisma.expense.create({
      data: {
        expenseNumber,
        category: data.category,
        amount: data.amount,
        paymentMethod: data.paymentMethod === 'CASH' ? 'CASH' : 'TRANSFER',
        description: data.description.trim(),
        userId: req.user.id
      },
      include: {
        user: { select: { id: true, name: true } }
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'EXPENSE_CREATE',
      entity: 'EXPENSE',
      entityId: String(expense.id),
      details: `Created expense ${expenseNumber} (${data.category}) Rp ${data.amount}`,
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Pengeluaran berhasil dicatat.',
      expense
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get other income entries
 */
async function getIncomeEntries(req, res, next) {
  try {
    const { category, paymentMethod, startDate, endDate } = req.query;

    const where = {};

    if (category && category !== 'all') {
      where.category = category;
    }

    if (paymentMethod && paymentMethod !== 'all') {
      where.paymentMethod = paymentMethod;
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

    const [incomes, aggregate] = await Promise.all([
      prisma.incomeEntry.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, username: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.incomeEntry.aggregate({
        where,
        _sum: { amount: true },
        _count: { id: true }
      })
    ]);

    return res.json({
      success: true,
      totalCount: aggregate._count.id,
      totalAmount: aggregate._sum.amount || 0,
      incomes
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Record new Other Income
 */
async function createIncomeEntry(req, res, next) {
  try {
    const data = incomeSchema.parse(req.body);
    const entryNumber = generateIncomeNumber();

    const entry = await prisma.incomeEntry.create({
      data: {
        entryNumber,
        category: data.category,
        amount: data.amount,
        paymentMethod: data.paymentMethod === 'CASH' ? 'CASH' : 'TRANSFER',
        description: data.description.trim(),
        userId: req.user.id
      },
      include: {
        user: { select: { id: true, name: true } }
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'INCOME_CREATE',
      entity: 'INCOME',
      entityId: String(entry.id),
      details: `Created income ${entryNumber} (${data.category}) Rp ${data.amount}`,
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Pemasukan lain berhasil dicatat.',
      entry
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Financial Cashflow and Profit Summary
 */
async function getFinanceSummary(req, res, next) {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) {
      dateFilter.gte = new Date(`${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      dateFilter.lte = new Date(`${endDate}T23:59:59.999Z`);
    }
    const hasDate = startDate || endDate;

    // 1. Sales revenue & COGS from COMPLETED sales
    const salesWhere = {
      status: 'COMPLETED',
      ...(hasDate && { createdAt: dateFilter })
    };

    const salesAggregate = await prisma.sale.aggregate({
      where: salesWhere,
      _sum: { finalAmount: true, totalAmount: true, discountAmount: true }
    });

    const salesRevenue = Number(salesAggregate._sum.finalAmount || 0);

    // Sum COGS / HPP for sold items
    const saleItems = await prisma.saleItem.findMany({
      where: {
        sale: salesWhere
      },
      select: {
        qty: true,
        unitCost: true,
        subtotal: true,
        profit: true
      }
    });

    let totalCOGS = 0;
    let totalGrossProfit = 0;
    for (const item of saleItems) {
      totalCOGS += Number(item.unitCost) * item.qty;
      totalGrossProfit += Number(item.profit);
    }

    // 2. Other Incomes
    const incomeWhere = hasDate ? { createdAt: dateFilter } : {};
    const incomeAggregate = await prisma.incomeEntry.aggregate({
      where: incomeWhere,
      _sum: { amount: true }
    });
    const totalOtherIncome = Number(incomeAggregate._sum.amount || 0);

    // 3. Operational Expenses
    const expenseWhere = hasDate ? { createdAt: dateFilter } : {};
    const expenseAggregate = await prisma.expense.aggregate({
      where: expenseWhere,
      _sum: { amount: true }
    });
    const totalExpenses = Number(expenseAggregate._sum.amount || 0);

    const totalInflow = salesRevenue + totalOtherIncome;
    const totalOutflow = totalExpenses;
    const netCashFlow = totalInflow - totalOutflow;
    const estimatedNetProfit = totalGrossProfit - totalExpenses;

    return res.json({
      success: true,
      summary: {
        salesRevenue,
        totalCOGS,
        totalGrossProfit,
        totalOtherIncome,
        totalExpenses,
        totalInflow,
        totalOutflow,
        netCashFlow,
        estimatedNetProfit
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getExpenses,
  createExpense,
  getIncomeEntries,
  createIncomeEntry,
  getFinanceSummary
};
