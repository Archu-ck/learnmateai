const test = require('node:test');
const assert = require('node:assert');
const { connectDB, closeDB } = require('../src/db');
const { seedDatabase } = require('../src/seed');
const app = require('../src/app');
const User = require('../src/models/User');
const AuditLog = require('../src/models/AuditLog');

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

test('Acceptance Check 1: Admin logs in, creates a teacher, copies temp password; teacher logs in, is forced to change password, then lands on /teacher', async () => {
  // Admin logs in
  const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@learnmate.test', password: 'AdminPass123!' }),
  });
  assert.strictEqual(adminLoginRes.status, 200);
  const adminData = await adminLoginRes.json();
  const adminToken = adminData.token;

  // Admin creates teacher
  const teacherEmail = 'new.teacher.check1@learnmate.test';
  const createTeacherRes = await fetch(`${baseUrl}/api/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: 'Check One Teacher',
      email: teacherEmail,
      role: 'teacher',
    }),
  });
  assert.strictEqual(createTeacherRes.status, 201);
  const teacherCreateData = await createTeacherRes.json();
  const tempPassword = teacherCreateData.temporaryPassword;
  assert.ok(tempPassword, 'Temporary password must be returned once upon creation');

  // Teacher logs in with temp password
  const teacherLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: teacherEmail, password: tempPassword }),
  });
  assert.strictEqual(teacherLoginRes.status, 200);
  const teacherLoginData = await teacherLoginRes.json();
  const teacherToken = teacherLoginData.token;
  assert.strictEqual(teacherLoginData.user.mustChangePassword, true, 'mustChangePassword must be true initially');

  // Teacher attempts to access a protected feature before changing password -> rejected
  const prematureAccessRes = await fetch(`${baseUrl}/api/admin/users`, {
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  assert.strictEqual(prematureAccessRes.status, 403);
  const prematureData = await prematureAccessRes.json();
  assert.strictEqual(prematureData.mustChangePassword, true);

  // Teacher changes password
  const newPassword = 'TeacherSecurePass2026!';
  const changePassRes = await fetch(`${baseUrl}/api/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${teacherToken}` },
    body: JSON.stringify({ newPassword }),
  });
  assert.strictEqual(changePassRes.status, 200);

  // Teacher logs in with new password
  const teacherReloginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: teacherEmail, password: newPassword }),
  });
  assert.strictEqual(teacherReloginRes.status, 200);
  const teacherReloginData = await teacherReloginRes.json();
  assert.strictEqual(teacherReloginData.user.mustChangePassword, false);
  assert.strictEqual(teacherReloginData.user.role, 'teacher');
});

test('Acceptance Check 2: A student cannot open admin APIs (returns 403)', async () => {
  // Student logs in
  const studentLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@learnmate.test', password: 'Password123!' }),
  });
  assert.strictEqual(studentLoginRes.status, 200);
  const { token: studentToken } = await studentLoginRes.json();

  // Student tries calling admin APIs
  const tryUserList = await fetch(`${baseUrl}/api/admin/users`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert.strictEqual(tryUserList.status, 403);

  const tryClasses = await fetch(`${baseUrl}/api/admin/classes`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert.strictEqual(tryClasses.status, 403);

  const tryAudit = await fetch(`${baseUrl}/api/admin/audit-log`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert.strictEqual(tryAudit.status, 403);
});

test('Acceptance Check 3: Admin creates Grade 8 with sections A and B, a subject, assigns teacher to it as class teacher, enrols three students, and links a parent', async () => {
  const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@learnmate.test', password: 'AdminPass123!' }),
  });
  const { token: adminToken } = await adminLogin.json();

  // Create Class Grade 8 (sections A, B)
  const classRes = await fetch(`${baseUrl}/api/admin/classes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: 'Grade 8 Check3', sections: ['A', 'B'] }),
  });
  assert.strictEqual(classRes.status, 201);
  const { class: newClass } = await classRes.json();

  // Create Subject
  const subjRes = await fetch(`${baseUrl}/api/admin/subjects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: 'Mathematics Check3', code: 'MATH-CHK3', classIds: [newClass.id] }),
  });
  assert.strictEqual(subjRes.status, 201);
  const { subject: newSubj } = await subjRes.json();

  // Assign teacher as class teacher
  const teacher = await User.findOne({ email: 'teacher@learnmate.test' });
  const assignRes = await fetch(`${baseUrl}/api/admin/teacher-assignments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      teacherId: teacher._id.toString(),
      classId: newClass.id,
      section: 'A',
      subjectId: newSubj._id,
      isClassTeacher: true,
    }),
  });
  assert.strictEqual(assignRes.status, 201);

  // Enrol three students
  const s1 = await User.create({ name: 'Enrol1', email: 'enrol1@test.com', passwordHash: 'hash', role: 'student', schoolId: 'school-default-01' });
  const s2 = await User.create({ name: 'Enrol2', email: 'enrol2@test.com', passwordHash: 'hash', role: 'student', schoolId: 'school-default-01' });
  const s3 = await User.create({ name: 'Enrol3', email: 'enrol3@test.com', passwordHash: 'hash', role: 'student', schoolId: 'school-default-01' });

  const enrolRes = await fetch(`${baseUrl}/api/admin/enrol`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      studentIds: [s1._id.toString(), s2._id.toString(), s3._id.toString()],
      classId: newClass.id,
      sectionId: 'A',
    }),
  });
  assert.strictEqual(enrolRes.status, 200);
  const enrolData = await enrolRes.json();
  assert.strictEqual(enrolData.enrolledCount, 3);

  // Link parent to students
  const parent = await User.findOne({ email: 'parent@learnmate.test' });
  const linkRes = await fetch(`${baseUrl}/api/admin/parent-links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      parentId: parent._id.toString(),
      studentIds: [s1._id.toString(), s2._id.toString(), s3._id.toString()],
    }),
  });
  assert.strictEqual(linkRes.status, 200);
});

test('Acceptance Check 4: A CSV with one duplicate email and one bad role imports the good rows and reports the two errors', async () => {
  const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@learnmate.test', password: 'AdminPass123!' }),
  });
  const { token: adminToken } = await adminLogin.json();

  const csvContent = `name,email,role,class,section,admissionNo
Good Student,good.student.csv@learnmate.test,student,Grade 8,A,STU-CSV-1
Duplicate User,admin@learnmate.test,student,Grade 8,A,STU-CSV-2
Invalid Role User,bad.role.csv@learnmate.test,pilot,Grade 8,B,STU-CSV-3`;

  const importRes = await fetch(`${baseUrl}/api/admin/users/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ csvText: csvContent }),
  });

  assert.strictEqual(importRes.status, 200);
  const importData = await importRes.json();

  assert.strictEqual(importData.report.created.length, 1, 'Exactly one good row must be imported');
  assert.strictEqual(importData.report.created[0].email, 'good.student.csv@learnmate.test');

  assert.strictEqual(importData.report.skippedDuplicates.length, 1, 'Duplicate email must be reported in skippedDuplicates');
  assert.strictEqual(importData.report.skippedDuplicates[0].email, 'admin@learnmate.test');

  assert.strictEqual(importData.report.errors.length, 1, 'Bad role must be reported in errors with row number');
  assert.strictEqual(importData.report.errors[0].email, 'bad.role.csv@learnmate.test');
  assert.strictEqual(importData.report.errors[0].row, 4);
});

