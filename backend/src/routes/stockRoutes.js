const express = require('express');
const {
  getStockOverview,
  adjustStock,
  recordPurchase,
  getStockMovements,
  getSuppliers
} = require('../controllers/stockController');
const { authenticateToken, requireRole } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticateToken);

// View routes (both Admin and Cashier)
router.get('/overview', getStockOverview);
router.get('/movements', getStockMovements);
router.get('/suppliers', getSuppliers);

// Modification routes (Admin only)
router.post('/adjust', requireRole('ADMIN'), adjustStock);
router.post('/purchase', requireRole('ADMIN'), recordPurchase);

module.exports = router;
