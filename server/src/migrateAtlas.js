require('./loadEnv');
const path = require('path');
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Class = require('./models/Class');
const Subject = require('./models/Subject');
const TeacherAssignment = require('./models/TeacherAssignment');
const StudentSubject = require('./models/StudentSubject');
const Topic = require('./models/Topic');
const Lesson = require('./models/Lesson');
const RolePermission = require('./models/RolePermission');
const ChatSetting = require('./models/ChatSetting');
const AISetting = require('./models/AISetting');
const Announcement = require('./models/Announcement');
const AuditLog = require('./models/AuditLog');
const { DEFAULT_ROLE_PERMISSIONS } = require('./constants/permissions');

const SCHOOL_ID = process.env.SCHOOL_ID || 'school-default-01';
const MONGODB_URI = process.env.MONGODB_URI;

async function runMigration() {
  console.log('==================================================');
  console.log('  LEARNMATE MONGODB ATLAS MIGRATION & SEEDING     ');
  console.log('==================================================');

  if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI is not defined in environment.');
    process.exit(1);
  }

  console.log(`Target MongoDB URI: ${MONGODB_URI.replace(/:([^@]+)@/, ':****@')}`);
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('✓ Successfully connected to MongoDB Atlas database:', mongoose.connection.name);

  // 1. Clean existing records for fresh 1-user-per-role setup
  console.log('\n--- 1. Resetting Database Collections ---');
  await Promise.all([
    User.deleteMany({ schoolId: SCHOOL_ID }),
    Class.deleteMany({ schoolId: SCHOOL_ID }),
    Subject.deleteMany({ schoolId: SCHOOL_ID }),
    TeacherAssignment.deleteMany({ schoolId: SCHOOL_ID }),
    StudentSubject.deleteMany({ schoolId: SCHOOL_ID }),
    Topic.deleteMany({ schoolId: SCHOOL_ID }),
    Lesson.deleteMany({ schoolId: SCHOOL_ID }),
    RolePermission.deleteMany({ schoolId: SCHOOL_ID }),
    ChatSetting.deleteMany({ schoolId: SCHOOL_ID }),
    AISetting.deleteMany({ schoolId: SCHOOL_ID }),
    Announcement.deleteMany({ schoolId: SCHOOL_ID }),
  ]);
  console.log('✓ Collections wiped clean for fresh migration.');

  // 2. Seed Role Permissions
  console.log('\n--- 2. Seeding Role Permissions ---');
  for (const [role, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    await RolePermission.create({
      role,
      permissions,
      schoolId: SCHOOL_ID,
    });
  }
  console.log('✓ Seeded standard permissions for all 5 roles.');

  // 3. Seed System Configuration
  console.log('\n--- 3. Seeding Chat & AI Settings ---');
  await ChatSetting.create({
    schoolId: SCHOOL_ID,
    chatHoursEnabled: false,
    startHour: 6,
    endHour: 23,
    disabledClassIds: [],
  });

  await AISetting.create({
    schoolId: SCHOOL_ID,
    dailyLimit: 50,
    disabledModelRoles: [],
    modelName: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  });
  console.log('✓ Chat & AI settings initialized.');

  // 4. Provision Class 10
  console.log('\n--- 4. Provisioning Class 10 Data ---');
  const class10 = await Class.create({
    name: 'Class 10',
    sections: ['A', 'B'],
    academicYear: '2026-2027',
    schoolId: SCHOOL_ID,
  });
  console.log(`✓ Provisioned Class 10 (Sections A & B) [ID: ${class10._id}]`);

  // 5. Seed Exactly 1 User Per Role
  console.log('\n--- 5. Seeding Exactly 1 User Per Role ---');
  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);
  const adminPasswordHash = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'AdminPass123!', 10);

  // 5.1 Admin
  const adminUser = await User.create({
    name: 'System Administrator',
    email: 'admin@learnmate.test',
    passwordHash: adminPasswordHash,
    role: 'admin',
    status: 'active',
    mustChangePassword: false,
    schoolId: SCHOOL_ID,
  });
  console.log(`✓ [Admin]     admin@learnmate.test       (Pass: AdminPass123!)`);

  // 5.2 Principal
  const principalUser = await User.create({
    name: 'Dr. Ramesh Iyer',
    email: 'principal@learnmate.test',
    passwordHash: defaultPasswordHash,
    role: 'principal',
    status: 'active',
    mustChangePassword: false,
    schoolId: SCHOOL_ID,
  });
  console.log(`✓ [Principal] principal@learnmate.test   (Pass: Password123!)`);

  // 5.3 Teacher
  const teacherUser = await User.create({
    name: 'Meera Krishnan',
    email: 'teacher@learnmate.test',
    passwordHash: defaultPasswordHash,
    role: 'teacher',
    status: 'active',
    mustChangePassword: false,
    schoolId: SCHOOL_ID,
  });
  console.log(`✓ [Teacher]   teacher@learnmate.test     (Pass: Password123!)`);

  // 5.4 Student (in Class 10, Section A)
  const studentUser = await User.create({
    name: 'Aarav Sharma',
    email: 'student@learnmate.test',
    passwordHash: defaultPasswordHash,
    role: 'student',
    admissionNo: 'ADM-10A-001',
    classId: class10._id,
    sectionId: 'A',
    status: 'active',
    mustChangePassword: false,
    schoolId: SCHOOL_ID,
  });
  console.log(`✓ [Student]   student@learnmate.test     (Pass: Password123!, Class 10-A, Adm: ADM-10A-001)`);

  // 5.5 Parent (Connected to Aarav Sharma)
  const parentUser = await User.create({
    name: 'Rajesh Sharma',
    email: 'parent@learnmate.test',
    passwordHash: defaultPasswordHash,
    role: 'parent',
    status: 'active',
    mustChangePassword: false,
    schoolId: SCHOOL_ID,
    childIds: [studentUser._id],
  });

  // Link student back to parent
  studentUser.parentId = parentUser._id;
  await studentUser.save();
  console.log(`✓ [Parent]    parent@learnmate.test      (Pass: Password123!, Linked to: Aarav Sharma)`);

  // 6. Seed Class 10 Subjects
  console.log('\n--- 6. Seeding Class 10 Subjects & Curricula ---');
  const subjectConfigs = [
    { name: 'Mathematics', code: 'MATH10', isElective: false },
    { name: 'Science', code: 'SCI10', isElective: false },
    { name: 'Social Science', code: 'SST10', isElective: false },
    { name: 'English Communicative', code: 'ENG10', isElective: false },
    { name: 'Hindi Course-A', code: 'HIN10', isElective: false },
  ];

  const subjects = [];
  for (const s of subjectConfigs) {
    const sub = await Subject.create({
      name: s.name,
      code: s.code,
      classIds: [class10._id],
      isElective: s.isElective,
      schoolId: SCHOOL_ID,
    });
    subjects.push(sub);
  }
  console.log(`✓ Created ${subjects.length} subjects for Class 10:`);
  subjects.forEach((s) => console.log(`   - ${s.name} (${s.code})`));

  // 7. Teacher Assignments (Meera Krishnan assigned to Class 10 Section A subjects)
  console.log('\n--- 7. Assigning Teacher to Class 10 ---');
  for (const s of subjects) {
    await TeacherAssignment.create({
      teacherId: teacherUser._id,
      classId: class10._id,
      section: 'A',
      subjectId: s._id,
      isClassTeacher: s.code === 'MATH10', // Class Teacher for 10-A
      schoolId: SCHOOL_ID,
    });
  }
  console.log(`✓ Assigned Meera Krishnan to Class 10-A for all subjects (Class Teacher: Yes)`);

  // 8. Student Subject Enrollment
  console.log('\n--- 8. Enrolling Student in Class 10 Subjects ---');
  for (const s of subjects) {
    await StudentSubject.create({
      studentId: studentUser._id,
      subjectId: s._id,
      classId: class10._id,
      isElective: false,
      schoolId: SCHOOL_ID,
    });
  }
  console.log(`✓ Enrolled Aarav Sharma in all 5 Class 10 subjects.`);

  // 9. Topics and Lessons for Math & Science
  console.log('\n--- 9. Adding Topics & Lessons for Class 10 ---');
  const mathSub = subjects.find((s) => s.code === 'MATH10');
  const sciSub = subjects.find((s) => s.code === 'SCI10');

  // Math Topic 1
  const mathTopic1 = await Topic.create({
    subjectId: mathSub._id,
    classId: class10._id,
    name: 'Chapter 1: Real Numbers',
    order: 1,
    schoolId: SCHOOL_ID,
  });
  await Lesson.create({
    subjectId: mathSub._id,
    topicId: mathTopic1._id,
    title: 'Fundamental Theorem of Arithmetic & Proof of Irrationality',
    content: 'Review of prime factorisation, HCF and LCM calculations, and proving irrationality of √2, √3, and √5.',
    order: 1,
    schoolId: SCHOOL_ID,
  });

  // Math Topic 2
  const mathTopic2 = await Topic.create({
    subjectId: mathSub._id,
    classId: class10._id,
    name: 'Chapter 2: Polynomials',
    order: 2,
    schoolId: SCHOOL_ID,
  });
  await Lesson.create({
    subjectId: mathSub._id,
    topicId: mathTopic2._id,
    title: 'Geometrical Meaning of Zeroes & Relationship with Coefficients',
    content: 'Understanding quadratic polynomials, parabolas intersecting the x-axis, sum α+β = -b/a and product αβ = c/a.',
    order: 1,
    schoolId: SCHOOL_ID,
  });

  // Science Topic 1
  const sciTopic1 = await Topic.create({
    subjectId: sciSub._id,
    classId: class10._id,
    name: 'Chapter 1: Chemical Reactions and Equations',
    order: 1,
    schoolId: SCHOOL_ID,
  });
  await Lesson.create({
    subjectId: sciSub._id,
    topicId: sciTopic1._id,
    title: 'Balancing Chemical Equations & Types of Reactions',
    content: 'Combination, Decomposition, Displacement, Double Displacement, Oxidation, and Reduction with real experimental examples.',
    order: 1,
    schoolId: SCHOOL_ID,
  });
  console.log(`✓ Seeded academic chapters and lessons for Mathematics & Science.`);

  // 10. Sample Announcement
  await Announcement.create({
    title: 'Welcome to Class 10 Academic Session 2026-27',
    content: 'Orientation session begins on Monday. Class 10 students should check their personalized timetable and assignments.',
    authorId: principalUser._id,
    targetRole: 'all',
    classIds: [class10._id],
    schoolId: SCHOOL_ID,
  });
  console.log(`✓ Seeded Class 10 welcome announcement from Principal.`);

  // 11. Verification
  console.log('\n--- 10. Final Verification ---');
  const userCount = await User.countDocuments({ schoolId: SCHOOL_ID });
  const usersByRole = await User.aggregate([
    { $match: { schoolId: SCHOOL_ID } },
    { $group: { _id: '$role', count: { $sum: 1 }, name: { $first: '$name' }, email: { $first: '$email' } } },
  ]);

  console.log(`Total Users in Database: ${userCount} (Target: Exactly 5, 1 per role)`);
  usersByRole.forEach((r) => {
    console.log(`  Role: ${r._id.padEnd(10)} -> Count: ${r.count} (${r.name} - ${r.email})`);
  });

  const verifiedStudent = await User.findOne({ email: 'student@learnmate.test' }).populate('parentId', 'name email');
  console.log(`Student Parent Connection: ${verifiedStudent.name} is connected to Parent: ${verifiedStudent.parentId?.name} (${verifiedStudent.parentId?.email})`);

  const verifiedParent = await User.findOne({ email: 'parent@learnmate.test' }).populate('childIds', 'name email admissionNo');
  console.log(`Parent Child Connection: ${verifiedParent.name} has children: ${verifiedParent.childIds.map((c) => c.name).join(', ')}`);

  console.log('\n==================================================');
  console.log('✓ MIGRATION AND SEEDING COMPLETED SUCCESSFULLY!   ');
  console.log('==================================================');

  await mongoose.disconnect();
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
