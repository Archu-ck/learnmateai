const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { hasPermission } = require('../services/permissionCache');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_learnmate_2026';

async function requireAuth(req, res, next) {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User account not found.' });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ error: 'Your account is disabled. Please contact the administrator.' });
    }

    req.user = user;

    // If password change is required, only allow change-password, me, and logout
    const allowedPathsWhenMustChange = ['/api/auth/change-password', '/api/auth/me', '/api/auth/logout'];
    if (user.mustChangePassword && !allowedPathsWhenMustChange.some(p => req.originalUrl.startsWith(p))) {
      return res.status(403).json({
        error: 'Password change required before accessing system features.',
        mustChangePassword: true,
      });
    }

    next();
  } catch (error) {
    console.error('requireAuth error:', error);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of the following roles: ${roles.join(', ')}`,
      });
    }
    next();
  };
}

function requirePermission(permissionKey) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const permitted = await hasPermission(req.user.role, permissionKey, req.user.schoolId);
    if (!permitted) {
      return res.status(403).json({
        error: `Forbidden: Missing required permission '${permissionKey}'`,
      });
    }
    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
  requirePermission,
};
