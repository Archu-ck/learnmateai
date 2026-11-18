const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  getParentDashboard,
  generateAIGuardianReport,
} = require('../controllers/parentController');

router.use(requireAuth);

router.get('/dashboard', getParentDashboard);
router.post('/ai-summary', generateAIGuardianReport);

module.exports = router;
