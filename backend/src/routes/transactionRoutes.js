const express = require('express');
const {
  getTransactions,
  getTransactionDetail,
  cancelTransaction
} = require('../controllers/transactionController');
const { authenticateToken, requireRole } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', getTransactions);
router.get('/:id', getTransactionDetail);
router.post('/:id/cancel', requireRole('ADMIN'), cancelTransaction);

module.exports = router;
