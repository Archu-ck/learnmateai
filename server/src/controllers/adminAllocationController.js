const Class = require('../models/Class');
const Subject = require('../models/Subject');
const User = require('../models/User');
const TeacherAssignment = require('../models/TeacherAssignment');
const StudentSubject = require('../models/StudentSubject');
const AuditLog = require('../models/AuditLog');

// Get overview data: list of classes
async function getClassesOverview(req, res) {
  try {
    const schoolId = req.user.schoolId;
    const classes = await Class.find({ schoolId }).sort({ name: 1 }).lean();
    return res.json({ classes });
  } catch (error) {
    console.error('getClassesOverview error:', error);
    return res.status(500).json({ error: 'Failed to retrieve classes' });
  }
}

// Get full allocation details for a specific class
async function getClassAllocationData(req, res) {
  try {
    const schoolId = req.user.schoolId;
    const { classId } = req.params;

    const cls = await Class.findOne({ _id: classId, schoolId }).lean();
    if (!cls) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // 1. Subjects assigned to this class
    const subjects = await Subject.find({ classIds: classId, schoolId })
      .sort({ isElective: 1, name: 1 })
      .lean();

    // 2. All teachers in the school for dropdowns
    const teachers = await User.find({ role: 'teacher', schoolId })
      .select('name email')
      .sort({ name: 1 })
      .lean();

    // 3. Teacher assignments for this class
    const teacherAssignments = await TeacherAssignment.find({ classId, schoolId })
      .populate('teacherId', 'name email')
      .populate('subjectId', 'name code')
      .lean();

    // 4. All students enrolled in this class
    const students = await User.find({ role: 'student', classId, schoolId })
      .select('name email admissionNumber rollNumber sectionId')
      .sort({ sectionId: 1, name: 1 })
      .lean();

    // 5. Existing StudentSubject allocations for these students
    const studentIds = students.map((s) => s._id);
    const existingAllocations = await StudentSubject.find({
      studentId: { $in: studentIds },
      schoolId,
    }).lean();

    // Map studentId -> Set of enrolled subjectIds
    const studentEnrollments = {};
    for (const student of students) {
      studentEnrollments[student._id.toString()] = [];
    }
    for (const alloc of existingAllocations) {
      const sId = alloc.studentId.toString();
      if (studentEnrollments[sId]) {
        studentEnrollments[sId].push(alloc.subjectId.toString());
      }
    }

    return res.json({
      class: cls,
      subjects: subjects.map((s) => ({
        id: s._id,
        name: s.name,
        code: s.code,
        isElective: !!s.isElective,
      })),
      teachers: teachers.map((t) => ({
        id: t._id,
        name: t.name,
        email: t.email,
      })),
      teacherAssignments: teacherAssignments.map((ta) => ({
        id: ta._id,
        teacherId: ta.teacherId?._id || ta.teacherId,
        teacherName: ta.teacherId?.name || 'Unassigned',
        subjectId: ta.subjectId?._id || ta.subjectId,
        subjectName: ta.subjectId?.name || '',
        section: ta.section,
        isClassTeacher: ta.isClassTeacher,
      })),
      students: students.map((st) => ({
        id: st._id,
        name: st.name,
        email: st.email,
        admissionNumber: st.admissionNumber,
        rollNumber: st.rollNumber,
        section: st.sectionId || 'A',
        enrolledSubjectIds: studentEnrollments[st._id.toString()] || [],
      })),
    });
  } catch (error) {
    console.error('getClassAllocationData error:', error);
    return res.status(500).json({ error: 'Failed to retrieve class allocation data' });
  }
}

// Update subject compulsory vs elective
async function updateSubjectType(req, res) {
  try {
    const schoolId = req.user.schoolId;
    const { subjectId, isElective } = req.body;

    const subject = await Subject.findOne({ _id: subjectId, schoolId });
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    subject.isElective = !!isElective;
    await subject.save();

    // If changing to compulsory (isElective === false), ensure all students in its classes have it
    if (!isElective) {
      for (const classId of subject.classIds) {
        const students = await User.find({ role: 'student', classId, schoolId }).select('_id');
        for (const st of students) {
          await StudentSubject.findOneAndUpdate(
            { studentId: st._id, subjectId: subject._id },
            {
              studentId: st._id,
              subjectId: subject._id,
              classId,
              isElective: false,
              schoolId,
            },
            { upsert: true, new: true }
          );
        }
      }
    }

    await AuditLog.create({
      actorId: req.user._id,
      action: 'subject.type_update',
      targetType: 'subject',
      targetId: subject._id.toString(),
      details: { name: subject.name, isElective: subject.isElective },
      schoolId,
    });

    return res.json({ message: 'Subject type updated', subject });
  } catch (error) {
    console.error('updateSubjectType error:', error);
    return res.status(500).json({ error: 'Failed to update subject type' });
  }
}

