const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const {
  isRateLimited,
  recordFailedAttempt,
  resetFailedAttempts,
  getRemainingTimeMinutes,
} = require('../services/loginRateLimiter');
const { getRolePermissions } = require('../services/permissionCache');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_learnmate_2026';

const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

async function login(req, res) {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { email, password } = parseResult.data;
    const cleanEmail = email.toLowerCase().trim();

    if (isRateLimited(cleanEmail)) {
      const waitMinutes = getRemainingTimeMinutes(cleanEmail);
      return res.status(429).json({
        error: `Too many failed login attempts. Please try again after ${waitMinutes} minute(s).`,
      });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      recordFailedAttempt(cleanEmail);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      recordFailedAttempt(cleanEmail);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ error: 'Your account is disabled. Please contact the administrator.' });
    }

    resetFailedAttempts(cleanEmail);

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role, schoolId: user.schoolId },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    const permissions = await getRolePermissions(user.role, user.schoolId);

    return res.json({
      message: 'Login successful',
      token, // Also returned for API test clients
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        mustChangePassword: user.mustChangePassword,
        schoolId: user.schoolId,
        admissionNo: user.admissionNo,
        classId: user.classId,
        sectionId: user.sectionId,
        childIds: user.childIds,
      },
      permissions,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred during login.' });
  }
}

async function logout(req, res) {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
  });
  return res.json({ message: 'Logged out successfully.' });
}

async function getMe(req, res) {
  try {
    const user = req.user;
    const permissions = await getRolePermissions(user.role, user.schoolId);
    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        mustChangePassword: user.mustChangePassword,
        schoolId: user.schoolId,
        admissionNo: user.admissionNo,
        classId: user.classId,
        sectionId: user.sectionId,
        childIds: user.childIds,
      },
      permissions,
    });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({ error: 'Failed to retrieve current user information.' });
  }
}

async function changePassword(req, res) {
  try {
    const parseResult = changePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { currentPassword, newPassword } = parseResult.data;
    const user = req.user;

    // If user is not flagged with mustChangePassword, they must provide their current password
    if (!user.mustChangePassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password does not match.' });
      }
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await user.save();

    await AuditLog.create({
      actorId: user._id,
      action: 'user.password_change',
      targetType: 'user',
      targetId: user._id,
      details: { email: user.email, selfChange: true },
      schoolId: user.schoolId,
    });

    return res.json({
      message: 'Password changed successfully. You may now continue using the application.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: false,
      },
    });
  } catch (error) {
    console.error('changePassword error:', error);
    return res.status(500).json({ error: 'Failed to change password.' });
  }
}

module.exports = {
  login,
  logout,
  getMe,
  changePassword,
};
