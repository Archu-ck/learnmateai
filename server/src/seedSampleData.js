const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
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
const Assignment = require('./models/Assignment');
const Submission = require('./models/Submission');
const Test = require('./models/Test');
const Question = require('./models/Question');
const TestAttempt = require('./models/TestAttempt');
const Grade = require('./models/Grade');
const Attendance = require('./models/Attendance');
const TimetableEntry = require('./models/TimetableEntry');
const RolePermission = require('./models/RolePermission');
const Announcement = require('./models/Announcement');
const { DEFAULT_ROLE_PERMISSIONS } = require('./constants/permissions');

const SCHOOL_ID = process.env.SCHOOL_ID || 'school-default-01';
const MONGODB_URI = process.env.MONGODB_URI;

async function runSeed() {
  console.log('====================================================');
  console.log('  LEARNMATE SEED: 20 STUDENTS, 4 TEACHERS & SAMPLE DATA');
  console.log('====================================================');

  if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI is not defined.');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
  console.log('✓ Connected to MongoDB Atlas:', mongoose.connection.name);

  // 1. Clear existing collections for a clean, deterministic seed
  console.log('\n--- 1. Cleaning Database Collections ---');
  await Promise.all([
    User.deleteMany({ schoolId: SCHOOL_ID }),
    Class.deleteMany({ schoolId: SCHOOL_ID }),
    Subject.deleteMany({ schoolId: SCHOOL_ID }),
    TeacherAssignment.deleteMany({ schoolId: SCHOOL_ID }),
    StudentSubject.deleteMany({ schoolId: SCHOOL_ID }),
    Topic.deleteMany({ schoolId: SCHOOL_ID }),
    Lesson.deleteMany({ schoolId: SCHOOL_ID }),
    Assignment.deleteMany({ schoolId: SCHOOL_ID }),
    Submission.deleteMany({ schoolId: SCHOOL_ID }),
    Test.deleteMany({ schoolId: SCHOOL_ID }),
    Question.deleteMany({ schoolId: SCHOOL_ID }),
    TestAttempt.deleteMany({ schoolId: SCHOOL_ID }),
    Grade.deleteMany({ schoolId: SCHOOL_ID }),
    Attendance.deleteMany({ schoolId: SCHOOL_ID }),
    TimetableEntry.deleteMany({ schoolId: SCHOOL_ID }),
    Announcement.deleteMany({ schoolId: SCHOOL_ID }),
  ]);
  console.log('✓ Collections cleaned.');

  // 2. Ensure Role Permissions
  for (const [role, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    await RolePermission.findOneAndUpdate(
      { role, schoolId: SCHOOL_ID },
      { role, permissions, schoolId: SCHOOL_ID },
      { upsert: true, new: true }
    );
  }

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);
  const adminPasswordHash = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'AdminPass123!', 10);

  // 3. Admin & Principal
  const adminUser = await User.create({
    name: 'System Administrator',
    email: 'admin@learnmate.test',
    passwordHash: adminPasswordHash,
    role: 'admin',
    status: 'active',
    mustChangePassword: false,
    schoolId: SCHOOL_ID,
  });

  const principalUser = await User.create({
    name: 'Dr. Ramesh Iyer',
    email: 'principal@learnmate.test',
    passwordHash: defaultPasswordHash,
    role: 'principal',
    status: 'active',
    mustChangePassword: false,
    schoolId: SCHOOL_ID,
  });
  console.log('✓ Seeded Admin and Principal accounts.');

  // 4. Class 10 (Sections A and B)
  const class10 = await Class.create({
    name: 'Class 10',
    sections: ['A', 'B'],
    academicYear: '2026-2027',
    schoolId: SCHOOL_ID,
  });
  console.log(`✓ Provisioned Class 10 (Sections A & B) [ID: ${class10._id}]`);

  // 5. Four Teachers
  const teacherData = [
    {
      name: 'Meera Krishnan',
      email: 'teacher@learnmate.test',
      primarySubject: 'Mathematics',
      isClassTeacherA: true,
      isClassTeacherB: false,
    },
    {
      name: 'Dr. Vikram Sharma',
      email: 'vikram.sharma@learnmate.test',
      primarySubject: 'Science',
      isClassTeacherA: false,
      isClassTeacherB: true,
    },
    {
      name: 'Sunita Menon',
      email: 'sunita.menon@learnmate.test',
      primarySubject: 'English Language & Literature',
      isClassTeacherA: false,
      isClassTeacherB: false,
    },
    {
      name: 'Rajiv Tandon',
      email: 'rajiv.tandon@learnmate.test',
      primarySubject: 'Social Science',
      isClassTeacherA: false,
      isClassTeacherB: false,
    },
  ];

  const teachers = [];
  for (const t of teacherData) {
    const user = await User.create({
      name: t.name,
      email: t.email,
      passwordHash: defaultPasswordHash,
      role: 'teacher',
      status: 'active',
      mustChangePassword: false,
      schoolId: SCHOOL_ID,
    });
    teachers.push({ user, ...t });
  }
  console.log(`✓ Seeded ${teachers.length} teachers:`);
  teachers.forEach((t) => console.log(`   - ${t.name} (${t.email}) • ${t.primarySubject}`));

  // 6. 4 Core Class 10 Subjects
  const subjectConfigs = [
    { name: 'Mathematics', code: 'MATH10', teacherIndex: 0 },
    { name: 'Science', code: 'SCI10', teacherIndex: 1 },
    { name: 'English Language & Literature', code: 'ENG10', teacherIndex: 2 },
    { name: 'Social Science', code: 'SST10', teacherIndex: 3 },
  ];

  const subjects = [];
  for (const sc of subjectConfigs) {
    const sub = await Subject.create({
      name: sc.name,
      code: sc.code,
      classIds: [class10._id],
      isElective: false,
      schoolId: SCHOOL_ID,
    });
    subjects.push({ sub, ...sc });
  }
  console.log(`✓ Seeded 5 core academic subjects.`);

  // 7. Teacher Allocations across Section A & Section B
  for (const s of subjects) {
    const assignedTeacher = teachers[s.teacherIndex].user;

    // Allocate for Section A
    await TeacherAssignment.create({
      teacherId: assignedTeacher._id,
      classId: class10._id,
      section: 'A',
      subjectId: s.sub._id,
      isClassTeacher: s.code === 'MATH10', // Meera Krishnan is Class Teacher of 10-A
      schoolId: SCHOOL_ID,
    });

    // Allocate for Section B
    await TeacherAssignment.create({
      teacherId: assignedTeacher._id,
      classId: class10._id,
      section: 'B',
      subjectId: s.sub._id,
      isClassTeacher: s.code === 'SCI10', // Vikram Sharma is Class Teacher of 10-B
      schoolId: SCHOOL_ID,
    });
  }
  console.log('✓ Allocated all 4 teachers across Section A & B.');

  // 8. 20 Students (10 in Section A, 10 in Section B)
  const studentsRaw = [
    // Section A (10 students)
    { name: 'Aarav Sharma', email: 'student@learnmate.test', adm: 'ADM-10A-001', roll: '1', sec: 'A' },
    { name: 'Ananya Patel', email: 'ananya.p@learnmate.test', adm: 'ADM-10A-002', roll: '2', sec: 'A' },
    { name: 'Rohan Gupta', email: 'rohan.g@learnmate.test', adm: 'ADM-10A-003', roll: '3', sec: 'A' },
    { name: 'Priya Nair', email: 'priya.n@learnmate.test', adm: 'ADM-10A-004', roll: '4', sec: 'A' },
    { name: 'Kabir Singh', email: 'kabir.s@learnmate.test', adm: 'ADM-10A-005', roll: '5', sec: 'A' },
    { name: 'Sneha Roy', email: 'sneha.r@learnmate.test', adm: 'ADM-10A-006', roll: '6', sec: 'A' },
    { name: 'Aditya Verma', email: 'aditya.v@learnmate.test', adm: 'ADM-10A-007', roll: '7', sec: 'A' },
    { name: 'Diya Sen', email: 'diya.s@learnmate.test', adm: 'ADM-10A-008', roll: '8', sec: 'A' },
    { name: 'Yash Joshi', email: 'yash.j@learnmate.test', adm: 'ADM-10A-009', roll: '9', sec: 'A' },
    { name: 'Riya Mukherjee', email: 'riya.m@learnmate.test', adm: 'ADM-10A-010', roll: '10', sec: 'A' },

    // Section B (10 students)
    { name: 'Devansh Verma', email: 'devansh.v@learnmate.test', adm: 'ADM-10B-011', roll: '1', sec: 'B' },
    { name: 'Tanvi Rao', email: 'tanvi.r@learnmate.test', adm: 'ADM-10B-012', roll: '2', sec: 'B' },
    { name: 'Siddharth Mehta', email: 'siddharth.m@learnmate.test', adm: 'ADM-10B-013', roll: '3', sec: 'B' },
    { name: 'Pooja Hegde', email: 'pooja.h@learnmate.test', adm: 'ADM-10B-014', roll: '4', sec: 'B' },
    { name: 'Varun Kapoor', email: 'varun.k@learnmate.test', adm: 'ADM-10B-015', roll: '5', sec: 'B' },
    { name: 'Ishita Bhatt', email: 'ishita.b@learnmate.test', adm: 'ADM-10B-016', roll: '6', sec: 'B' },
    { name: 'Aryan Saxena', email: 'aryan.s@learnmate.test', adm: 'ADM-10B-017', roll: '7', sec: 'B' },
    { name: 'Kriti Malhotra', email: 'kriti.m@learnmate.test', adm: 'ADM-10B-018', roll: '8', sec: 'B' },
    { name: 'Rahul Deshmukh', email: 'rahul.d@learnmate.test', adm: 'ADM-10B-019', roll: '9', sec: 'B' },
    { name: 'Simran Kaur', email: 'simran.k@learnmate.test', adm: 'ADM-10B-020', roll: '10', sec: 'B' },
  ];

  const students = [];
  for (const s of studentsRaw) {
    const studentUser = await User.create({
      name: s.name,
      email: s.email,
      passwordHash: defaultPasswordHash,
      role: 'student',
      admissionNo: s.adm,
      classId: class10._id,
      sectionId: s.sec,
      status: 'active',
      mustChangePassword: false,
      schoolId: SCHOOL_ID,
    });

    // Enroll in all 5 subjects
    for (const subItem of subjects) {
      await StudentSubject.create({
        studentId: studentUser._id,
        subjectId: subItem.sub._id,
        classId: class10._id,
        isElective: false,
        schoolId: SCHOOL_ID,
      });
    }

    students.push({ user: studentUser, ...s });
  }
  console.log(`✓ Seeded ${students.length} students and enrolled each in all 5 core subjects.`);

  // 9. Primary Parent (Rajesh Sharma) & Secondary Parents
  const primaryStudent = students[0].user; // Aarav Sharma
  const parentUser = await User.create({
    name: 'Rajesh Sharma',
    email: 'parent@learnmate.test',
    passwordHash: defaultPasswordHash,
    role: 'parent',
    status: 'active',
    mustChangePassword: false,
    schoolId: SCHOOL_ID,
    childIds: [primaryStudent._id],
  });
  primaryStudent.parentId = parentUser._id;
  await primaryStudent.save();

  // Create 3 additional sample parents
  const extraParents = [
    { name: 'Sunil Gupta', email: 'sunil.gupta@learnmate.test', childIdx: 2 },
    { name: 'Rekha Verma', email: 'rekha.verma@learnmate.test', childIdx: 10 }, // Devansh's parent
    { name: 'Deepak Rao', email: 'deepak.rao@learnmate.test', childIdx: 11 },
  ];

  for (const ep of extraParents) {
    const child = students[ep.childIdx].user;
    const p = await User.create({
      name: ep.name,
      email: ep.email,
      passwordHash: defaultPasswordHash,
      role: 'parent',
      status: 'active',
      mustChangePassword: false,
      schoolId: SCHOOL_ID,
      childIds: [child._id],
    });
    child.parentId = p._id;
    await child.save();
  }
  console.log('✓ Seeded parents with bidirectional student-parent links.');

  // 10. Topics & Lessons
  const mathSub = subjects.find((s) => s.code === 'MATH10').sub;
  const sciSub = subjects.find((s) => s.code === 'SCI10').sub;
  const engSub = subjects.find((s) => s.code === 'ENG10').sub;
  const sstSub = subjects.find((s) => s.code === 'SST10').sub;

  const topicMath1 = await Topic.create({
    subjectId: mathSub._id,
    classId: class10._id,
    name: 'Chapter 1: Real Numbers',
    order: 1,
    schoolId: SCHOOL_ID,
  });

  const topicMath2 = await Topic.create({
    subjectId: mathSub._id,
    classId: class10._id,
    name: 'Chapter 2: Quadratic Equations',
    order: 2,
    schoolId: SCHOOL_ID,
  });

  const topicSci1 = await Topic.create({
    subjectId: sciSub._id,
    classId: class10._id,
    name: 'Chapter 1: Chemical Reactions & Equations',
    order: 1,
    schoolId: SCHOOL_ID,
  });

  const topicSci2 = await Topic.create({
    subjectId: sciSub._id,
    classId: class10._id,
    name: 'Chapter 2: Light Reflection & Refraction',
    order: 2,
    schoolId: SCHOOL_ID,
  });

  await Lesson.create({
    subjectId: mathSub._id,
    topicId: topicMath2._id,
    title: 'Solving Quadratic Equations by Factorisation & Quadratic Formula',
    content: 'Standard form ax^2 + bx + c = 0, discriminant D = b^2 - 4ac, nature of roots, and real-world word problems.',
    order: 1,
    schoolId: SCHOOL_ID,
  });

  await Lesson.create({
    subjectId: sciSub._id,
    topicId: topicSci1._id,
    title: 'Types of Chemical Reactions & Experimental Observations',
    content: 'Combination, Decomposition, Displacement, Redox reactions, and balancing ionic equations.',
    order: 1,
    schoolId: SCHOOL_ID,
  });
  console.log('✓ Seeded academic topics & lessons.');

  // 11. Assignments for Section A and Section B
  const teacherMeera = teachers[0].user;
  const teacherVikram = teachers[1].user;
  const teacherSunita = teachers[2].user;

  const assignMathA = await Assignment.create({
    title: 'Quadratic Equations Problem Set 2.1',
    classId: class10._id,
    section: 'A',
    subjectId: mathSub._id,
    topicId: topicMath2._id,
    teacherId: teacherMeera._id,
    description: 'Solve textbook exercises 2.1 questions 1 to 10. Show step-by-step factorization and verify roots.',
    dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000),
    totalMarks: 25,
    estimatedMinutes: 45,
    status: 'published',
    schoolId: SCHOOL_ID,
  });

  const assignSciA = await Assignment.create({
    title: 'Balancing Chemical Equations & Redox Lab Exercise',
    classId: class10._id,
    section: 'A',
    subjectId: sciSub._id,
    topicId: topicSci1._id,
    teacherId: teacherVikram._id,
    description: 'Write complete ionic and balanced molecular equations for 8 laboratory reactions with oxidation state analysis.',
    dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    totalMarks: 20,
    estimatedMinutes: 35,
    status: 'published',
    schoolId: SCHOOL_ID,
  });

  const assignEngA = await Assignment.create({
    title: 'Critical Appreciation: The Ball Poem & Theme of Loss',
    classId: class10._id,
    section: 'A',
    subjectId: engSub._id,
    teacherId: teacherSunita._id,
    description: 'Draft a 250-word analytical paragraph exploring psychological resilience and maturity in John Berryman\'s poem.',
    dueDate: new Date(Date.now() + 6 * 24 * 3600 * 1000),
    totalMarks: 20,
    estimatedMinutes: 30,
    status: 'published',
    schoolId: SCHOOL_ID,
  });

  const assignMathB = await Assignment.create({
    title: 'Quadratic Equations Problem Set 2.1 (Section B)',
    classId: class10._id,
    section: 'B',
    subjectId: mathSub._id,
    topicId: topicMath2._id,
    teacherId: teacherMeera._id,
    description: 'Solve questions 1 through 8 showing step-by-step discriminant calculations.',
    dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000),
    totalMarks: 25,
    estimatedMinutes: 45,
    status: 'published',
    schoolId: SCHOOL_ID,
  });
  console.log('✓ Seeded active assignments for both sections.');

  // 12. Student Submissions & Grading
  // Submissions for Aarav Sharma (student@learnmate.test)
  await Submission.create({
    assignmentId: assignMathA._id,
    studentId: primaryStudent._id,
    content: 'Completed all 10 quadratic equation problems with verified discriminant checks.',
    status: 'graded',
    marksAwarded: 24,
    feedback: 'Outstanding mathematical rigor and neat step-by-step factorization! Minor calculation typo in Question 7.',
    schoolId: SCHOOL_ID,
  });

  await Submission.create({
    assignmentId: assignSciA._id,
    studentId: primaryStudent._id,
    content: 'Attached lab observations and balanced chemical equations for all 8 experiment sets.',
    status: 'graded',
    marksAwarded: 19,
    feedback: 'Excellent work identifying redox agents. Keep up this level of lab work.',
    schoolId: SCHOOL_ID,
  });

  // Seed submissions for Section A students
  for (let i = 1; i < 8; i++) {
    const st = students[i].user;
    const scoreMath = Math.floor(20 + Math.random() * 5); // 20 - 25
    await Submission.create({
      assignmentId: assignMathA._id,
      studentId: st._id,
      content: `Handwritten answers scanned and submitted for ${assignMathA.title}.`,
      status: 'graded',
      marksAwarded: scoreMath,
      feedback: 'Good conceptual approach. Demonstrated clear mastery of formula substitution.',
      schoolId: SCHOOL_ID,
    });
  }

  // Seed lower score for Devansh Verma (at-risk student in Section B)
  const devansh = students[10].user;
  await Submission.create({
    assignmentId: assignMathB._id,
    studentId: devansh._id,
    content: 'Attempted only first 4 questions.',
    status: 'graded',
    marksAwarded: 12, // 12/25 = 48%
    feedback: 'Needs practice with discriminant formulas. Incomplete submission of part B.',
    schoolId: SCHOOL_ID,
  });
  console.log('✓ Seeded graded assignment submissions.');

  // 13. Periodic Tests & Attempts
  const testMath = await Test.create({
    title: 'Class 10 Mathematics Chapter Assessment: Polynomials & Quadratics',
    classId: class10._id,
    section: 'A',
    subjectId: mathSub._id,
    teacherId: teacherMeera._id,
    durationMinutes: 45,
    totalMarks: 30,
    startWindow: new Date(Date.now() - 3 * 24 * 3600 * 1000),
    endWindow: new Date(Date.now() + 2 * 24 * 3600 * 1000),
    status: 'published',
    schoolId: SCHOOL_ID,
  });

  // Test Attempt for Aarav Sharma
  await TestAttempt.create({
    testId: testMath._id,
    studentId: primaryStudent._id,
    score: 28,
    totalMarks: 30,
    status: 'submitted',
    submittedAt: new Date(Date.now() - 24 * 3600 * 1000),
    schoolId: SCHOOL_ID,
  });

  // Test Attempt for 6 other students
  for (let i = 1; i < 7; i++) {
    await TestAttempt.create({
      testId: testMath._id,
      studentId: students[i].user._id,
      score: Math.floor(22 + Math.random() * 7),
      totalMarks: 30,
      status: 'submitted',
      submittedAt: new Date(Date.now() - 20 * 3600 * 1000),
      schoolId: SCHOOL_ID,
    });
  }
  console.log('✓ Seeded tests and scored attempts.');

  // 14. Attendance Records: 14 Days of Daily Roll Call for both Class 10 Sections
  console.log('\n--- 14. Generating 14 Days of Attendance for all 20 Students ---');
  let attendanceCount = 0;
  const now = new Date();

  for (let dayOffset = 14; dayOffset >= 0; dayOffset--) {
    const d = new Date(now.getTime() - dayOffset * 24 * 3600 * 1000);
    // Skip Sundays
    if (d.getDay() === 0) continue;

    const dateStr = d.toISOString().split('T')[0];

    for (const sec of ['A', 'B']) {
      const sectionStudents = students.filter((s) => s.sec === sec);
      const records = sectionStudents.map((s) => {
        let status = 'present';
        let remarks = 'On time';

        if (s.name === 'Devansh Verma') {
          if (dayOffset % 3 === 0) {
            status = 'absent';
            remarks = 'Unexcused absence - parent notified';
          } else if (dayOffset % 5 === 0) {
            status = 'late';
            remarks = 'Arrived 20 mins late for morning assembly';
          }
        } else {
          const rand = Math.random();
          if (rand > 0.95) {
            status = 'late';
            remarks = 'Traffic delay';
          } else if (rand > 0.98) {
            status = 'leave';
            remarks = 'Approved medical leave';
          }
        }

        attendanceCount++;
        return {
          studentId: s.user._id,
          status,
          remarks,
        };
      });

      await Attendance.create({
        classId: class10._id,
        section: sec,
        date: dateStr,
        period: 0,
        records,
        markedBy: teachers[sec === 'A' ? 0 : 1].user._id,
        schoolId: SCHOOL_ID,
      });
    }
  }
  console.log(`✓ Seeded ${attendanceCount} student daily attendance entries across 14 school days.`);

  // 15. Institutional Announcements
  await Announcement.create({
    title: 'Mid-Term Board Examination Schedule & Guidelines',
    content: 'Class 10 CBSE Pre-Board examinations commence next month. Check syllabus pacing on your subject workspace.',
    authorId: principalUser._id,
    targetAudience: 'all',
    priority: 'high',
    schoolId: SCHOOL_ID,
  });

  await Announcement.create({
    title: 'Annual Inter-School Science & Innovation Expo 2026',
    content: 'Entries for science project prototypes and AI demonstrations are now open. Consult Dr. Vikram Sharma for registration.',
    authorId: principalUser._id,
    targetAudience: 'students',
    priority: 'normal',
    schoolId: SCHOOL_ID,
  });
  console.log('✓ Seeded school-wide announcements.');

  // 16. Final Database Summary & Verification
  console.log('\n====================================================');
  console.log('              FINAL DATABASE VERIFICATION           ');
  console.log('====================================================');

  const totalUsers = await User.countDocuments({ schoolId: SCHOOL_ID });
  const countStudents = await User.countDocuments({ role: 'student', schoolId: SCHOOL_ID });
  const countTeachers = await User.countDocuments({ role: 'teacher', schoolId: SCHOOL_ID });
  const countParents = await User.countDocuments({ role: 'parent', schoolId: SCHOOL_ID });
  const countClasses = await Class.countDocuments({ schoolId: SCHOOL_ID });
  const countSubjects = await Subject.countDocuments({ schoolId: SCHOOL_ID });
  const countAttendance = await Attendance.countDocuments({ schoolId: SCHOOL_ID });
  const countAssignments = await Assignment.countDocuments({ schoolId: SCHOOL_ID });
  const countSubmissions = await Submission.countDocuments({ schoolId: SCHOOL_ID });

  console.log(`✓ Total Users:       ${totalUsers}`);
  console.log(`   - Students:       ${countStudents} (Class 10-A: 10, Class 10-B: 10)`);
  console.log(`   - Teachers:       ${countTeachers} (Meera, Vikram, Sunita, Rajiv)`);
  console.log(`   - Parents:        ${countParents} (Rajesh Sharma + 3 guardians)`);
  console.log(`   - Principal:      1 (Dr. Ramesh Iyer)`);
  console.log(`   - Administrator:  1 (System Administrator)`);
  console.log(`✓ Total Classes:     ${countClasses} (Class 10 Sections A & B)`);
  console.log(`✓ Total Subjects:    ${countSubjects} (Maths, Science, English, SST, Hindi)`);
  console.log(`✓ Attendance Logs:   ${countAttendance} daily records`);
  console.log(`✓ Assignments:       ${countAssignments} published sets`);
  console.log(`✓ Submissions:       ${countSubmissions} graded submissions`);
  console.log('====================================================');

  await mongoose.disconnect();
}

runSeed().catch((err) => {
  console.error('Seed execution error:', err);
  process.exit(1);
});
