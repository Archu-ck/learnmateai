const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  getSubjectThread,
  getThreadsList,
  sendMessage,
  resolveDoubt,
  getChatSettings,
} = require('../controllers/chatController');

router.use(requireAuth);

router.get('/settings', getChatSettings);
router.get('/thread', getSubjectThread);
router.get('/subject/:subjectId', (req, res) => {
  req.query.subjectId = req.params.subjectId;
  return getSubjectThread(req, res);
});
router.get('/threads', getThreadsList);
router.post('/message', sendMessage);
router.post('/thread/:id/messages', (req, res) => {
  req.body.threadId = req.params.id;
  return sendMessage(req, res);
});
router.post('/messages/:id/resolve', resolveDoubt);
router.patch('/doubt/:id/resolve', resolveDoubt);

module.exports = router;
