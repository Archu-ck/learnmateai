const { z } = require('zod');
const RolePermission = require('../models/RolePermission');
const AuditLog = require('../models/AuditLog');
const { invalidatePermissionCache } = require('../services/permissionCache');
const { ALL_PERMISSIONS } = require('../constants/permissions');

const VALID_ROLES = ['admin', 'principal', 'coordinator', 'teacher', 'counsellor', 'student', 'parent'];

const updateRolePermissionsSchema = z.object({
  permissions: z.array(z.string()),
});

async function getRoles(req, res) {
  try {
    const schoolId = req.user.schoolId;
    const roleDocs = await RolePermission.find({ schoolId }).lean();

    const roleMap = {};
    for (const doc of roleDocs) {
      roleMap[doc.role] = doc.permissions;
    }

    const roles = VALID_ROLES.map((role) => ({
      role,
      permissions: roleMap[role] || [],
    }));

    return res.json({
      roles,
      allPermissions: ALL_PERMISSIONS,
    });
  } catch (error) {
    console.error('getRoles error:', error);
    return res.status(500).json({ error: 'Failed to retrieve role permissions.' });
  }
}

async function updateRolePermissions(req, res) {
  try {
    const { role } = req.params;
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `Invalid role '${role}'.` });
    }

    const parseResult = updateRolePermissionsSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    let { permissions } = parseResult.data;
    const schoolId = req.user.schoolId;

    // Filter to valid permissions
    let cleanPermissions = Array.from(new Set(permissions.filter((p) => ALL_PERMISSIONS.includes(p))));

    // Lockout protection: admin role cannot lose roles.manage or users.create
    if (role === 'admin') {
      if (!cleanPermissions.includes('roles.manage')) {
        cleanPermissions.push('roles.manage');
      }
      if (!cleanPermissions.includes('users.create')) {
        cleanPermissions.push('users.create');
      }
    }

    const updated = await RolePermission.findOneAndUpdate(
      { role, schoolId },
      { role, permissions: cleanPermissions, schoolId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Invalidate cache immediately so changes take effect on the next request
    invalidatePermissionCache();

    await AuditLog.create({
      actorId: req.user._id,
      action: 'role.permissions_update',
      targetType: 'role',
      targetId: role,
      details: {
        role,
        permissionsCount: cleanPermissions.length,
        permissions: cleanPermissions,
      },
      schoolId,
    });

    return res.json({
      message: `Permissions for role '${role}' updated successfully.`,
      rolePermission: {
        role: updated.role,
        permissions: updated.permissions,
      },
    });
  } catch (error) {
    console.error('updateRolePermissions error:', error);
    return res.status(500).json({ error: 'Failed to update role permissions.' });
  }
}

module.exports = {
  getRoles,
  updateRolePermissions,
};
