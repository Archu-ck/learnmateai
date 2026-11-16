const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { Readable } = require('stream');
const csvParser = require('csv-parser');
const User = require('../models/User');
const Class = require('../models/Class');
const AuditLog = require('../models/AuditLog');
const { generateTempPassword } = require('../services/tempPassword');
const { sendTemporaryPasswordEmail } = require('../services/mailer');

const VALID_ROLES = ['admin', 'principal', 'coordinator', 'teacher', 'counsellor', 'student', 'parent'];

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  role: z.enum(VALID_ROLES, { errorMap: () => ({ message: `Role must be one of: ${VALID_ROLES.join(', ')}` }) }),
  status: z.enum(['active', 'disabled']).optional().default('active'),
  admissionNo: z.string().optional(),
  classId: z.string().optional().nullable(),
  sectionId: z.string().optional().nullable(),
  childIds: z.array(z.string()).optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(VALID_ROLES).optional(),
  status: z.enum(['active', 'disabled']).optional(),
  admissionNo: z.string().optional().nullable(),
  classId: z.string().optional().nullable(),
  sectionId: z.string().optional().nullable(),
  childIds: z.array(z.string()).optional(),
});

async function createUser(req, res) {
  try {
    const parseResult = createUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const data = parseResult.data;
    const cleanEmail = data.email.toLowerCase().trim();
    const schoolId = req.user.schoolId;

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ error: 'A user with this email address already exists.' });
    }

    const temporaryPassword = generateTempPassword(10);
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    const newUser = await User.create({
      name: data.name.trim(),
      email: cleanEmail,
      passwordHash,
      role: data.role,
      status: data.status || 'active',
      mustChangePassword: true,
      schoolId,
      admissionNo: data.admissionNo,
      classId: data.classId || null,
      sectionId: data.sectionId || null,
      childIds: data.childIds || [],
    });

    // Attempt to send email (won't crash if fails)
    await sendTemporaryPasswordEmail({
      to: cleanEmail,
      name: data.name,
      temporaryPassword,
    });

    await AuditLog.create({
      actorId: req.user._id,
      action: 'user.create',
      targetType: 'user',
      targetId: newUser._id.toString(),
      details: {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
      schoolId,
    });

    return res.status(201).json({
      message: 'User created successfully.',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        mustChangePassword: newUser.mustChangePassword,
        schoolId: newUser.schoolId,
        admissionNo: newUser.admissionNo,
        classId: newUser.classId,
        sectionId: newUser.sectionId,
        childIds: newUser.childIds,
      },
      temporaryPassword, // Returned once so admin can copy it
    });
  } catch (error) {
    console.error('createUser error:', error);
    return res.status(500).json({ error: 'Failed to create user.' });
  }
}

