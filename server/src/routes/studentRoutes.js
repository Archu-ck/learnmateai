const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { requireStudentSubjectEnrolled } = require('../middleware/scopeGuard');
const {
  getMySubjects,
  getSubjectWorkspace,
  markLessonRead,
  getStudentAssignments,
  getStudentAssignmentDetail,
  submitStudentAssignment,
  getStudentTests,
  startTestAttempt,
  saveTestAnswer,
  submitTestAttempt,
  getTestResults,
  getStudentTimetable,
  getStudentPlanner,
  saveStudyBlock,
  deleteStudyBlock,
  getStudentProgress,
  getStudentAttendance,
  getStudentDashboard,
} = require('../controllers/studentController');

const {
  generateStudentPracticeQuiz,
  submitPracticeQuiz,
} = require('../controllers/aiTestGeneratorController');

router.use(requireAuth);
router.use(requireRole('student'));

// Dashboard
router.get('/dashboard', getStudentDashboard);

// Subjects
router.get('/subjects', getMySubjects);
router.get('/subjects/:subjectId', requireStudentSubjectEnrolled((req) => req.params.subjectId), getSubjectWorkspace);

// Lessons
router.post('/lessons/:lessonId/read', markLessonRead);

// Assignments
router.get('/assignments', getStudentAssignments);
router.get('/assignments/:id', getStudentAssignmentDetail);
router.post('/assignments/:id/submit', submitStudentAssignment);

// Tests & Practice Quizzes
router.get('/tests', getStudentTests);
router.post('/practice-quiz', generateStudentPracticeQuiz);
router.post('/practice-quiz/submit', submitPracticeQuiz);
router.post('/tests/:id/start', startTestAttempt);
router.post('/tests/:id/answer', saveTestAnswer);
router.post('/tests/:id/save-answer', saveTestAnswer);
router.post('/tests/:id/submit', submitTestAttempt);
router.get('/tests/:id/results', getTestResults);

// Timetable
router.get('/timetable', getStudentTimetable);

// Study Planner
router.get('/planner', getStudentPlanner);
router.post('/planner/block', saveStudyBlock);
router.delete('/planner/block/:id', deleteStudyBlock);

// Progress & Attendance
router.get('/progress', getStudentProgress);
router.get('/attendance', getStudentAttendance);

module.exports = router;
