const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const {
  getPrincipalDashboard,
  generatePrincipalAIBriefing,
} = require('../controllers/principalController');

router.use(requireAuth);

router.get('/dashboard', getPrincipalDashboard);
router.post('/ai-briefing', generatePrincipalAIBriefing);

module.exports = router;
