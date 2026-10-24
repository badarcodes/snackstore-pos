const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

/**
 * Middleware to authenticate requests using JWT stored in cookie or Authorization Bearer header
 */
async function authenticateToken(req, res, next) {
  try {
    let token = null;

    // Check cookie first
    if (req.cookies && req.cookies.snack_session) {
      token = req.cookies.snack_session;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Silakan login terlebih dahulu.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'snackstore_pos_super_secure_jwt_token_secret_key_2026_x89f7a');

    // Fetch user from DB to ensure user is still active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Pengguna tidak ditemukan. Sesi telah berakhir.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda dinonaktifkan oleh administrator.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Sesi login telah kedaluwarsa. Silakan login kembali.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token otentikasi tidak valid.'
    });
  }
}

/**
 * Middleware to authorize specific roles
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autentikasi diperlukan.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki hak akses (otorisasi) untuk fitur ini.'
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole
};
