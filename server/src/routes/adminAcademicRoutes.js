const express = require('express');
const router = express.Router();
const { requireAuth, requireRole, requirePermission } = require('../middleware/auth');
const {
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
} = require('../controllers/adminAcademicController');

router.use(requireAuth);

router.get('/stats', requireRole('admin'), getDashboardStats);

// Classes
router.get('/classes', requirePermission('classes.manage'), getClasses);
router.post('/classes', requirePermission('classes.manage'), createClass);
router.patch('/classes/:id', requirePermission('classes.manage'), updateClass);
router.delete('/classes/:id', requirePermission('classes.manage'), deleteClass);

// Subjects
router.get('/subjects', requirePermission('subjects.manage'), getSubjects);
router.post('/subjects', requirePermission('subjects.manage'), createSubject);
router.patch('/subjects/:id', requirePermission('subjects.manage'), updateSubject);
router.delete('/subjects/:id', requirePermission('subjects.manage'), deleteSubject);

// Teacher Assignments
router.get('/teacher-assignments', getTeacherAssignments);
router.post('/teacher-assignments', requirePermission('teachers.assign'), createTeacherAssignment);
router.delete('/teacher-assignments/:id', requirePermission('teachers.assign'), deleteTeacherAssignment);

// Enrollment
router.post('/enrol', requirePermission('students.enrol'), enrolStudents);

// Parent Links
router.get('/parent-links', requirePermission('parents.link'), getParentLinks);
router.post('/parent-links', requirePermission('parents.link'), linkParent);

module.exports = router;
