const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../config/db');
const { logAudit } = require('../utils/audit');

const createUserSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter').max(50),
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['ADMIN', 'CASHIER'])
});

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(['ADMIN', 'CASHIER']).optional(),
  isActive: z.boolean().optional()
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password baru minimal 6 karakter')
});

async function getAllUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { sales: true }
        }
      },
      orderBy: { id: 'asc' }
    });

    return res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const data = createUserSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { username: data.username.toLowerCase().trim() }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Username sudah digunakan, silakan pilih username lain.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const newUser = await prisma.user.create({
      data: {
        username: data.username.toLowerCase().trim(),
        name: data.name.trim(),
        password: hashedPassword,
        role: data.role,
        isActive: true
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'USER_CREATE',
      entity: 'USER',
      entityId: String(newUser.id),
      details: `Admin created user ${newUser.username} with role ${newUser.role}`,
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Pengguna baru berhasil ditambahkan.',
      user: newUser
    });
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const data = updateUserSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    // Prevent admin from deactivating themselves
    if (req.user.id === id && data.isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'Anda tidak dapat menonaktifkan akun Anda sendiri.'
      });
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'USER_UPDATE',
      entity: 'USER',
      entityId: String(id),
      details: `Admin updated user ${updated.username}: ${JSON.stringify(data)}`,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: 'Data pengguna berhasil diperbarui.',
      user: updated
    });
  } catch (error) {
    next(error);
  }
}

async function resetUserPassword(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { newPassword } = resetPasswordSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    await logAudit({
      userId: req.user.id,
      action: 'USER_RESET_PASSWORD',
      entity: 'USER',
      entityId: String(id),
      details: `Admin reset password for user ${existingUser.username}`,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Password pengguna ${existingUser.username} berhasil direset.`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  resetUserPassword
};
