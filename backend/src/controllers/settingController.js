const prisma = require('../config/db');
const { logAudit } = require('../utils/audit');

/**
 * Get all settings as key-value map
 */
async function getSettings(req, res, next) {
  try {
    const settingsList = await prisma.setting.findMany();
    const settings = {};
    for (const item of settingsList) {
      settings[item.key] = item.value;
    }
    return res.json({ success: true, settings });
  } catch (error) {
    next(error);
  }
}

/**
 * Update multiple settings (Admin only)
 */
async function updateSettings(req, res, next) {
  try {
    const entries = req.body; // e.g. { store_name: "...", store_address: "..." }

    for (const [key, value] of Object.entries(entries)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      });
    }

    await logAudit({
      userId: req.user.id,
      action: 'SETTINGS_UPDATE',
      entity: 'SETTING',
      details: `Updated settings: ${Object.keys(entries).join(', ')}`,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: 'Pengaturan toko berhasil diperbarui.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSettings,
  updateSettings
};