// Assign or update teacher assignment for class + section + subject
async function assignSubjectTeacher(req, res) {
  try {
    const schoolId = req.user.schoolId;
    const { classId, section, subjectId, teacherId } = req.body;

    if (!classId || !section || !subjectId) {
      return res.status(400).json({ error: 'Class, section, and subject are required.' });
    }

    const cleanSection = section.trim().toUpperCase();

    // If teacherId is null or empty, remove existing assignment
    if (!teacherId) {
      await TeacherAssignment.findOneAndDelete({
        classId,
        section: cleanSection,
        subjectId,
        schoolId,
      });
      return res.json({ message: 'Teacher assignment removed.' });
    }

    const teacher = await User.findOne({ _id: teacherId, schoolId, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const assignment = await TeacherAssignment.findOneAndUpdate(
      { classId, section: cleanSection, subjectId, schoolId },
      { teacherId, classId, section: cleanSection, subjectId, schoolId },
      { upsert: true, new: true }
    );

    await AuditLog.create({
      actorId: req.user._id,
      action: 'teachers.assign',
      targetType: 'assignment',
      targetId: assignment._id.toString(),
      details: {
        teacherName: teacher.name,
        section: cleanSection,
        subjectId,
      },
      schoolId,
    });

    return res.json({ message: 'Teacher assigned successfully', assignment });
  } catch (error) {
    console.error('assignSubjectTeacher error:', error);
    return res.status(500).json({ error: 'Failed to assign teacher' });
  }
}

// Bulk save student-by-subject enrollment matrix
async function saveAllocationMatrix(req, res) {
  try {
    const schoolId = req.user.schoolId;
    const { classId, allocations } = req.body;

    if (!classId || !Array.isArray(allocations)) {
      return res.status(400).json({ error: 'classId and allocations array are required.' });
    }

    const subjects = await Subject.find({ classIds: classId, schoolId }).lean();
    const subjectMap = new Map(subjects.map((s) => [s._id.toString(), s]));

    for (const alloc of allocations) {
      const { studentId, subjectIds } = alloc;
      if (!studentId || !Array.isArray(subjectIds)) continue;

      const currentEnrolled = await StudentSubject.find({ studentId, schoolId });
      const currentMap = new Map(currentEnrolled.map((e) => [e.subjectId.toString(), e]));

      // 1. Add missing enrolled subjects
      for (const subId of subjectIds) {
        const sub = subjectMap.get(subId);
        if (!sub) continue;

        if (!currentMap.has(subId)) {
          await StudentSubject.create({
            studentId,
            subjectId: sub._id,
            classId,
            isElective: !!sub.isElective,
            schoolId,
          });
        }
      }

      // 2. Remove unchecked subjects (only if elective, or if removed by admin)
      for (const [existingSubId, existingDoc] of currentMap.entries()) {
        if (!subjectIds.includes(existingSubId)) {
          const sub = subjectMap.get(existingSubId);
          // Only remove if it's an elective (compulsory subjects remain locked or can be explicitly managed)
          if (sub && sub.isElective) {
            await StudentSubject.findByIdAndDelete(existingDoc._id);
          }
        }
      }
    }

    await AuditLog.create({
      actorId: req.user._id,
      action: 'subject.allocation_matrix_save',
      targetType: 'class',
      targetId: classId,
      details: { studentCount: allocations.length },
      schoolId,
    });

    return res.json({ message: 'Subject allocations saved successfully.' });
  } catch (error) {
    console.error('saveAllocationMatrix error:', error);
    return res.status(500).json({ error: 'Failed to save subject allocations.' });
  }
}

// Toggle a single student subject enrollment
async function toggleStudentSubject(req, res) {
  try {
    const schoolId = req.user.schoolId;
    const { studentId, subjectId, classId, enrolled } = req.body;

    const subject = await Subject.findOne({ _id: subjectId, schoolId });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    if (enrolled) {
      await StudentSubject.findOneAndUpdate(
        { studentId, subjectId, schoolId },
        {
          studentId,
          subjectId,
          classId,
          isElective: !!subject.isElective,
          schoolId,
        },
        { upsert: true, new: true }
      );
    } else {
      await StudentSubject.findOneAndDelete({ studentId, subjectId, schoolId });
    }

    return res.json({ message: 'Enrollment updated successfully.' });
  } catch (error) {
    console.error('toggleStudentSubject error:', error);
    return res.status(500).json({ error: 'Failed to toggle student subject.' });
  }
}

module.exports = {
  getClassesOverview,
  getClassAllocationData,
  updateSubjectType,
  assignSubjectTeacher,
  saveAllocationMatrix,
  toggleStudentSubject,
};
