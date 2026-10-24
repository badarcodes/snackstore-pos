const { z } = require('zod');
const prisma = require('../config/db');
const { logAudit } = require('../utils/audit');

const evaluationSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  date: z.string().min(10, 'Format tanggal YYYY-MM-DD'),
  scoreDiscipline: z.coerce.number().int().min(1).max(5),
  scoreQuality: z.coerce.number().int().min(1).max(5),
  scoreService: z.coerce.number().int().min(1).max(5),
  scoreTeamwork: z.coerce.number().int().min(1).max(5),
  scoreInitiative: z.coerce.number().int().min(1).max(5),
  notes: z.string().optional()
});

/**
 * Get evaluations for a specific date or employee
 */
async function getEvaluations(req, res, next) {
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

    const evaluations = await prisma.dailyEvaluation.findMany({
      where,
      include: {
        employee: {
          select: { id: true, employeeCode: true, name: true, position: true }
        }
      },
      orderBy: [{ date: 'desc' }, { employee: { employeeCode: 'asc' } }]
    });

    return res.json({ success: true, count: evaluations.length, evaluations });
  } catch (error) {
    next(error);
  }
}

/**
 * Record or update daily performance evaluation (5 indicators on 1-5 scale)
 */
async function recordEvaluation(req, res, next) {
  try {
    const data = evaluationSchema.parse(req.body);
    const evalDate = new Date(`${data.date}T00:00:00.000Z`);

    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId }
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Data karyawan tidak ditemukan.' });
    }

    const sum = data.scoreDiscipline + data.scoreQuality + data.scoreService + data.scoreTeamwork + data.scoreInitiative;
    const averageScore = parseFloat((sum / 5).toFixed(2));

    const evaluation = await prisma.dailyEvaluation.upsert({
      where: {
        employeeId_date: {
          employeeId: data.employeeId,
          date: evalDate
        }
      },
      update: {
        scoreDiscipline: data.scoreDiscipline,
        scoreQuality: data.scoreQuality,
        scoreService: data.scoreService,
        scoreTeamwork: data.scoreTeamwork,
        scoreInitiative: data.scoreInitiative,
        averageScore,
        notes: data.notes ? data.notes.trim() : null
      },
      create: {
        employeeId: data.employeeId,
        date: evalDate,
        scoreDiscipline: data.scoreDiscipline,
        scoreQuality: data.scoreQuality,
        scoreService: data.scoreService,
        scoreTeamwork: data.scoreTeamwork,
        scoreInitiative: data.scoreInitiative,
        averageScore,
        notes: data.notes ? data.notes.trim() : null
      },
      include: { employee: true }
    });

    await logAudit({
      userId: req.user.id,
      action: 'EVALUATION_RECORD',
      entity: 'DAILY_EVALUATION',
      entityId: String(evaluation.id),
      details: `Evaluated ${employee.name} on ${data.date}: Avg ${averageScore}/5`,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Penilaian kinerja ${employee.name} berhasil disimpan. Rata-rata: ${averageScore}/5`,
      evaluation
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Weekly and Monthly Performance Recapitulation & Comparison
 */
async function getPerformanceRecap(req, res, next) {
  try {
    const { period = 'monthly', startDate, endDate, month, year } = req.query;

    const dateFilter = {};

    const now = new Date();
    const currentYear = year ? parseInt(year) : now.getFullYear();
    const currentMonth = month ? parseInt(month) : now.getMonth() + 1;

    if (startDate && endDate) {
      dateFilter.gte = new Date(`${startDate}T00:00:00.000Z`);
      dateFilter.lte = new Date(`${endDate}T23:59:59.999Z`);
    } else if (period === 'weekly') {
      // Past 7 days if not specified
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 6);
      weekAgo.setHours(0, 0, 0, 0);
      dateFilter.gte = weekAgo;
      dateFilter.lte = new Date();
    } else {
      // Monthly
      const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
      const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);
      dateFilter.gte = startOfMonth;
      dateFilter.lte = endOfMonth;
    }

    // Fetch all active employees
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      include: {
        evaluations: {
          where: { date: dateFilter },
          orderBy: { date: 'asc' }
        },
        attendances: {
          where: { date: dateFilter }
        }
      },
      orderBy: { employeeCode: 'asc' }
    });

    // Compute metrics for each employee
    const summaryPerEmployee = employees.map(emp => {
      const evals = emp.evaluations;
      const count = evals.length;

      let sumDiscipline = 0;
      let sumQuality = 0;
      let sumService = 0;
      let sumTeamwork = 0;
      let sumInitiative = 0;
      let sumAverage = 0;

      for (const ev of evals) {
        sumDiscipline += ev.scoreDiscipline;
        sumQuality += ev.scoreQuality;
        sumService += ev.scoreService;
        sumTeamwork += ev.scoreTeamwork;
        sumInitiative += ev.scoreInitiative;
        sumAverage += Number(ev.averageScore);
      }

      const avgDiscipline = count > 0 ? parseFloat((sumDiscipline / count).toFixed(2)) : 0;
      const avgQuality = count > 0 ? parseFloat((sumQuality / count).toFixed(2)) : 0;
      const avgService = count > 0 ? parseFloat((sumService / count).toFixed(2)) : 0;
      const avgTeamwork = count > 0 ? parseFloat((sumTeamwork / count).toFixed(2)) : 0;
      const avgInitiative = count > 0 ? parseFloat((sumInitiative / count).toFixed(2)) : 0;
      const overallAvg = count > 0 ? parseFloat((sumAverage / count).toFixed(2)) : 0;

      // Attendance summary for same period
      const attendances = emp.attendances;
      const presentCount = attendances.filter(a => a.status === 'HADIR').length;
      const permissionCount = attendances.filter(a => a.status === 'IZIN').length;
      const sickCount = attendances.filter(a => a.status === 'SAKIT').length;
      const alphaCount = attendances.filter(a => a.status === 'ALPA').length;

      return {
        id: emp.id,
        employeeCode: emp.employeeCode,
        name: emp.name,
        position: emp.position,
        evalCount: count,
        avgDiscipline,
        avgQuality,
        avgService,
        avgTeamwork,
        avgInitiative,
        overallAvg,
        attendanceSummary: {
          present: presentCount,
          permission: permissionCount,
          sick: sickCount,
          alpha: alphaCount
        },
        dailyScores: evals.map(ev => ({
          date: ev.date.toISOString().split('T')[0],
          score: Number(ev.averageScore)
        }))
      };
    });

    // Sort by overall average descending (Ranking)
    const ranking = [...summaryPerEmployee].sort((a, b) => b.overallAvg - a.overallAvg);

    // Store-wide overall average score
    const totalEvalsCount = summaryPerEmployee.reduce((acc, curr) => acc + curr.evalCount, 0);
    const storeAvgScore = summaryPerEmployee.length > 0
      ? parseFloat((summaryPerEmployee.reduce((acc, curr) => acc + curr.overallAvg, 0) / summaryPerEmployee.length).toFixed(2))
      : 0;

    return res.json({
      success: true,
      period,
      filter: {
        year: currentYear,
        month: currentMonth,
        startDate: dateFilter.gte,
        endDate: dateFilter.lte
      },
      stats: {
        totalEmployees: employees.length,
        totalEvaluationsConducted: totalEvalsCount,
        storeAverageScore: storeAvgScore
      },
      ranking,
      summaryPerEmployee
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getEvaluations,
  recordEvaluation,
  getPerformanceRecap
};
