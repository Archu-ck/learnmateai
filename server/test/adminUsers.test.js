const test = require('node:test');
const assert = require('node:assert');
const { connectDB, closeDB } = require('../src/db');
const { seedDatabase } = require('../src/seed');
const app = require('../src/app');
const User = require('../src/models/User');
const AuditLog = require('../src/models/AuditLog');

let server;
let baseUrl;
let adminToken;
let adminId;

test.before(async () => {
  await connectDB();
  await seedDatabase();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@learnmate.test',
      password: 'AdminPass123!',
    }),
  });
  const data = await res.json();
  adminToken = data.token;
  adminId = data.user.id;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await closeDB();
});

test('Admin Users: Create user returns temp password and creates audit log', async () => {
  const res = await fetch(`${baseUrl}/api/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: 'Robert Davis',
      email: 'robert.davis@learnmate.test',
      role: 'teacher',
    }),
  });

  assert.strictEqual(res.status, 201);
  const data = await res.json();
  assert.strictEqual(data.user.email, 'robert.davis@learnmate.test');
  assert.strictEqual(data.user.mustChangePassword, true);
  assert.ok(data.temporaryPassword);
  assert.strictEqual(data.temporaryPassword.length, 10);

  // Check audit log
  const log = await AuditLog.findOne({
    action: 'user.create',
    targetId: data.user.id,
  });
  assert.ok(log);
  assert.strictEqual(log.details.email, 'robert.davis@learnmate.test');
});

test('Admin Users: Cannot disable self or demote self', async () => {
  const disableRes = await fetch(`${baseUrl}/api/admin/users/${adminId}/disable`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(disableRes.status, 400);
  const disableData = await disableRes.json();
  assert.match(disableData.error, /cannot disable their own account/i);

  const demoteRes = await fetch(`${baseUrl}/api/admin/users/${adminId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ role: 'teacher' }),
  });
  assert.strictEqual(demoteRes.status, 400);
  const demoteData = await demoteRes.json();
  assert.match(demoteData.error, /cannot demote their own account/i);
});

test('Admin Users: Password reset generates new temporary password', async () => {
  const user = await User.findOne({ email: 'teacher@learnmate.test' });
  const res = await fetch(`${baseUrl}/api/admin/users/${user._id}/reset-password`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(data.temporaryPassword);

  const updatedUser = await User.findById(user._id);
  assert.strictEqual(updatedUser.mustChangePassword, true);
});

test('Admin Users: CSV import with 1 valid, 1 duplicate, and 1 bad role', async () => {
  const csvContent = `name,email,role,class,section,admissionNo
Alice Walker,alice.walker@learnmate.test,student,Grade 8,A,STU-001
Duplicate User,admin@learnmate.test,student,Grade 8,A,STU-002
Invalid Role User,bad.role@learnmate.test,astronaut,Grade 8,B,STU-003`;

  const res = await fetch(`${baseUrl}/api/admin/users/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ csvText: csvContent }),
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.report.created.length, 1);
  assert.strictEqual(data.report.created[0].email, 'alice.walker@learnmate.test');
  assert.strictEqual(data.report.skippedDuplicates.length, 1);
  assert.strictEqual(data.report.skippedDuplicates[0].email, 'admin@learnmate.test');
  assert.strictEqual(data.report.errors.length, 1);
  assert.strictEqual(data.report.errors[0].email, 'bad.role@learnmate.test');
  assert.match(data.report.errors[0].error, /invalid role/i);
});
