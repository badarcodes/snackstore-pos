const express = require('express');
const {
  getDashboardData,
  getSalesReport,
  getStockReport,
  getAuditLogs
} = require('../controllers/reportController');
const { authenticateToken, requireRole } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/dashboard', getDashboardData);
router.get('/sales', requireRole('ADMIN'), getSalesReport);
router.get('/stock-valuation', requireRole('ADMIN'), getStockReport);
router.get('/audit-logs', requireRole('ADMIN'), getAuditLogs);

module.exports = router;
