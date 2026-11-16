const express = require('express');
const router = express.Router();
const { login, logout, getMe, changePassword } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);
router.post('/change-password', requireAuth, changePassword);

module.exports = router;