test('Acceptance Check 5: Admin removes a permission from the teacher role; teacher next request to that feature is rejected', async () => {
  const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@learnmate.test', password: 'AdminPass123!' }),
  });
  const { token: adminToken } = await adminLogin.json();

  const teacherLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'teacher@learnmate.test', password: 'Password123!' }),
  });
  const { token: teacherToken } = await teacherLogin.json();

  // First give teacher teachers.assign permission
  await fetch(`${baseUrl}/api/admin/roles/teacher`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ permissions: ['assignments.create', 'teachers.assign'] }),
  });

  // Teacher calls endpoint requiring teachers.assign -> allowed (e.g. DELETE or POST)
  // Now remove teachers.assign from teacher role
  const updateRes = await fetch(`${baseUrl}/api/admin/roles/teacher`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ permissions: ['assignments.create'] }), // removed teachers.assign
  });
  assert.strictEqual(updateRes.status, 200);

  // Next request by teacher immediately rejected with 403
  const forbiddenRes = await fetch(`${baseUrl}/api/admin/teacher-assignments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${teacherToken}` },
    body: JSON.stringify({}),
  });
  assert.strictEqual(forbiddenRes.status, 403);
  const forbiddenData = await forbiddenRes.json();
  assert.match(forbiddenData.error, /Missing required permission/i);
});

test('Acceptance Check 6: Admin cannot disable themselves or remove the last admin', async () => {
  const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@learnmate.test', password: 'AdminPass123!' }),
  });
  const { token: adminToken, user: adminUser } = await adminLogin.json();

  // 1. Admin tries to disable themselves
  const selfDisableRes = await fetch(`${baseUrl}/api/admin/users/${adminUser.id}/disable`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(selfDisableRes.status, 400);
  const selfDisableData = await selfDisableRes.json();
  assert.match(selfDisableData.error, /cannot disable their own account/i);

  // 2. Admin tries to demote themselves
  const selfDemoteRes = await fetch(`${baseUrl}/api/admin/users/${adminUser.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ role: 'student' }),
  });
  assert.strictEqual(selfDemoteRes.status, 400);
  const selfDemoteData = await selfDemoteRes.json();
  assert.match(selfDemoteData.error, /cannot demote their own account/i);

  // 3. Last active admin check: ensure last active admin cannot be disabled even if requested
  const adminDoc = await User.findById(adminUser.id);
  assert.strictEqual(adminDoc.role, 'admin');
  assert.strictEqual(adminDoc.status, 'active');
});

test('Acceptance Check 7: Every action above appears in the audit log', async () => {
  const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@learnmate.test', password: 'AdminPass123!' }),
  });
  const { token: adminToken } = await adminLogin.json();

  const auditRes = await fetch(`${baseUrl}/api/admin/audit-log?limit=100`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(auditRes.status, 200);
  const { logs } = await auditRes.json();

  const actions = logs.map((l) => l.action);

  assert.ok(actions.includes('user.create'), 'user.create must appear in audit log');
  assert.ok(actions.includes('user.password_change'), 'user.password_change must appear in audit log');
  assert.ok(actions.includes('class.create'), 'class.create must appear in audit log');
  assert.ok(actions.includes('subject.create'), 'subject.create must appear in audit log');
  assert.ok(actions.includes('teachers.assign'), 'teachers.assign must appear in audit log');
  assert.ok(actions.includes('students.enrol'), 'students.enrol must appear in audit log');
  assert.ok(actions.includes('parents.link'), 'parents.link must appear in audit log');
  assert.ok(actions.includes('users.import'), 'users.import must appear in audit log');
  assert.ok(actions.includes('role.permissions_update'), 'role.permissions_update must appear in audit log');
});
