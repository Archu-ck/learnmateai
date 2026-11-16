const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

app.use(cors({
  origin: clientOrigin,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

module.exports = app;
