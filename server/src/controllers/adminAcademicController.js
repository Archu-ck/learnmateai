const { z } = require('zod');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const User = require('../models/User');
const TeacherAssignment = require('../models/TeacherAssignment');
const AuditLog = require('../models/AuditLog');

// Validation schemas
const classSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  sections: z.array(z.string()).min(1, 'At least one section is required'),
  academicYear: z.string().optional().default('2026-2027'),
});

const subjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  code: z.string().min(1, 'Subject code is required'),
  classIds: z.array(z.string()).optional().default([]),
});

const teacherAssignmentSchema = z.object({
  teacherId: z.string().min(1, 'Teacher ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
  section: z.string().min(1, 'Section is required'),
  subjectId: z.string().optional().nullable(),
  isClassTeacher: z.boolean().optional().default(false),
});

const enrolSchema = z.object({
  studentIds: z.array(z.string()).min(1, 'At least one student must be selected'),
  classId: z.string().min(1, 'Class ID is required'),
  sectionId: z.string().min(1, 'Section is required'),
});

const parentLinkSchema = z.object({
  parentId: z.string().min(1, 'Parent ID is required'),
  studentIds: z.array(z.string()).min(1, 'At least one student ID is required'),
});

// --- Classes ---
async function getClasses(req, res) {
  try {
    const schoolId = req.user.schoolId;
    const classes = await Class.find({ schoolId }).sort({ name: 1 }).lean();

    // Include student counts per class
    const counts = await User.aggregate([
      { $match: { schoolId, role: 'student', classId: { $ne: null } } },
      { $group: { _id: '$classId', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    for (const c of counts) {
      countMap[c._id.toString()] = c.count;
    }

    const result = classes.map((cls) => ({
      id: cls._id,
      name: cls.name,
      sections: cls.sections,
      academicYear: cls.academicYear,
      studentCount: countMap[cls._id.toString()] || 0,
      createdAt: cls.createdAt,
    }));

    return res.json({ classes: result });
  } catch (error) {
    console.error('getClasses error:', error);
    return res.status(500).json({ error: 'Failed to retrieve classes.' });
  }
}

async function createClass(req, res) {
  try {
    const parseResult = classSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { name, sections, academicYear } = parseResult.data;
    const schoolId = req.user.schoolId;

    const existing = await Class.findOne({ name: name.trim(), schoolId });
    if (existing) {
      return res.status(400).json({ error: `Class '${name}' already exists.` });
    }

    const cleanSections = Array.from(new Set(sections.map((s) => s.trim().toUpperCase())));

    const newClass = await Class.create({
      name: name.trim(),
      sections: cleanSections,
      academicYear: academicYear || '2026-2027',
      schoolId,
    });

    await AuditLog.create({
      actorId: req.user._id,
      action: 'class.create',
      targetType: 'class',
      targetId: newClass._id.toString(),
      details: { name: newClass.name, sections: newClass.sections },
      schoolId,
    });

    return res.status(201).json({
      message: 'Class created successfully.',
      class: {
        id: newClass._id,
        name: newClass.name,
        sections: newClass.sections,
        academicYear: newClass.academicYear,
      },
    });
  } catch (error) {
    console.error('createClass error:', error);
    return res.status(500).json({ error: 'Failed to create class.' });
  }
}

async function updateClass(req, res) {
  try {
    const { id } = req.params;
    const cls = await Class.findById(id);
    if (!cls) return res.status(404).json({ error: 'Class not found.' });

    const { name, sections, academicYear } = req.body;
    if (name) cls.name = name.trim();
    if (sections && Array.isArray(sections)) {
      cls.sections = Array.from(new Set(sections.map((s) => s.trim().toUpperCase())));
    }
    if (academicYear) cls.academicYear = academicYear;

    await cls.save();

    await AuditLog.create({
      actorId: req.user._id,
      action: 'class.edit',
      targetType: 'class',
      targetId: cls._id.toString(),
      details: { name: cls.name, sections: cls.sections },
      schoolId: req.user.schoolId,
    });

    return res.json({ message: 'Class updated successfully.', class: cls });
  } catch (error) {
    console.error('updateClass error:', error);
    return res.status(500).json({ error: 'Failed to update class.' });
  }
}

async function deleteClass(req, res) {
  try {
    const { id } = req.params;
    const cls = await Class.findByIdAndDelete(id);
    if (!cls) return res.status(404).json({ error: 'Class not found.' });

    await AuditLog.create({
      actorId: req.user._id,
      action: 'class.delete',
      targetType: 'class',
      targetId: id,
      details: { name: cls.name },
      schoolId: req.user.schoolId,
    });

    return res.json({ message: 'Class deleted successfully.' });
  } catch (error) {
    console.error('deleteClass error:', error);
    return res.status(500).json({ error: 'Failed to delete class.' });
  }
}

// --- Subjects ---
async function getSubjects(req, res) {
  try {
    const schoolId = req.user.schoolId;
    const subjects = await Subject.find({ schoolId })
      .populate('classIds', 'name sections')
      .sort({ name: 1 })
      .lean();

    const formatted = subjects.map((s) => ({
      id: s._id,
      name: s.name,
      code: s.code,
      classes: s.classIds.map((c) => ({ id: c._id, name: c.name })),
      createdAt: s.createdAt,
    }));

    return res.json({ subjects: formatted });
  } catch (error) {
    console.error('getSubjects error:', error);
    return res.status(500).json({ error: 'Failed to retrieve subjects.' });
  }
}

async function createSubject(req, res) {
  try {
    const parseResult = subjectSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { name, code, classIds } = parseResult.data;
    const schoolId = req.user.schoolId;

    const existing = await Subject.findOne({ code: code.toUpperCase().trim(), schoolId });
    if (existing) {
      return res.status(400).json({ error: `Subject code '${code}' already exists.` });
    }

    const newSubject = await Subject.create({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      classIds: classIds || [],
      schoolId,
    });

    await AuditLog.create({
      actorId: req.user._id,
      action: 'subject.create',
      targetType: 'subject',
      targetId: newSubject._id.toString(),
      details: { name: newSubject.name, code: newSubject.code },
      schoolId,
    });

    return res.status(201).json({
      message: 'Subject created successfully.',
      subject: newSubject,
    });
  } catch (error) {
    console.error('createSubject error:', error);
    return res.status(500).json({ error: 'Failed to create subject.' });
  }
}

async function updateSubject(req, res) {
  try {
    const { id } = req.params;
    const subject = await Subject.findById(id);
    if (!subject) return res.status(404).json({ error: 'Subject not found.' });

    const { name, code, classIds } = req.body;
    if (name) subject.name = name.trim();
    if (code) subject.code = code.toUpperCase().trim();
    if (classIds) subject.classIds = classIds;

    await subject.save();

    await AuditLog.create({
      actorId: req.user._id,
      action: 'subject.edit',
      targetType: 'subject',
      targetId: subject._id.toString(),
      details: { name: subject.name, code: subject.code },
      schoolId: req.user.schoolId,
    });

    return res.json({ message: 'Subject updated successfully.', subject });
  } catch (error) {
    console.error('updateSubject error:', error);
    return res.status(500).json({ error: 'Failed to update subject.' });
  }
}

async function deleteSubject(req, res) {
  try {
    const { id } = req.params;
    const subject = await Subject.findByIdAndDelete(id);
    if (!subject) return res.status(404).json({ error: 'Subject not found.' });

    await AuditLog.create({
      actorId: req.user._id,
      action: 'subject.delete',
      targetType: 'subject',
      targetId: id,
      details: { name: subject.name, code: subject.code },
      schoolId: req.user.schoolId,
    });

    return res.json({ message: 'Subject deleted successfully.' });
  } catch (error) {
    console.error('deleteSubject error:', error);
    return res.status(500).json({ error: 'Failed to delete subject.' });
  }
}

// --- Teacher Assignments ---
async function getTeacherAssignments(req, res) {
  try {
    const schoolId = req.user.schoolId;
    const { classId, section, teacherId } = req.query;

    const query = { schoolId };
    if (classId) query.classId = classId;
    if (section) query.section = section.toUpperCase();
    if (teacherId) query.teacherId = teacherId;

    const assignments = await TeacherAssignment.find(query)
      .populate('teacherId', 'name email role')
      .populate('classId', 'name sections')
      .populate('subjectId', 'name code')
      .lean();

    const formatted = assignments.map((a) => ({
      id: a._id,
      teacher: a.teacherId ? { id: a.teacherId._id, name: a.teacherId.name, email: a.teacherId.email } : null,
      class: a.classId ? { id: a.classId._id, name: a.classId.name } : null,
      section: a.section,
      subject: a.subjectId ? { id: a.subjectId._id, name: a.subjectId.name, code: a.subjectId.code } : null,
      isClassTeacher: a.isClassTeacher,
      createdAt: a.createdAt,
    }));

    return res.json({ assignments: formatted });
  } catch (error) {
    console.error('getTeacherAssignments error:', error);
    return res.status(500).json({ error: 'Failed to retrieve teacher assignments.' });
  }
}

async function createTeacherAssignment(req, res) {
  try {
    const parseResult = teacherAssignmentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { teacherId, classId, section, subjectId, isClassTeacher } = parseResult.data;
    const schoolId = req.user.schoolId;
    const cleanSection = section.trim().toUpperCase();

    // Verify teacher
    const teacher = await User.findOne({ _id: teacherId, schoolId });
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher user not found.' });
    }
    if (teacher.role !== 'teacher') {
      return res.status(400).json({ error: 'Assigned user must have the teacher role.' });
    }

    // Verify class
    const cls = await Class.findOne({ _id: classId, schoolId });
    if (!cls) {
      return res.status(404).json({ error: 'Class not found.' });
    }
    if (!cls.sections.includes(cleanSection)) {
      return res.status(400).json({ error: `Section '${cleanSection}' is not defined in class '${cls.name}'.` });
    }

    // Rule: "A class-section can have only one class teacher."
    if (isClassTeacher) {
      const existingClassTeacher = await TeacherAssignment.findOne({
        classId,
        section: cleanSection,
        isClassTeacher: true,
        schoolId,
      }).populate('teacherId', 'name');

      if (existingClassTeacher) {
        if (existingClassTeacher.teacherId._id.toString() !== teacherId) {
          return res.status(400).json({
            error: `Class ${cls.name} Section ${cleanSection} already has a designated class teacher (${existingClassTeacher.teacherId.name}). Only one class teacher is allowed per section.`,
          });
        }
      }
    }

    const assignment = await TeacherAssignment.create({
      teacherId,
      classId,
      section: cleanSection,
      subjectId: subjectId || null,
      isClassTeacher: Boolean(isClassTeacher),
      schoolId,
    });

    await AuditLog.create({
      actorId: req.user._id,
      action: 'teachers.assign',
      targetType: 'assignment',
      targetId: assignment._id.toString(),
      details: {
        teacherName: teacher.name,
        className: cls.name,
        section: cleanSection,
        isClassTeacher,
      },
      schoolId,
    });

    return res.status(201).json({
      message: 'Teacher assignment created successfully.',
      assignment,
    });
  } catch (error) {
    console.error('createTeacherAssignment error:', error);
    return res.status(500).json({ error: 'Failed to create teacher assignment.' });
  }
}

async function deleteTeacherAssignment(req, res) {
  try {
    const { id } = req.params;
    const assignment = await TeacherAssignment.findByIdAndDelete(id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });

    await AuditLog.create({
      actorId: req.user._id,
      action: 'teachers.unassign',
      targetType: 'assignment',
      targetId: id,
      details: { classId: assignment.classId, section: assignment.section },
      schoolId: req.user.schoolId,
    });

    return res.json({ message: 'Teacher assignment removed successfully.' });
  } catch (error) {
    console.error('deleteTeacherAssignment error:', error);
    return res.status(500).json({ error: 'Failed to delete assignment.' });
  }
}

// --- Student Enrollment ---
async function enrolStudents(req, res) {
  try {
    const parseResult = enrolSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { studentIds, classId, sectionId } = parseResult.data;
    const schoolId = req.user.schoolId;
    const cleanSection = sectionId.trim().toUpperCase();

    const cls = await Class.findOne({ _id: classId, schoolId });
    if (!cls) return res.status(404).json({ error: 'Class not found.' });

    if (!cls.sections.includes(cleanSection)) {
      return res.status(400).json({ error: `Section '${cleanSection}' does not exist in class '${cls.name}'.` });
    }

    const updateResult = await User.updateMany(
      { _id: { $in: studentIds }, schoolId, role: 'student' },
      { $set: { classId, sectionId: cleanSection } }
    );

    await AuditLog.create({
      actorId: req.user._id,
      action: 'students.enrol',
      targetType: 'enrollment',
      targetId: classId,
      details: {
        className: cls.name,
        section: cleanSection,
        enrolledCount: updateResult.modifiedCount,
        studentIds,
      },
      schoolId,
    });

    return res.json({
      message: `Successfully enrolled ${updateResult.modifiedCount} student(s) into ${cls.name}-${cleanSection}.`,
      enrolledCount: updateResult.modifiedCount,
    });
  } catch (error) {
    console.error('enrolStudents error:', error);
    return res.status(500).json({ error: 'Failed to enrol students.' });
  }
}

// --- Parent Links ---
async function linkParent(req, res) {
  try {
    const parseResult = parentLinkSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { parentId, studentIds } = parseResult.data;
    const schoolId = req.user.schoolId;

    const parent = await User.findOne({ _id: parentId, schoolId });
    if (!parent) return res.status(404).json({ error: 'Parent not found.' });
    if (parent.role !== 'parent') {
      return res.status(400).json({ error: 'Selected user is not a parent.' });
    }

    // Verify student IDs
    const students = await User.find({ _id: { $in: studentIds }, schoolId, role: 'student' });
    if (students.length === 0) {
      return res.status(400).json({ error: 'No valid student accounts found with provided IDs.' });
    }

    const validStudentIds = students.map((s) => s._id);

    // Link parent to students
    await User.findByIdAndUpdate(parentId, {
      $addToSet: { childIds: { $each: validStudentIds } },
    });

    await AuditLog.create({
      actorId: req.user._id,
      action: 'parents.link',
      targetType: 'parent_link',
      targetId: parentId,
      details: {
        parentName: parent.name,
        studentCount: validStudentIds.length,
        studentNames: students.map((s) => s.name),
      },
      schoolId,
    });

    const updatedParent = await User.findById(parentId).populate('childIds', 'name email role admissionNo');

    return res.json({
      message: `Successfully linked ${validStudentIds.length} student(s) to parent ${parent.name}.`,
      parent: {
        id: updatedParent._id,
        name: updatedParent.name,
        email: updatedParent.email,
        children: updatedParent.childIds,
      },
    });
  } catch (error) {
    console.error('linkParent error:', error);
    return res.status(500).json({ error: 'Failed to link parent to students.' });
  }
}

async function getParentLinks(req, res) {
  try {
    const schoolId = req.user.schoolId;
    const parents = await User.find({ schoolId, role: 'parent' })
      .populate('childIds', 'name email role admissionNo classId sectionId')
      .lean();

    const formatted = parents.map((p) => ({
      id: p._id,
      name: p.name,
      email: p.email,
      children: p.childIds || [],
    }));

    return res.json({ parents: formatted });
  } catch (error) {
    console.error('getParentLinks error:', error);
    return res.status(500).json({ error: 'Failed to retrieve parent links.' });
  }
}

async function getDashboardStats(req, res) {
  try {
    const schoolId = req.user.schoolId;

    const [roleCountsRaw, totalClasses, totalSubjects, recentLogs] = await Promise.all([
      User.aggregate([
        { $match: { schoolId } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      Class.countDocuments({ schoolId }),
      Subject.countDocuments({ schoolId }),
      AuditLog.find({ schoolId })
        .populate('actorId', 'name email role')
        .sort({ timestamp: -1 })
        .limit(6)
        .lean(),
    ]);

    const roleCounts = {
      admin: 0,
      principal: 0,
      coordinator: 0,
      teacher: 0,
      counsellor: 0,
      student: 0,
      parent: 0,
    };

    let totalUsers = 0;
    for (const item of roleCountsRaw) {
      if (roleCounts[item._id] !== undefined) {
        roleCounts[item._id] = item.count;
      }
      totalUsers += item.count;
    }

    const formattedLogs = recentLogs.map((log) => ({
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
      roleCounts,
      totalUsers,
      totalClasses,
      totalSubjects,
      recentLogs: formattedLogs,
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return res.status(500).json({ error: 'Failed to retrieve dashboard statistics.' });
  }
}

module.exports = {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getTeacherAssignments,
  createTeacherAssignment,
  deleteTeacherAssignment,
  enrolStudents,
  linkParent,
  getParentLinks,
  getDashboardStats,
};
