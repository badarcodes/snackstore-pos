const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleProductStatus,
  getAllCategories,
  createCategory
} = require('../controllers/productController');
const { authenticateToken, requireRole } = require('../middlewares/auth');

const router = express.Router();

// Multer storage configuration for product photos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../public/uploads/products'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'prod-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB max
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Hanya file gambar (JPEG, PNG, WEBP) yang diperbolehkan!'));
  }
});

// Category endpoints
router.get('/categories', authenticateToken, getAllCategories);
router.post('/categories', authenticateToken, requireRole('ADMIN'), createCategory);

// Product endpoints
router.get('/', authenticateToken, getAllProducts);
router.get('/:id', authenticateToken, getProductById);
router.post('/', authenticateToken, requireRole('ADMIN'), upload.single('image'), createProduct);
router.put('/:id', authenticateToken, requireRole('ADMIN'), upload.single('image'), updateProduct);
router.patch('/:id/toggle-status', authenticateToken, requireRole('ADMIN'), toggleProductStatus);

module.exports = router;
