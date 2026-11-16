const express = require('express');
const multer = require('multer');
const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

const {
  createUser,
  getUsers,
  updateUser,
  resetPassword,
  disableUser,
  enableUser,
  importUsersCSV,
} = require('../controllers/adminUserController');

const { requireAuth, requireRole, requirePermission } = require('../middleware/auth');

router.use(requireAuth);

router.post('/', requirePermission('users.create'), createUser);
router.get('/', requireRole('admin'), getUsers);
router.patch('/:id', requirePermission('users.edit'), updateUser);
router.post('/:id/reset-password', requirePermission('users.resetPassword'), resetPassword);
router.post('/:id/disable', requirePermission('users.disable'), disableUser);
router.post('/:id/enable', requirePermission('users.disable'), enableUser);
router.post('/import', requirePermission('users.import'), upload.single('file'), importUsersCSV);

module.exports = router;
