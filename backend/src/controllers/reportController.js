const prisma = require('../config/db');

/**
 * Get Dashboard Summary and Charts data
 */
async function getDashboardData(req, res, next) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Today's Completed Sales Metrics
    const todaySales = await prisma.sale.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: today, lt: tomorrow }
      },
      _sum: { finalAmount: true, discountAmount: true },
      _count: { id: true }
    });

    const todayOmzet = Number(todaySales._sum.finalAmount || 0);
    const todayTransactionCount = todaySales._count.id;

    // 2. Today's COGS and Estimated Profit
    const todayItems = await prisma.saleItem.findMany({
      where: {
        sale: {
          status: 'COMPLETED',
          createdAt: { gte: today, lt: tomorrow }
        }
      },
      select: {
        unitCost: true,
        unitPrice: true,
        qty: true,
        subtotal: true,
        profit: true
      }
    });

    let todayGrossProfit = 0;
    let todayCOGS = 0;
    for (const item of todayItems) {
      todayCOGS += Number(item.unitCost) * item.qty;
      todayGrossProfit += Number(item.profit);
    }

    // 3. Today's Expenses
    const todayExpenses = await prisma.expense.aggregate({
      where: {
        createdAt: { gte: today, lt: tomorrow }
      },
      _sum: { amount: true }
    });
    const todayExpenseAmount = Number(todayExpenses._sum.amount || 0);

    // 4. Today's Other Incomes
    const todayOtherIncomes = await prisma.incomeEntry.aggregate({
      where: {
        createdAt: { gte: today, lt: tomorrow }
      },
      _sum: { amount: true }
    });
    const todayOtherIncomeAmount = Number(todayOtherIncomes._sum.amount || 0);

    // 5. Active Cash Drawer
    const activeCashSession = await prisma.cashSession.findFirst({
      where: { status: 'OPEN' },
      orderBy: { openedAt: 'desc' }
    });

    // 6. Top 5 Best Selling Products
    const topSellingItems = await prisma.saleItem.groupBy({
      by: ['productId', 'productName'],
      where: {
        sale: { status: 'COMPLETED' }
      },
      _sum: { qty: true, subtotal: true },
      orderBy: { _sum: { qty: 'desc' } },
      take: 5
    });

    // 7. Low Stock & Out of Stock Alerts
    const lowStockProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        stock: { lte: 10 }
      },
      include: { category: { select: { name: true } } },
      orderBy: { stock: 'asc' },
      take: 6
    });

    // 8. Recent 6 Transactions
    const recentTransactions = await prisma.sale.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        cashier: { select: { id: true, name: true } },
        _count: { select: { items: true } }
      }
    });

    // 9. Last 7 Days Sales Trend for Recharts
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const pastWeekSales = await prisma.sale.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: sevenDaysAgo }
      },
      select: {
        finalAmount: true,
        createdAt: true
      }
    });

    // Group sales by date (YYYY-MM-DD)
    const trendMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateKey = d.toISOString().split('T')[0];
      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      trendMap[dateKey] = {
        date: dateKey,
        day: dayNames[d.getDay()],
        total: 0,
        count: 0
      };
    }

    for (const sale of pastWeekSales) {
      const dateKey = sale.createdAt.toISOString().split('T')[0];
      if (trendMap[dateKey]) {
        trendMap[dateKey].total += Number(sale.finalAmount);
        trendMap[dateKey].count += 1;
      }
    }

    const weeklyTrend = Object.values(trendMap);

    return res.json({
      success: true,
      data: {
        todayOmzet,
        todayTransactionCount,
        todayCOGS,
        todayGrossProfit,
        todayExpenseAmount,
        todayOtherIncomeAmount,
        activeCashDrawer: activeCashSession ? {
          id: activeCashSession.id,
          openingCash: activeCashSession.openingCash,
          expectedCash: activeCashSession.expectedCash,
          totalCashSales: activeCashSession.totalCashSales
        } : null,
        topSellingItems: topSellingItems.map(item => ({
          productName: item.productName,
          soldQty: item._sum.qty || 0,
          totalSales: item._sum.subtotal || 0
        })),
        lowStockProducts,
        recentTransactions,
        weeklyTrend
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Comprehensive Sales & Profit Report with Date Filter
 */
async function getSalesReport(req, res, next) {
  try {
    const { startDate, endDate } = req.query;

    const where = { status: 'COMPLETED' };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        where.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`);
      }
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        cashier: { select: { id: true, name: true } },
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });

    let totalRevenue = 0;
    let totalDiscount = 0;
    let totalCOGS = 0;
    let totalGrossProfit = 0;

    for (const sale of sales) {
      totalRevenue += Number(sale.finalAmount);
      totalDiscount += Number(sale.discountAmount);

      for (const item of sale.items) {
        totalCOGS += Number(item.unitCost) * item.qty;
        totalGrossProfit += Number(item.profit);
      }
    }

    return res.json({
      success: true,
      summary: {
        transactionCount: sales.length,
        totalRevenue,
        totalDiscount,
        totalCOGS,
        totalGrossProfit,
        profitMargin: totalRevenue > 0 ? ((totalGrossProfit / totalRevenue) * 100).toFixed(2) : 0
      },
      sales
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Stock Valuation and Inventory Report
 */
async function getStockReport(req, res, next) {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: { select: { id: true, name: true } }
      },
      orderBy: { name: 'asc' }
    });

    let totalStockQty = 0;
    let totalAssetAtCost = 0;
    let totalAssetAtRetail = 0;

    const inventory = products.map(p => {
      const stock = p.stock;
      const cost = Number(p.costPrice);
      const retail = Number(p.sellingPrice);
      const valueAtCost = stock * cost;
      const valueAtRetail = stock * retail;

      totalStockQty += stock;
      totalAssetAtCost += valueAtCost;
      totalAssetAtRetail += valueAtRetail;

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category.name,
        stock,
        unit: p.unit,
        minStock: p.minStock,
        costPrice: cost,
        sellingPrice: retail,
        valueAtCost,
        valueAtRetail,
        potentialProfit: valueAtRetail - valueAtCost,
        isLow: stock <= p.minStock
      };
    });

    return res.json({
      success: true,
      summary: {
        totalProducts: products.length,
        totalStockQty,
        totalAssetAtCost,
        totalAssetAtRetail,
        totalPotentialProfit: totalAssetAtRetail - totalAssetAtCost
      },
      inventory
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Audit Logs Report (Admin only)
 */
async function getAuditLogs(req, res, next) {
  try {
    const { action, startDate, endDate, limit = 100 } = req.query;

    const where = {};
    if (action && action !== 'all') {
      where.action = action;
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

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, username: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    return res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardData,
  getSalesReport,
  getStockReport,
  getAuditLogs
};
