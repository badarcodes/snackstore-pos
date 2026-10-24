const express = require('express');
const { getAllUsers, createUser, updateUser, resetUserPassword } = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middlewares/auth');

const router = express.Router();

// All user management routes require ADMIN role
router.use(authenticateToken, requireRole('ADMIN'));

router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.post('/:id/reset-password', resetUserPassword);

module.exports = router;
