const AuditLog = require('../models/AuditLog');

async function getAuditLogs(req, res) {
  try {
    const schoolId = req.user.schoolId;
    const { actorId, action, startDate, endDate, page = 1, limit = 20 } = req.query;

    const query = { schoolId };

    if (actorId) {
      query.actorId = actorId;
    }

    if (action && action !== 'all') {
      query.action = action;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actorId', 'name email role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    const formatted = logs.map((log) => ({
      id: log._id,
      actor: log.actorId
        ? { id: log.actorId._id, name: log.actorId.name, email: log.actorId.email, role: log.actorId.role }
        : { name: 'System', email: 'system@learnmate.internal', role: 'system' },
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      details: log.details,
      timestamp: log.timestamp,
    }));

    return res.json({
      logs: formatted,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (error) {
    console.error('getAuditLogs error:', error);
    return res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
}

module.exports = {
  getAuditLogs,
};
