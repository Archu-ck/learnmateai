require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { connectDB, closeDB } = require('./db');
const User = require('./models/User');
const Class = require('./models/Class');
const Subject = require('./models/Subject');
const RolePermission = require('./models/RolePermission');
const AuditLog = require('./models/AuditLog');
const { DEFAULT_ROLE_PERMISSIONS } = require('./constants/permissions');

const SCHOOL_ID = process.env.SCHOOL_ID || 'school-default-01';

async function seedDatabase() {
  console.log('--- Starting LearnMate Database Seeding ---');

  // 1. Seed Role Permissions
  console.log('Seeding Role Permissions...');
  for (const [role, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    await RolePermission.findOneAndUpdate(
      { role, schoolId: SCHOOL_ID },
      { role, permissions, schoolId: SCHOOL_ID },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log('Role Permissions seeded successfully.');

  // 2. Seed Default Admin
  const adminEmail = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@learnmate.test').toLowerCase();
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'AdminPass123!';
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  let adminUser = await User.findOne({ email: adminEmail });
  if (!adminUser) {
    adminUser = await User.create({
      name: 'System Administrator',
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: 'admin',
      status: 'active',
      mustChangePassword: false,
      schoolId: SCHOOL_ID,
    });
    console.log(`Created default admin: ${adminEmail}`);
  } else {
    adminUser.passwordHash = adminPasswordHash;
    adminUser.role = 'admin';
    adminUser.status = 'active';
    await adminUser.save();
    console.log(`Updated default admin: ${adminEmail}`);
  }

  // 3. Seed Demo Users for each role
  const defaultUserPassword = 'Password123!';
  const defaultUserHash = await bcrypt.hash(defaultUserPassword, 10);

  const demoUsers = [
    {
      name: 'Dr. Ramesh Iyer',
      email: 'principal@learnmate.test',
      role: 'principal',
      passwordHash: defaultUserHash,
      status: 'active',
      mustChangePassword: false,
      schoolId: SCHOOL_ID,
    },
    {
      name: 'Sarah Jenkins',
      email: 'coordinator@learnmate.test',
      role: 'coordinator',
      passwordHash: defaultUserHash,
      status: 'active',
      mustChangePassword: false,
      schoolId: SCHOOL_ID,
    },
    {
      name: 'Meera Krishnan',
      email: 'teacher@learnmate.test',
      role: 'teacher',
      passwordHash: defaultUserHash,
      status: 'active',
      mustChangePassword: false,
      schoolId: SCHOOL_ID,
    },
    {
      name: 'David Miller',
      email: 'counsellor@learnmate.test',
      role: 'counsellor',
      passwordHash: defaultUserHash,
      status: 'active',
      mustChangePassword: false,
      schoolId: SCHOOL_ID,
    },
    {
      name: 'Aarav Sharma',
      email: 'student@learnmate.test',
      role: 'student',
      admissionNo: 'ADM-2026-001',
      passwordHash: defaultUserHash,
      status: 'active',
      mustChangePassword: false,
      schoolId: SCHOOL_ID,
    },
    {
      name: 'Sunita Sharma',
      email: 'parent@learnmate.test',
      role: 'parent',
      passwordHash: defaultUserHash,
      status: 'active',
      mustChangePassword: false,
      schoolId: SCHOOL_ID,
    },
  ];

  for (const demoUser of demoUsers) {
    const existing = await User.findOne({ email: demoUser.email });
    if (!existing) {
      await User.create(demoUser);
      console.log(`Created demo user: ${demoUser.email} (${demoUser.role})`);
    } else {
      Object.assign(existing, demoUser);
      await existing.save();
      console.log(`Updated demo user: ${demoUser.email} (${demoUser.role})`);
    }
  }

  // 4. Initial Starter Class and Subject
  let starterClass = await Class.findOne({ name: 'Grade 8', schoolId: SCHOOL_ID });
  if (!starterClass) {
    starterClass = await Class.create({
      name: 'Grade 8',
      sections: ['A', 'B'],
      academicYear: '2026-2027',
      schoolId: SCHOOL_ID,
    });
    console.log('Created starter class: Grade 8 (Sections A, B)');
  }

  let starterSubject = await Subject.findOne({ code: 'MATH101', schoolId: SCHOOL_ID });
  if (!starterSubject) {
    starterSubject = await Subject.create({
      name: 'Mathematics',
      code: 'MATH101',
      classIds: [starterClass._id],
      schoolId: SCHOOL_ID,
    });
    console.log('Created starter subject: Mathematics (MATH101)');
  }

  // 5. Audit log entry for seeding
  await AuditLog.create({
    actorId: adminUser._id,
    action: 'system.seed',
    targetType: 'system',
    targetId: 'seed',
    details: { message: 'Database initialized with default roles, permissions, and users' },
    schoolId: SCHOOL_ID,
  });

  console.log('--- Database Seeding Finished Successfully ---');
}

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase();
      await closeDB();
      process.exit(0);
    } catch (err) {
      console.error('Seeding failed:', err);
      process.exit(1);
    }
  })();
}

module.exports = { seedDatabase };
