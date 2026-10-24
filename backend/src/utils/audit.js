const prisma = require('../config/db');

/**
 * Record an audit log entry
 */
async function logAudit({ userId, action, entity, entityId, details, ipAddress }) {
  try {
    const detailsString = typeof details === 'object' ? JSON.stringify(details) : (details || '');
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entity,
        entityId: entityId ? String(entityId) : null,
        details: detailsString,
        ipAddress: ipAddress || null
      }
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

module.exports = { logAudit };
