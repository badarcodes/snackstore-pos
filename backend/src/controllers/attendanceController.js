const { z } = require('zod');
const prisma = require('../config/db');
const { logAudit } = require('../utils/audit');

const attendanceSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  date: z.string().min(10, 'Format tanggal YYYY-MM-DD'),
  checkIn: z.string().optional().nullable(),
  checkOut: z.string().optional().nullable(),
  status: z.enum(['HADIR', 'IZIN', 'SAKIT', 'ALPA']).default('HADIR'),
  notes: z.string().optional().nullable()
});

/**
 * Get attendances filtered by date or month
 */
async function getAttendances(req, res, next) {
  try {
    const { date, employeeId, startDate, endDate } = req.query;

    const where = {};

    if (employeeId && employeeId !== 'all') {
      where.employeeId = parseInt(employeeId);
    }

    if (date) {
      where.date = new Date(`${date}T00:00:00.000Z`);
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) where.date.lte = new Date(`${endDate}T23:59:59.999Z`);
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: { id: true, employeeCode: true, name: true, position: true, isActive: true }
        }
      },
      orderBy: [{ date: 'desc' }, { employee: { employeeCode: 'asc' } }]
    });

    return res.json({ success: true, count: attendances.length, attendances });
  } catch (error) {
    next(error);
  }
}

/**
 * Record or update attendance for an employee on a specific date
 */
async function recordAttendance(req, res, next) {
  try {
    const data = attendanceSchema.parse(req.body);
    const attendanceDate = new Date(`${data.date}T00:00:00.000Z`);

    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId }
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Data karyawan tidak ditemukan.' });
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId: data.employeeId,
          date: attendanceDate
        }
      },
      update: {
        checkIn: data.checkIn || null,
        checkOut: data.checkOut || null,
        status: data.status,
        notes: data.notes || null
      },
      create: {
        employeeId: data.employeeId,
        date: attendanceDate,
        checkIn: data.checkIn || null,
        checkOut: data.checkOut || null,
        status: data.status,
        notes: data.notes || null
      },
      include: {
        employee: true
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'ATTENDANCE_RECORD',
      entity: 'ATTENDANCE',
      entityId: String(attendance.id),
      details: `Recorded attendance for ${employee.name} on ${data.date}: ${data.status} (In: ${data.checkIn || '-'}, Out: ${data.checkOut || '-'})`,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Presensi ${employee.name} berhasil dicatat.`,
      attendance
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Bulk check-in for all active employees for today
 */
async function bulkCheckIn(req, res, next) {
  try {
    const { date, checkInTime = '07:30' } = req.body;
    const targetDateStr = date || new Date().toISOString().split('T')[0];
    const targetDate = new Date(`${targetDateStr}T00:00:00.000Z`);

    const activeEmployees = await prisma.employee.findMany({
      where: { isActive: true }
    });

    let recordedCount = 0;
    for (const emp of activeEmployees) {
      const existing = await prisma.attendance.findUnique({
        where: {
          employeeId_date: {
            employeeId: emp.id,
            date: targetDate
          }
        }
      });

      if (!existing) {
        await prisma.attendance.create({
          data: {
            employeeId: emp.id,
            date: targetDate,
            checkIn: checkInTime,
            status: 'HADIR',
            notes: 'Check-in cepat'
          }
        });
        recordedCount++;
      }
    }

    await logAudit({
      userId: req.user.id,
      action: 'ATTENDANCE_BULK_CHECKIN',
      entity: 'ATTENDANCE',
      details: `Bulk check-in for ${recordedCount} active employees on ${targetDateStr}`,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Berhasil mencatat presensi hadir untuk ${recordedCount} karyawan pada tanggal ${targetDateStr}.`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAttendances,
  recordAttendance,
  bulkCheckIn
};
