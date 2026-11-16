const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const { getAuditLogs } = require('../controllers/adminAuditController');

router.use(requireAuth);

router.get('/', requirePermission('auditlog.view'), getAuditLogs);

module.exports = router;
