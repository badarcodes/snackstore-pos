const express = require('express');
const { getPOSProducts, processCheckout } = require('../controllers/posController');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/products', getPOSProducts);
router.post('/checkout', processCheckout);

module.exports = router;
