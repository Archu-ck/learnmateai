const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getClassesOverview,
  getClassAllocationData,
  updateSubjectType,
  assignSubjectTeacher,
  saveAllocationMatrix,
  toggleStudentSubject,
} = require('../controllers/adminAllocationController');

// All allocation routes are restricted to authenticated administrators
router.use(requireAuth);
router.use(requireRole('admin'));

router.get('/classes', getClassesOverview);
router.get('/class/:classId', getClassAllocationData);
router.post('/subject-type', updateSubjectType);
router.post('/assign-teacher', assignSubjectTeacher);
router.post('/matrix', saveAllocationMatrix);
router.post('/toggle', toggleStudentSubject);

module.exports = router;
