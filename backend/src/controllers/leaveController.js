const { z } = require('zod');
const prisma = require('../config/db');
const { logAudit } = require('../utils/audit');

const leaveRequestSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  type: z.enum(['CUTI_TAHUNAN', 'SAKIT', 'IZIN', 'CUTI_MELAHIRKAN', 'CUTI_KHUSUS']),
  startDate: z.string().min(10, 'Format tanggal YYYY-MM-DD'),
  endDate: z.string().min(10, 'Format tanggal YYYY-MM-DD'),
  daysCount: z.coerce.number().int().positive().default(1),
  reason: z.string().min(3, 'Alasan izin/cuti wajib diisi minimal 3 karakter')
});

const updateLeaveStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  adminNotes: z.string().optional()
});

/**
 * Get all leave requests with filters
 */
async function getLeaves(req, res, next) {
  try {
    const { status, employeeId, type } = req.query;

    const where = {};
    if (status && status !== 'all') where.status = status;
    if (employeeId && employeeId !== 'all') where.employeeId = parseInt(employeeId);
    if (type && type !== 'all') where.type = type;

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: { id: true, employeeCode: true, name: true, position: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, count: leaves.length, leaves });
  } catch (error) {
    next(error);
  }
}

/**
 * Create Leave Request
 */
async function createLeaveRequest(req, res, next) {
  try {
    const data = leaveRequestSchema.parse(req.body);

    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId }
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Data karyawan tidak ditemukan.' });
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId: data.employeeId,
        type: data.type,
        startDate: new Date(`${data.startDate}T00:00:00.000Z`),
        endDate: new Date(`${data.endDate}T00:00:00.000Z`),
        daysCount: data.daysCount,
        reason: data.reason.trim(),
        status: 'PENDING'
      },
      include: { employee: true }
    });

    await logAudit({
      userId: req.user.id,
      action: 'LEAVE_CREATE',
      entity: 'LEAVE_REQUEST',
      entityId: String(leave.id),
      details: `Created leave request for ${employee.name} (${data.type}, ${data.daysCount} days)`,
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Pengajuan cuti/izin berhasil disimpan.',
      leave
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Approve or Reject Leave Request by Admin
 */
async function updateLeaveStatus(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { status, adminNotes } = updateLeaveStatusSchema.parse(req.body);

    const existing = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Pengajuan cuti tidak ditemukan.' });
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        adminNotes: adminNotes ? adminNotes.trim() : null,
        approvedAt: status === 'APPROVED' ? new Date() : null
      },
      include: { employee: true }
    });

    // If approved, optionally record attendance records as IZIN or SAKIT for those dates
    if (status === 'APPROVED') {
      const start = new Date(existing.startDate);
      const end = new Date(existing.endDate);
      const attendanceStatus = existing.type === 'SAKIT' ? 'SAKIT' : 'IZIN';

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const currentDate = new Date(d);
        currentDate.setHours(0, 0, 0, 0);

        await prisma.attendance.upsert({
          where: {
            employeeId_date: {
              employeeId: existing.employeeId,
              date: currentDate
            }
          },
          update: {
            status: attendanceStatus,
            notes: `Disetujui Admin: ${existing.reason}`
          },
          create: {
            employeeId: existing.employeeId,
            date: currentDate,
            status: attendanceStatus,
            notes: `Disetujui Admin: ${existing.reason}`
          }
        });
      }
    }

    await logAudit({
      userId: req.user.id,
      action: `LEAVE_${status}`,
      entity: 'LEAVE_REQUEST',
      entityId: String(id),
      details: `Admin ${status} leave for ${existing.employee.name}. Notes: ${adminNotes || '-'}`,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Pengajuan cuti ${status === 'APPROVED' ? 'berhasil disetujui' : 'telah ditolak'}.`,
      leave: updated
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getLeaves,
  createLeaveRequest,
  updateLeaveStatus
};
