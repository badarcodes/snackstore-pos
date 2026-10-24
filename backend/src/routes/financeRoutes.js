const express = require('express');
const {
  getExpenses,
  createExpense,
  getIncomeEntries,
  createIncomeEntry,
  getFinanceSummary
} = require('../controllers/financeController');
const { authenticateToken, requireRole } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticateToken);

// Expenses
router.get('/expenses', getExpenses);
router.post('/expenses', createExpense);

// Incomes
router.get('/incomes', requireRole('ADMIN'), getIncomeEntries);
router.post('/incomes', requireRole('ADMIN'), createIncomeEntry);

// Summary
router.get('/summary', requireRole('ADMIN'), getFinanceSummary);

module.exports = router;
