const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

const clientOrigin = process.env.CLIENT_ORIGIN;
const allowedOrigins = clientOrigin
  ? clientOrigin.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost')
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Allow all valid web clients
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Normalize duplicate slashes in incoming request URLs (e.g. //api/auth/login -> /api/auth/login)
app.use((req, res, next) => {
  if (req.url && req.url.startsWith('//')) {
    req.url = req.url.replace(/^\/+/, '/');
  }
  next();
});

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const adminUserRoutes = require('./routes/adminUserRoutes');
app.use('/api/admin/users', adminUserRoutes);

const adminAcademicRoutes = require('./routes/adminAcademicRoutes');
app.use('/api/admin', adminAcademicRoutes);

const adminRoleRoutes = require('./routes/adminRoleRoutes');
app.use('/api/admin/roles', adminRoleRoutes);

const adminAuditRoutes = require('./routes/adminAuditRoutes');
app.use('/api/admin/audit-log', adminAuditRoutes);

const adminAllocationRoutes = require('./routes/adminAllocationRoutes');
app.use('/api/admin/subject-allocation', adminAllocationRoutes);

const studentRoutes = require('./routes/studentRoutes');
app.use('/api/student', studentRoutes);

const teacherRoutes = require('./routes/teacherRoutes');
app.use('/api/teacher', teacherRoutes);

const parentRoutes = require('./routes/parentRoutes');
app.use('/api/parent', parentRoutes);

const principalRoutes = require('./routes/principalRoutes');
app.use('/api/principal', principalRoutes);

const chatRoutes = require('./routes/chatRoutes');
app.use('/api/chat', chatRoutes);

const aiRoutes = require('./routes/aiRoutes');
app.use('/api/ai', aiRoutes);

const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'LearnMate LMS Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

module.exports = app;
