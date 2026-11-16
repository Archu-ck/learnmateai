const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const { getRoles, updateRolePermissions } = require('../controllers/adminRoleController');

router.use(requireAuth);

router.get('/', requirePermission('roles.manage'), getRoles);
router.put('/:role', requirePermission('roles.manage'), updateRolePermissions);

module.exports = router;
