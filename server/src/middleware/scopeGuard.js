const StudentSubject = require('../models/StudentSubject');
const TeacherAssignment = require('../models/TeacherAssignment');
const User = require('../models/User');

// Middleware to ensure a student is enrolled in a specific subject
function requireStudentSubjectEnrolled(getSubjectId = (req) => req.params.subjectId || req.body.subjectId || req.query.subjectId) {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'admin' || req.user.role === 'principal') {
        return next();
      }

      if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Access denied: Student access required' });
      }

      const subjectId = getSubjectId(req);
      if (!subjectId) {
        return res.status(400).json({ error: 'Subject ID is required for verification' });
      }

      const enrollment = await StudentSubject.findOne({
        studentId: req.user._id,
        subjectId,
        schoolId: req.user.schoolId,
      });

      if (!enrollment) {
        return res.status(403).json({
          error: 'Access denied: You are not enrolled in this subject.',
        });
      }

      req.enrollment = enrollment;
      next();
    } catch (err) {
      console.error('requireStudentSubjectEnrolled error:', err);
      return res.status(500).json({ error: 'Failed to verify subject enrollment' });
    }
  };
}

// Middleware to ensure a teacher is assigned to a specific class-section-subject
function requireTeacherAssigned() {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'admin' || req.user.role === 'principal') {
        return next();
      }

      if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Access denied: Teacher access required' });
      }

      const assignmentId = req.params.assignmentId;
      if (assignmentId) {
        const assignment = await TeacherAssignment.findOne({
          _id: assignmentId,
          teacherId: req.user._id,
          schoolId: req.user.schoolId,
        });

        if (!assignment) {
          return res.status(403).json({
            error: 'Access denied: You are not assigned to this class-section-subject.',
          });
        }
        req.teacherAssignment = assignment;
        return next();
      }

      // Or by classId, section, subjectId
      const classId = req.body.classId || req.query.classId || req.params.classId;
      const section = req.body.section || req.query.section || req.params.section;
      const subjectId = req.body.subjectId || req.query.subjectId || req.params.subjectId;

      if (classId && section && subjectId) {
        const assignment = await TeacherAssignment.findOne({
          teacherId: req.user._id,
          classId,
          section: section.trim().toUpperCase(),
          subjectId,
          schoolId: req.user.schoolId,
        });

        if (!assignment) {
          return res.status(403).json({
            error: 'Access denied: You are not assigned to this class-section-subject.',
          });
        }
        req.teacherAssignment = assignment;
      }

      next();
    } catch (err) {
      console.error('requireTeacherAssigned error:', err);
      return res.status(500).json({ error: 'Failed to verify teacher assignment' });
    }
  };
}

// Middleware to ensure a student cannot access another student's private data
function requireStudentSelf(getStudentId = (req) => req.params.studentId || req.query.studentId || req.body.studentId) {
  return (req, res, next) => {
    if (req.user.role === 'admin' || req.user.role === 'principal' || req.user.role === 'teacher') {
      return next();
    }

    const targetStudentId = getStudentId(req);
    if (targetStudentId && targetStudentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: "Access denied: Forbidden to access another student's data.",
      });
    }

    next();
  };
}

module.exports = {
  requireStudentSubjectEnrolled,
  requireTeacherAssigned,
  requireStudentSelf,
};
