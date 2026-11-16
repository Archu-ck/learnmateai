const RolePermission = require('../models/RolePermission');

// In-memory cache for role permissions
let cache = null; // { [schoolId_role]: Set<string> }

async function loadCache(schoolId) {
  const allRolePerms = await RolePermission.find({ schoolId });
  cache = {};
  for (const rp of allRolePerms) {
    const key = `${rp.schoolId}_${rp.role}`;
    cache[key] = new Set(rp.permissions || []);
  }
  return cache;
}

function invalidatePermissionCache() {
  cache = null;
  console.log('RolePermission cache invalidated.');
}

async function hasPermission(role, permissionKey, schoolId) {
  if (!cache) {
    await loadCache(schoolId);
  }
  const key = `${schoolId}_${role}`;
  const perms = cache[key];
  if (!perms) {
    // If not found in cache, reload once
    await loadCache(schoolId);
    return cache[key] ? cache[key].has(permissionKey) : false;
  }
  return perms.has(permissionKey);
}

async function getRolePermissions(role, schoolId) {
  if (!cache) {
    await loadCache(schoolId);
  }
  const key = `${schoolId}_${role}`;
  return cache[key] ? Array.from(cache[key]) : [];
}

module.exports = {
  hasPermission,
  getRolePermissions,
  invalidatePermissionCache,
};