async function getUsers(req, res) {
  try {
    const schoolId = req.user.schoolId;
    const { search, role, status, page = 1, limit = 10, classId } = req.query;

    const query = { schoolId };

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }, { admissionNo: regex }];
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (classId) {
      query.classId = classId;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query)
        .populate('classId', 'name sections')
        .populate('childIds', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
    ]);

    const formattedUsers = users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      mustChangePassword: u.mustChangePassword,
      admissionNo: u.admissionNo,
      classId: u.classId?._id || u.classId,
      className: u.classId?.name || null,
      sectionId: u.sectionId,
      childIds: u.childIds || [],
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
    }));

    return res.json({
      users: formattedUsers,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (error) {
    console.error('getUsers error:', error);
    return res.status(500).json({ error: 'Failed to retrieve users.' });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const parseResult = updateUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const updates = parseResult.data;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isSelf = user._id.toString() === req.user._id.toString();

    // Self-modification safeguards
    if (isSelf) {
      if (updates.status && updates.status !== 'active') {
        return res.status(400).json({ error: 'Administrators cannot disable their own account.' });
      }
      if (updates.role && updates.role !== 'admin') {
        return res.status(400).json({ error: 'Administrators cannot demote their own account.' });
      }
    }

    // Last active admin protection
    if (user.role === 'admin') {
      const willDemote = updates.role && updates.role !== 'admin';
      const willDisable = updates.status && updates.status === 'disabled';

      if (willDemote || willDisable) {
        const activeAdminCount = await User.countDocuments({
          role: 'admin',
          status: 'active',
          schoolId: req.user.schoolId,
        });

        if (activeAdminCount <= 1) {
          return res.status(400).json({
            error: 'Cannot disable or demote the last active administrator account.',
          });
        }
      }
    }

    // Email uniqueness check if email is modified
    if (updates.email && updates.email.toLowerCase().trim() !== user.email) {
      const cleanEmail = updates.email.toLowerCase().trim();
      const duplicate = await User.findOne({ email: cleanEmail });
      if (duplicate) {
        return res.status(400).json({ error: 'Email address is already in use by another account.' });
      }
      user.email = cleanEmail;
    }

    if (updates.name) user.name = updates.name.trim();

    // Check if role is changing
    let roleChanged = false;
    let oldRole = user.role;
    if (updates.role && updates.role !== user.role) {
      roleChanged = true;
      user.role = updates.role;
    }

    if (updates.status) user.status = updates.status;
    if (updates.admissionNo !== undefined) user.admissionNo = updates.admissionNo;
    if (updates.classId !== undefined) user.classId = updates.classId;
    if (updates.sectionId !== undefined) user.sectionId = updates.sectionId;
    if (updates.childIds !== undefined) user.childIds = updates.childIds;

    await user.save();

    if (roleChanged) {
      await AuditLog.create({
        actorId: req.user._id,
        action: 'user.role_change',
        targetType: 'user',
        targetId: user._id.toString(),
        details: { oldRole, newRole: user.role, email: user.email },
        schoolId: req.user.schoolId,
      });
    }

    await AuditLog.create({
      actorId: req.user._id,
      action: 'user.edit',
      targetType: 'user',
      targetId: user._id.toString(),
      details: { updates },
      schoolId: req.user.schoolId,
    });

    return res.json({
      message: 'User updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        admissionNo: user.admissionNo,
        classId: user.classId,
        sectionId: user.sectionId,
        childIds: user.childIds,
      },
    });
  } catch (error) {
    console.error('updateUser error:', error);
    return res.status(500).json({ error: 'Failed to update user.' });
  }
}

async function resetPassword(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const temporaryPassword = generateTempPassword(10);
    user.passwordHash = await bcrypt.hash(temporaryPassword, 10);
    user.mustChangePassword = true;
    await user.save();

    await sendTemporaryPasswordEmail({
      to: user.email,
      name: user.name,
      temporaryPassword,
    });

    await AuditLog.create({
      actorId: req.user._id,
      action: 'user.password_reset',
      targetType: 'user',
      targetId: user._id.toString(),
      details: { email: user.email },
      schoolId: req.user.schoolId,
    });

    return res.json({
      message: 'Password reset successfully.',
      temporaryPassword,
    });
  } catch (error) {
    console.error('resetPassword error:', error);
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
}

async function disableUser(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Administrators cannot disable their own account.' });
    }

    if (user.role === 'admin') {
      const activeAdminCount = await User.countDocuments({
        role: 'admin',
        status: 'active',
        schoolId: req.user.schoolId,
      });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          error: 'Cannot disable the last active administrator account.',
        });
      }
    }

    user.status = 'disabled';
    await user.save();

    await AuditLog.create({
      actorId: req.user._id,
      action: 'user.disable',
      targetType: 'user',
      targetId: user._id.toString(),
      details: { email: user.email, role: user.role },
      schoolId: req.user.schoolId,
    });

    return res.json({ message: 'User disabled successfully.', user });
  } catch (error) {
    console.error('disableUser error:', error);
    return res.status(500).json({ error: 'Failed to disable user.' });
  }
}

async function enableUser(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    user.status = 'active';
    await user.save();

    await AuditLog.create({
      actorId: req.user._id,
      action: 'user.enable',
      targetType: 'user',
      targetId: user._id.toString(),
      details: { email: user.email, role: user.role },
      schoolId: req.user.schoolId,
    });

    return res.json({ message: 'User enabled successfully.', user });
  } catch (error) {
    console.error('enableUser error:', error);
    return res.status(500).json({ error: 'Failed to enable user.' });
  }
}

