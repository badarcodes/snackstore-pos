const express = require('express');
const {
  getEvaluations,
  recordEvaluation,
  getPerformanceRecap
} = require('../controllers/evaluationController');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', getEvaluations);
router.post('/', recordEvaluation);
router.get('/recap', getPerformanceRecap);

module.exports = router;
