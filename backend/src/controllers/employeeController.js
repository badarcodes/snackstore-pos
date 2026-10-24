const { z } = require('zod');
const prisma = require('../config/db');
const { logAudit } = require('../utils/audit');

const employeeSchema = z.object({
  employeeCode: z.string().min(2, 'Kode karyawan wajib diisi').max(30),
  name: z.string().min(2, 'Nama karyawan minimal 2 karakter').max(100),
  position: z.string().min(2, 'Jabatan/Posisi wajib diisi').max(100),
  phone: z.string().optional(),
  address: z.string().optional(),
  salary: z.coerce.number().min(0, 'Gaji pokok tidak boleh negatif').optional(),
  isActive: z.coerce.boolean().default(true)
});

/**
 * Get all employees with attendance and evaluation counts
 */
async function getAllEmployees(req, res, next) {
  try {
    const { status, search } = req.query;

    const where = {};
    if (status === 'active') where.isActive = true;
    else if (status === 'inactive') where.isActive = false;

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { employeeCode: { contains: search } },
        { position: { contains: search } }
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        _count: {
          select: {
            attendances: true,
            leaves: true,
            evaluations: true
          }
        }
      },
      orderBy: { employeeCode: 'asc' }
    });

    return res.json({ success: true, count: employees.length, employees });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single employee by ID with attendance and evaluation history
 */
async function getEmployeeById(req, res, next) {
  try {
    const id = parseInt(req.params.id);

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        attendances: {
          take: 30,
          orderBy: { date: 'desc' }
        },
        leaves: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        evaluations: {
          take: 30,
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Data karyawan tidak ditemukan.' });
    }

    return res.json({ success: true, employee });
  } catch (error) {
    next(error);
  }
}

/**
 * Create new Employee
 */
async function createEmployee(req, res, next) {
  try {
    const data = employeeSchema.parse(req.body);

    const existingCode = await prisma.employee.findUnique({
      where: { employeeCode: data.employeeCode.trim().toUpperCase() }
    });

    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: `Kode karyawan '${data.employeeCode}' sudah terdaftar.`
      });
    }

    const employee = await prisma.employee.create({
      data: {
        employeeCode: data.employeeCode.trim().toUpperCase(),
        name: data.name.trim(),
        position: data.position.trim(),
        phone: data.phone ? data.phone.trim() : null,
        address: data.address ? data.address.trim() : null,
        salary: data.salary !== undefined ? data.salary : null,
        isActive: data.isActive
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'EMPLOYEE_CREATE',
      entity: 'EMPLOYEE',
      entityId: String(employee.id),
      details: `Created employee ${employee.name} (${employee.employeeCode}) - ${employee.position}`,
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Data karyawan berhasil ditambahkan.',
      employee
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update existing Employee
 */
async function updateEmployee(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const data = employeeSchema.partial().parse(req.body);

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Data karyawan tidak ditemukan.' });
    }

    if (data.employeeCode && data.employeeCode.trim().toUpperCase() !== existing.employeeCode) {
      const codeCheck = await prisma.employee.findUnique({
        where: { employeeCode: data.employeeCode.trim().toUpperCase() }
      });
      if (codeCheck) {
        return res.status(400).json({
          success: false,
          message: `Kode karyawan '${data.employeeCode}' sudah digunakan.`
        });
      }
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        ...(data.employeeCode && { employeeCode: data.employeeCode.trim().toUpperCase() }),
        ...(data.name && { name: data.name.trim() }),
        ...(data.position && { position: data.position.trim() }),
        ...(data.phone !== undefined && { phone: data.phone ? data.phone.trim() : null }),
        ...(data.address !== undefined && { address: data.address ? data.address.trim() : null }),
        ...(data.salary !== undefined && { salary: data.salary }),
        ...(data.isActive !== undefined && { isActive: data.isActive })
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'EMPLOYEE_UPDATE',
      entity: 'EMPLOYEE',
      entityId: String(id),
      details: `Updated employee ${updated.name} (${updated.employeeCode})`,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: 'Data karyawan berhasil diperbarui.',
      employee: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete Employee
 */
async function deleteEmployee(req, res, next) {
  try {
    const id = parseInt(req.params.id);

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Data karyawan tidak ditemukan.' });
    }

    await prisma.employee.delete({
      where: { id }
    });

    await logAudit({
      userId: req.user.id,
      action: 'EMPLOYEE_DELETE',
      entity: 'EMPLOYEE',
      entityId: String(id),
      details: `Deleted employee ${existing.name} (${existing.employeeCode})`,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Data karyawan ${existing.name} berhasil dihapus.`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
