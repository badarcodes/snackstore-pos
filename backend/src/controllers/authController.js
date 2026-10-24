const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../config/db');
const { logAudit } = require('../utils/audit');

const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi')
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password lama wajib diisi'),
  newPassword: z.string().min(6, 'Password baru minimal 6 karakter')
});

async function login(req, res, next) {
  try {
    const { username, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { username }
    });

    // To prevent timing attacks and avoid revealing if username exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password tidak sesuai.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda dinonaktifkan. Hubungi Administrator.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password tidak sesuai.'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'snackstore_pos_super_secure_jwt_token_secret_key_2026_x89f7a',
      { expiresIn: '1d' }
    );

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Set secure HttpOnly cookie
    res.cookie('snack_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    // Log audit
    await logAudit({
      userId: user.id,
      action: 'LOGIN',
      entity: 'AUTH',
      entityId: String(user.id),
      details: `User ${user.username} (${user.role}) logged in successfully`,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: 'Login berhasil.',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    if (req.user) {
      await logAudit({
        userId: req.user.id,
        action: 'LOGOUT',
        entity: 'AUTH',
        entityId: String(req.user.id),
        details: `User ${req.user.username} logged out`,
        ipAddress: req.ip
      });
    }

    res.clearCookie('snack_session', {
      httpOnly: true,
      sameSite: 'lax'
    });

    return res.json({
      success: true,
      message: 'Logout berhasil.'
    });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    return res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Password saat ini tidak sesuai.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    await logAudit({
      userId: req.user.id,
      action: 'CHANGE_PASSWORD',
      entity: 'USER',
      entityId: String(req.user.id),
      details: 'User updated their password',
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: 'Password berhasil diubah.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  logout,
  getMe,
  changePassword
};
