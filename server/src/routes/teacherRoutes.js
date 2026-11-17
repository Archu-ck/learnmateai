const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { requireTeacherAssigned } = require('../middleware/scopeGuard');
const {
  getMyClasses,
  getClassWorkspace,
  createTeacherAssignment,
  getWorkloadCheck,
  getAssignmentSubmissions,
  gradeStudentSubmission,
  getQuestionBank,
  createQuestion,
  createTeacherTest,
  getTestAnalytics,
  createTeacherLesson,
  markAttendance,
  getTeacherDashboard,
} = require('../controllers/teacherController');

router.use(requireAuth);
router.use(requireRole('teacher'));

// Dashboard
router.get('/dashboard', getTeacherDashboard);

// Classes & Workspaces
router.get('/classes', getMyClasses);
router.get('/classes/:id', getClassWorkspace);

// Workload Check
router.get('/workload', getWorkloadCheck);

// Assignments & Grading
router.post('/assignments', createTeacherAssignment);
router.get('/assignments/:id/submissions', getAssignmentSubmissions);
router.post('/submissions/:id/grade', gradeStudentSubmission);

// Tests & Question Bank & AI Test Builder
router.get('/questions', getQuestionBank);
router.post('/questions', createQuestion);
router.post('/tests', createTeacherTest);
router.get('/tests/:id/analytics', getTestAnalytics);

// AI Test Generation
const {
  generateTestAI,
  regenerateSingleQuestion,
  saveDraftEdits,
  saveToQuestionBank,
  publishTest,
} = require('../controllers/aiTestGeneratorController');

router.post('/tests/generate-ai', generateTestAI);
router.post('/tests/regenerate-question', regenerateSingleQuestion);
router.post('/tests/save-draft', saveDraftEdits);
router.post('/tests/save-to-bank', saveToQuestionBank);
router.post('/tests/publish-ai-test', publishTest);

// Lessons
router.post('/lessons', createTeacherLesson);

// Attendance
router.post('/attendance', markAttendance);

module.exports = router;
