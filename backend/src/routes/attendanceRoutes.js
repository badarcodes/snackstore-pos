const express = require('express');
const {
  getAttendances,
  recordAttendance,
  bulkCheckIn
} = require('../controllers/attendanceController');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', getAttendances);
router.post('/', recordAttendance);
router.post('/bulk-checkin', bulkCheckIn);

module.exports = router;
