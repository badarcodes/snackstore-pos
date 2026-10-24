const { z } = require('zod');
const prisma = require('../config/db');
const { logAudit } = require('../utils/audit');

const openShiftSchema = z.object({
  openingCash: z.coerce.number().min(0, 'Modal awal kasir tidak boleh negatif'),
  notes: z.string().optional()
});

const closeShiftSchema = z.object({
  actualCash: z.coerce.number().min(0, 'Jumlah uang fisik tidak boleh negatif'),
  notes: z.string().optional()
});

const cashMovementSchema = z.object({
  type: z.enum(['IN', 'OUT']),
  amount: z.coerce.number().positive('Nominal pergerakan kas harus lebih dari 0'),
  reason: z.string().min(3, 'Alasan pergerakan kas wajib diisi')
});

/**
 * Get active cash session for current cashier or store
 */
async function getActiveSession(req, res, next) {
  try {
    const session = await prisma.cashSession.findFirst({
      where: {
        status: 'OPEN',
        ...(req.user.role === 'CASHIER' ? { cashierId: req.user.id } : {})
      },
      include: {
        cashier: { select: { id: true, name: true, username: true } },
        cashMovements: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { openedAt: 'desc' }
    });

    return res.json({ success: true, session });
  } catch (error) {
    next(error);
  }
}

/**
 * Open new Cash Shift
 */
async function openShift(req, res, next) {
  try {
    const { openingCash, notes } = openShiftSchema.parse(req.body);

    // Check if user already has an active open session
    const existing = await prisma.cashSession.findFirst({
      where: {
        cashierId: req.user.id,
        status: 'OPEN'
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Anda masih memiliki sesi shift kasir yang aktif. Harap tutup shift sebelumnya terlebih dahulu.'
      });
    }

    const session = await prisma.cashSession.create({
      data: {
        cashierId: req.user.id,
        openingCash,
        totalCashSales: 0,
        totalCashIn: 0,
        totalCashOut: 0,
        expectedCash: openingCash,
        status: 'OPEN',
        notes: notes ? notes.trim() : null
      },
      include: {
        cashier: { select: { id: true, name: true, username: true } }
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'CASH_SESSION_OPEN',
      entity: 'CASH_SESSION',
      entityId: String(session.id),
      details: `Shift opened by ${req.user.name} with initial cash Rp ${openingCash}`,
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Sesi shift kasir berhasil dibuka.',
      session
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Close Cash Shift with actual cash count and discrepancy calculation
 */
async function closeShift(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { actualCash, notes } = closeShiftSchema.parse(req.body);

    const session = await prisma.cashSession.findUnique({
      where: { id }
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Sesi kasir tidak ditemukan.' });
    }

    if (session.status === 'CLOSED') {
      return res.status(400).json({ success: false, message: 'Sesi kasir ini sudah ditutup sebelumnya.' });
    }

    // Cashiers can only close their own shift, Admin can close any
    if (req.user.role === 'CASHIER' && session.cashierId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Anda hanya dapat menutup sesi shift Anda sendiri.' });
    }

    // Expected cash formula: openingCash + totalCashSales + totalCashIn - totalCashOut
    const opening = Number(session.openingCash);
    const sales = Number(session.totalCashSales);
    const cashIn = Number(session.totalCashIn);
    const cashOut = Number(session.totalCashOut);
    const expected = opening + sales + cashIn - cashOut;

    const actual = Number(actualCash);
    const difference = actual - expected;

    const closedSession = await prisma.cashSession.update({
      where: { id },
      data: {
        expectedCash: expected,
        actualCash: actual,
        difference,
        status: 'CLOSED',
        notes: notes ? notes.trim() : session.notes,
        closedAt: new Date()
      },
      include: {
        cashier: { select: { id: true, name: true, username: true } }
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'CASH_SESSION_CLOSE',
      entity: 'CASH_SESSION',
      entityId: String(id),
      details: `Shift closed. Expected: Rp ${expected}, Actual: Rp ${actual}, Diff: Rp ${difference}`,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Shift kasir berhasil ditutup. ${difference !== 0 ? `Selisih kas: Rp ${difference.toLocaleString('id-ID')}` : 'Saldo kas sesuai (Pas).' }`,
      session: closedSession
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Record manual cash movement (Kas Masuk / Kas Keluar) inside active session
 */
async function addCashMovement(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { type, amount, reason } = cashMovementSchema.parse(req.body);

    const session = await prisma.cashSession.findUnique({
      where: { id }
    });

    if (!session || session.status === 'CLOSED') {
      return res.status(400).json({ success: false, message: 'Sesi kasir tidak aktif atau sudah ditutup.' });
    }

    const movementAmount = Number(amount);

    const result = await prisma.$transaction(async (tx) => {
      const movement = await tx.cashMovement.create({
        data: {
          cashSessionId: id,
          type,
          amount: movementAmount,
          reason: reason.trim(),
          userId: req.user.id
        }
      });

      const currentExpected = Number(session.expectedCash);
      const currentIn = Number(session.totalCashIn);
      const currentOut = Number(session.totalCashOut);

      let newExpected = currentExpected;
      let newIn = currentIn;
      let newOut = currentOut;

      if (type === 'IN') {
        newIn += movementAmount;
        newExpected += movementAmount;
      } else {
        newOut += movementAmount;
        newExpected -= movementAmount;
      }

      const updatedSession = await tx.cashSession.update({
        where: { id },
        data: {
          totalCashIn: newIn,
          totalCashOut: newOut,
          expectedCash: newExpected
        }
      });

      return { movement, session: updatedSession };
    });

    await logAudit({
      userId: req.user.id,
      action: `CASH_MOVEMENT_${type}`,
      entity: 'CASH_SESSION',
      entityId: String(id),
      details: `Cash ${type} Rp ${amount}. Reason: ${reason}`,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Pergerakan kas (${type === 'IN' ? 'Kas Masuk' : 'Kas Keluar'}) berhasil dicatat.`,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get cash session history
 */
async function getSessionHistory(req, res, next) {
  try {
    const { startDate, endDate, cashierId } = req.query;

    const where = {};

    if (cashierId && cashierId !== 'all') {
      where.cashierId = parseInt(cashierId);
    }

    if (startDate || endDate) {
      where.openedAt = {};
      if (startDate) {
        where.openedAt.gte = new Date(`${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        where.openedAt.lte = new Date(`${endDate}T23:59:59.999Z`);
      }
    }

    const sessions = await prisma.cashSession.findMany({
      where,
      include: {
        cashier: { select: { id: true, name: true, username: true } },
        cashMovements: true,
        _count: { select: { sales: true } }
      },
      orderBy: { openedAt: 'desc' },
      take: 50
    });

    return res.json({ success: true, sessions });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getActiveSession,
  openShift,
  closeShift,
  addCashMovement,
  getSessionHistory
};
