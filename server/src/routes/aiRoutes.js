const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  handleAskDoubt,
  handlePracticeQuiz,
  handleGenerateStudyPlan,
  handleExplainMistake,
  handleSummarizeLesson,
  handleGenerateTest,
  handleDraftAssignment,
  handleEstimateEffort,
  handleSuggestFeedback,
  handleClassInsights,
  handleAdminStatsQA,
  getAILogs,
  getAISettings,
  updateAISettings,
} = require('../controllers/aiController');
const {
  streamDoubt,
  getConversations,
  getMessages,
  saveNote,
  toggleFeedback,
  escalateToTeacher,
  getStudentDoubtSummary,
} = require('../controllers/aiDoubtController');

router.use(requireAuth);

// Student Streaming Doubt Chat & Conversations
router.post('/doubt/stream', streamDoubt);
router.get('/doubt/conversations', getConversations);
router.get('/doubt/conversations/:id/messages', getMessages);
router.post('/doubt/save-note', saveNote);
router.post('/doubt/feedback', toggleFeedback);
router.post('/doubt/send-to-teacher', escalateToTeacher);
router.get('/doubt/teacher-summary', requireRole('teacher', 'admin'), getStudentDoubtSummary);

// Student features
router.post('/ask-doubt', handleAskDoubt);
router.post('/practice-quiz', handlePracticeQuiz);
router.post('/generate-study-plan', handleGenerateStudyPlan);
router.post('/explain-mistake', handleExplainMistake);
router.post('/summarize-lesson', handleSummarizeLesson);

// Teacher features
router.post('/generate-test', requireRole('teacher', 'admin'), handleGenerateTest);
router.post('/draft-assignment', requireRole('teacher', 'admin'), handleDraftAssignment);
router.post('/estimate-effort', requireRole('teacher', 'admin'), handleEstimateEffort);
router.post('/suggest-feedback', requireRole('teacher', 'admin'), handleSuggestFeedback);
router.post('/class-insights', requireRole('teacher', 'admin'), handleClassInsights);

// Admin AI Usage Logs, System Settings & Stats Q&A
router.post('/admin-stats-qa', requireRole('admin'), handleAdminStatsQA);
router.get('/logs', requireRole('admin'), getAILogs);
router.get('/settings', requireRole('admin', 'teacher'), getAISettings);
router.patch('/settings', requireRole('admin'), updateAISettings);

module.exports = router;
