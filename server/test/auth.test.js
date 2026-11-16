const test = require('node:test');
const assert = require('node:assert');
const { connectDB, closeDB } = require('../src/db');
const { seedDatabase } = require('../src/seed');
const app = require('../src/app');
const User = require('../src/models/User');

let server;
let baseUrl;

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
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await closeDB();
});

test('Auth: Successful admin login returns cookie and user object', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@learnmate.test',
      password: 'AdminPass123!',
    }),
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.user.email, 'admin@learnmate.test');
  assert.strictEqual(data.user.role, 'admin');
  assert.ok(data.token);
  const setCookie = res.headers.get('set-cookie');
  assert.ok(setCookie && setCookie.includes('token='));
});

test('Auth: Disabled user cannot log in', async () => {
  // Create a disabled user
  const bcrypt = require('bcryptjs');
  const passwordHash = await bcrypt.hash('Password123!', 10);
  await User.findOneAndUpdate(
    { email: 'disabled.user@learnmate.test' },
    {
      name: 'Disabled User',
      email: 'disabled.user@learnmate.test',
      passwordHash,
      role: 'student',
      status: 'disabled',
      schoolId: 'school-default-01',
    },
    { upsert: true }
  );

  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'disabled.user@learnmate.test',
      password: 'Password123!',
    }),
  });

  assert.strictEqual(res.status, 403);
  const data = await res.json();
  assert.match(data.error, /disabled/i);
});

test('Auth: Rate-limits login to 5 failed attempts per 15 minutes per email', async () => {
  const targetEmail = 'ratelimit.test@learnmate.test';

  for (let i = 1; i <= 5; i++) {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: targetEmail,
        password: 'wrongpassword',
      }),
    });
    assert.strictEqual(res.status, 401);
  }

  // 6th attempt should be rate-limited with 429
  const res6 = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: targetEmail,
      password: 'wrongpassword',
    }),
  });
  assert.strictEqual(res6.status, 429);
  const data6 = await res6.json();
  assert.match(data6.error, /Too many failed login attempts/i);
});

test('Auth: mustChangePassword flow forces change-password', async () => {
  const bcrypt = require('bcryptjs');
  const tempPassword = 'TempPass123!';
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const testUser = await User.findOneAndUpdate(
    { email: 'mustchange@learnmate.test' },
    {
      name: 'Change Password User',
      email: 'mustchange@learnmate.test',
      passwordHash,
      role: 'teacher',
      status: 'active',
      mustChangePassword: true,
      schoolId: 'school-default-01',
    },
    { upsert: true, new: true }
  );

  // Login
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'mustchange@learnmate.test',
      password: tempPassword,
    }),
  });
  assert.strictEqual(loginRes.status, 200);
  const { token, user } = await loginRes.json();
  assert.strictEqual(user.mustChangePassword, true);

  // Change password endpoint succeeds
  const changeRes = await fetch(`${baseUrl}/api/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      newPassword: 'BrandNewPassword123!',
    }),
  });
  assert.strictEqual(changeRes.status, 200);

  // Verify in DB mustChangePassword is false
  const updatedUser = await User.findById(testUser._id);
  assert.strictEqual(updatedUser.mustChangePassword, false);
});
