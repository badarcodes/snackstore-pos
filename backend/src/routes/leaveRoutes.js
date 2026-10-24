const express = require('express');
const {
  getLeaves,
  createLeaveRequest,
  updateLeaveStatus
} = require('../controllers/leaveController');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', getLeaves);
router.post('/', createLeaveRequest);
router.patch('/:id/status', updateLeaveStatus);

module.exports = router;
