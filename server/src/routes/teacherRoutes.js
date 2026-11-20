const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { requireAuth, requireRole } = require('../middleware/auth');
const { requireTeacherAssigned } = require('../middleware/scopeGuard');

// Setup local upload directory for assignment attachments
const uploadDir = path.resolve(__dirname, '../../uploads/assignments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const cleanExt = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, cleanExt).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${cleanBase}-${uniqueSuffix}${cleanExt}`);
  },
});

const uploadAttachment = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|png|jpg|jpeg|webp|gif/i;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext) || allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files (PNG, JPG, WEBP, GIF) are allowed.'));
    }
  },
});
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
  handleSmartAssignmentEstimate,
  getTeacherWorkloadCalendar,
  getTeacherAssignments,
} = require('../controllers/teacherController');

router.use(requireAuth);
router.use(requireRole('teacher'));

// Dashboard
router.get('/dashboard', getTeacherDashboard);

// Classes & Workspaces
router.get('/classes', getMyClasses);
router.get('/classes/:id', getClassWorkspace);

// Workload Check & Calendar
router.get('/workload', getWorkloadCheck);
router.get('/workload/calendar', getTeacherWorkloadCalendar);

// Assignments & Grading & Smart AI Estimator
router.get('/assignments', getTeacherAssignments);
router.post('/assignments', createTeacherAssignment);
router.post('/assignments/smart-estimate', handleSmartAssignmentEstimate);
router.post('/upload-attachment', uploadAttachment.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const filename = req.file.filename;
    const fileUrl = `/uploads/assignments/${filename}`;

    // Mirror to learnmate/public/uploads/assignments so Next.js can serve it statically
    try {
      const publicUploadDir = path.resolve(__dirname, '../../../learnmate/public/uploads/assignments');
      if (!fs.existsSync(publicUploadDir)) {
        fs.mkdirSync(publicUploadDir, { recursive: true });
      }
      fs.copyFileSync(req.file.path, path.join(publicUploadDir, filename));
    } catch {}

    return res.json({
      success: true,
      file: {
        name: req.file.originalname,
        url: fileUrl,
        type: req.file.mimetype || (path.extname(req.file.originalname).toLowerCase() === '.pdf' ? 'application/pdf' : 'image/jpeg'),
        size: req.file.size,
      },
    });
  } catch (err) {
    console.error('Attachment upload error:', err);
    return res.status(500).json({ error: err.message || 'Failed to upload attachment' });
  }
});
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