async function parseCSV(streamOrBuffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Buffer.isBuffer(streamOrBuffer)
      ? Readable.from(streamOrBuffer)
      : streamOrBuffer;

    stream
      .pipe(
        csvParser({
          mapHeaders: ({ header }) => header.trim().toLowerCase(),
        })
      )
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}

async function importUsersCSV(req, res) {
  try {
    let csvBuffer;

    if (req.file && req.file.buffer) {
      csvBuffer = req.file.buffer;
    } else if (req.body.csvText) {
      csvBuffer = Buffer.from(req.body.csvText, 'utf-8');
    } else {
      return res.status(400).json({ error: 'Please upload a CSV file or provide csvText in request body.' });
    }

    const rows = await parseCSV(csvBuffer);
    const schoolId = req.user.schoolId;

    const created = [];
    const skippedDuplicates = [];
    const errors = [];
    const seenEmailsInFile = new Set();

    let rowIndex = 1; // 1-based data row counter
    for (const row of rows) {
      rowIndex++;
      const name = row.name?.trim();
      const rawEmail = row.email?.trim();
      const rawRole = row.role?.trim().toLowerCase();
      const className = row.class?.trim();
      const section = row.section?.trim().toUpperCase();
      const admissionNo = row.admissionno?.trim();

      if (!name || !rawEmail || !rawRole) {
        errors.push({
          row: rowIndex,
          email: rawEmail || '(missing email)',
          error: 'Missing required field: name, email, or role',
        });
        continue;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(rawEmail)) {
        errors.push({
          row: rowIndex,
          email: rawEmail,
          error: `Invalid email format '${rawEmail}'`,
        });
        continue;
      }

      if (!VALID_ROLES.includes(rawRole)) {
        errors.push({
          row: rowIndex,
          email: rawEmail,
          error: `Invalid role '${rawRole}'. Must be one of: ${VALID_ROLES.join(', ')}`,
        });
        continue;
      }

      const cleanEmail = rawEmail.toLowerCase();

      // Check duplicates within the uploaded file
      if (seenEmailsInFile.has(cleanEmail)) {
        skippedDuplicates.push({
          row: rowIndex,
          email: cleanEmail,
          reason: 'Duplicate email within same CSV import file',
        });
        continue;
      }
      seenEmailsInFile.add(cleanEmail);

      // Check duplicate in database
      const existingInDb = await User.findOne({ email: cleanEmail });
      if (existingInDb) {
        skippedDuplicates.push({
          row: rowIndex,
          email: cleanEmail,
          reason: 'User email already exists in system',
        });
        continue;
      }

      // Resolve class if provided
      let classId = null;
      if (className) {
        let cls = await Class.findOne({ name: className, schoolId });
        if (!cls) {
          cls = await Class.create({
            name: className,
            sections: section ? [section] : ['A'],
            schoolId,
          });
        } else if (section && !cls.sections.includes(section)) {
          cls.sections.push(section);
          await cls.save();
        }
        classId = cls._id;
      }

      const tempPassword = generateTempPassword(10);
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      const newUser = await User.create({
        name,
        email: cleanEmail,
        passwordHash,
        role: rawRole,
        status: 'active',
        mustChangePassword: true,
        schoolId,
        admissionNo: admissionNo || undefined,
        classId,
        sectionId: section || undefined,
      });

      created.push({
        row: rowIndex,
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        temporaryPassword: tempPassword,
      });
    }

    await AuditLog.create({
      actorId: req.user._id,
      action: 'users.import',
      targetType: 'user',
      targetId: 'csv_import',
      details: {
        createdCount: created.length,
        skippedCount: skippedDuplicates.length,
        errorCount: errors.length,
      },
      schoolId,
    });

    return res.json({
      message: `Import processed: ${created.length} created, ${skippedDuplicates.length} duplicates skipped, ${errors.length} errors.`,
      report: {
        created,
        skippedDuplicates,
        errors,
        summary: {
          totalRows: rows.length,
          createdCount: created.length,
          skippedCount: skippedDuplicates.length,
          errorCount: errors.length,
        },
      },
    });
  } catch (error) {
    console.error('importUsersCSV error:', error);
    return res.status(500).json({ error: 'Failed to process CSV import.' });
  }
}

module.exports = {
  createUser,
  getUsers,
  updateUser,
  resetPassword,
  disableUser,
  enableUser,
  importUsersCSV,
};
