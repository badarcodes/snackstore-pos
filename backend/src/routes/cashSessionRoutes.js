const express = require('express');
const {
  getActiveSession,
  openShift,
  closeShift,
  addCashMovement,
  getSessionHistory
} = require('../controllers/cashSessionController');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/active', getActiveSession);
router.post('/open', openShift);
router.post('/:id/close', closeShift);
router.post('/:id/movement', addCashMovement);
router.get('/history', getSessionHistory);

module.exports = router;
