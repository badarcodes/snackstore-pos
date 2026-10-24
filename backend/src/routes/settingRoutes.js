const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingController');
const { authenticateToken, requireRole } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', getSettings);
router.post('/', requireRole('ADMIN'), updateSettings);

module.exports = router;
