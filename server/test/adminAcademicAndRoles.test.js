const test = require('node:test');
const assert = require('node:assert');
const { connectDB, closeDB } = require('../src/db');
const { seedDatabase } = require('../src/seed');
const app = require('../src/app');
const User = require('../src/models/User');

let server;
let baseUrl;
let adminToken;
let teacherToken;
let teacherId;

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

  // Login admin
  const adminRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@learnmate.test', password: 'AdminPass123!' }),
  });
  const adminData = await adminRes.json();
  adminToken = adminData.token;

  // Login teacher
  const teacherRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'teacher@learnmate.test', password: 'Password123!' }),
  });
  const teacherData = await teacherRes.json();
  teacherToken = teacherData.token;
  teacherId = teacherData.user.id;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await closeDB();
});

test('Academic: Create class, subject, assign class teacher, enrol students, link parent', async () => {
  // 1. Create Class "Grade 9" with sections A, B
  const classRes = await fetch(`${baseUrl}/api/admin/classes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: 'Grade 9', sections: ['A', 'B'] }),
  });
  assert.strictEqual(classRes.status, 201);
  const classData = await classRes.json();
  const classId = classData.class.id;

  // 2. Create Subject "Science"
  const subjRes = await fetch(`${baseUrl}/api/admin/subjects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: 'Science', code: 'SCI101', classIds: [classId] }),
  });
  assert.strictEqual(subjRes.status, 201);
  const subjData = await subjRes.json();
  const subjectId = subjData.subject._id;

  // 3. Assign teacher as Class Teacher of Grade 9 Section A
  const assignRes = await fetch(`${baseUrl}/api/admin/teacher-assignments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      teacherId,
      classId,
      section: 'A',
      subjectId,
      isClassTeacher: true,
    }),
  });
  assert.strictEqual(assignRes.status, 201);

  // 4. Create three test students and enrol them
  const stu1 = await User.create({
    name: 'Student One',
    email: 'stu1@learnmate.test',
    passwordHash: 'hash',
    role: 'student',
    schoolId: 'school-default-01',
  });
  const stu2 = await User.create({
    name: 'Student Two',
    email: 'stu2@learnmate.test',
    passwordHash: 'hash',
    role: 'student',
    schoolId: 'school-default-01',
  });
  const stu3 = await User.create({
    name: 'Student Three',
    email: 'stu3@learnmate.test',
    passwordHash: 'hash',
    role: 'student',
    schoolId: 'school-default-01',
  });

  const enrolRes = await fetch(`${baseUrl}/api/admin/enrol`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      studentIds: [stu1._id.toString(), stu2._id.toString(), stu3._id.toString()],
      classId,
      sectionId: 'A',
    }),
  });
  assert.strictEqual(enrolRes.status, 200);
  const enrolData = await enrolRes.json();
  assert.strictEqual(enrolData.enrolledCount, 3);

  // 5. Link parent to student
  const parent = await User.findOne({ email: 'parent@learnmate.test' });
  const linkRes = await fetch(`${baseUrl}/api/admin/parent-links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      parentId: parent._id.toString(),
      studentIds: [stu1._id.toString(), stu2._id.toString()],
    }),
  });
  assert.strictEqual(linkRes.status, 200);
  const linkData = await linkRes.json();
  assert.strictEqual(linkData.parent.children.length, 2);
});

test('Academic: A class-section can have only one class teacher', async () => {
  // Create another teacher
  const teacher2 = await User.create({
    name: 'Second Teacher',
    email: 'teacher2@learnmate.test',
    passwordHash: 'hash',
    role: 'teacher',
    schoolId: 'school-default-01',
  });

  const classes = await fetch(`${baseUrl}/api/admin/classes`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const classList = (await classes.json()).classes;
  const grade9 = classList.find((c) => c.name === 'Grade 9');

  // Attempt to assign teacher2 as class teacher to Grade 9 Section A (already has teacher1)
  const duplicateAssignRes = await fetch(`${baseUrl}/api/admin/teacher-assignments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      teacherId: teacher2._id.toString(),
      classId: grade9.id,
      section: 'A',
      isClassTeacher: true,
    }),
  });

  assert.strictEqual(duplicateAssignRes.status, 400);
  const errData = await duplicateAssignRes.json();
  assert.match(errData.error, /already has a designated class teacher/i);
});

test('Roles: Lockout protection keeps admin roles.manage and users.create', async () => {
  // Try to remove all permissions from admin
  const res = await fetch(`${baseUrl}/api/admin/roles/admin`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ permissions: [] }),
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(data.rolePermission.permissions.includes('roles.manage'));
  assert.ok(data.rolePermission.permissions.includes('users.create'));

  // Restore admin full permissions
  const { DEFAULT_ROLE_PERMISSIONS } = require('../src/constants/permissions');
  await fetch(`${baseUrl}/api/admin/roles/admin`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ permissions: DEFAULT_ROLE_PERMISSIONS.admin }),
  });
});

test('Roles & Permission Cache: Removing permission takes effect on next request', async () => {
  // Teacher initially has attendance.mark
  // Let's grant teacher classes.manage temporarily
  await fetch(`${baseUrl}/api/admin/roles/teacher`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      permissions: ['assignments.create', 'classes.manage'],
    }),
  });

  // Verify teacher can access /api/admin/classes
  const canAccessRes = await fetch(`${baseUrl}/api/admin/classes`, {
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  assert.strictEqual(canAccessRes.status, 200);

  // Now admin removes classes.manage from teacher role
  const updateRes = await fetch(`${baseUrl}/api/admin/roles/teacher`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      permissions: ['assignments.create'], // classes.manage removed
    }),
  });
  assert.strictEqual(updateRes.status, 200);

  // Teacher immediately attempts to access /api/admin/classes -> must return 403
  const forbiddenRes = await fetch(`${baseUrl}/api/admin/classes`, {
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  assert.strictEqual(forbiddenRes.status, 403);
});

test('Audit Log: Records actions and is filterable', async () => {
  const res = await fetch(`${baseUrl}/api/admin/audit-log?limit=10`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(data.logs.length > 0);
  assert.ok(data.total > 0);

  // Filter by action
  const filterRes = await fetch(`${baseUrl}/api/admin/audit-log?action=class.create`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const filterData = await filterRes.json();
  assert.ok(filterData.logs.every((l) => l.action === 'class.create'));
});
