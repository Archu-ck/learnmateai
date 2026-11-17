require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { connectDB, closeDB } = require('./db');

const User = require('./models/User');
const Class = require('./models/Class');
const Subject = require('./models/Subject');
const RolePermission = require('./models/RolePermission');
const AuditLog = require('./models/AuditLog');
const TeacherAssignment = require('./models/TeacherAssignment');
const StudentSubject = require('./models/StudentSubject');
const Topic = require('./models/Topic');
const Lesson = require('./models/Lesson');
const Assignment = require('./models/Assignment');
const Submission = require('./models/Submission');
const Question = require('./models/Question');
const Test = require('./models/Test');
const TestAttempt = require('./models/TestAttempt');
const Grade = require('./models/Grade');
const Attendance = require('./models/Attendance');
const TimetableEntry = require('./models/TimetableEntry');
const ChatThread = require('./models/ChatThread');
const ChatMessage = require('./models/ChatMessage');
const Announcement = require('./models/Announcement');
const StudyBlock = require('./models/StudyBlock');
const MasteryRecord = require('./models/MasteryRecord');
const ChatSetting = require('./models/ChatSetting');
const { DEFAULT_ROLE_PERMISSIONS } = require('./constants/permissions');
const { seedClass10 } = require('./seedClass10');

const SCHOOL_ID = process.env.SCHOOL_ID || 'school-default-01';

async function seedDatabase() {
  console.log('--- Starting LearnMate Comprehensive Database Seeding ---');

  // 1. Role Permissions
  for (const [role, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    await RolePermission.findOneAndUpdate(
      { role, schoolId: SCHOOL_ID },
      { role, permissions, schoolId: SCHOOL_ID },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log('1. Role Permissions seeded.');

  // 2. Chat Settings
  await ChatSetting.findOneAndUpdate(
    { schoolId: SCHOOL_ID },
    { schoolId: SCHOOL_ID, chatHoursEnabled: false, startHour: 6, endHour: 23, disabledClassIds: [] },
    { upsert: true, new: true }
  );

  // 3. Admin Account
  const adminEmail = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@learnmate.test').toLowerCase();
  const adminPasswordHash = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'AdminPass123!', 10);
  const defaultUserHash = await bcrypt.hash('Password123!', 10);

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
  } else {
    adminUser.passwordHash = adminPasswordHash;
    adminUser.status = 'active';
    adminUser.mustChangePassword = false;
    await adminUser.save();
  }
  console.log('2. Admin user configured.');

  // 4. Principal & Parent Core Users
  await User.findOneAndUpdate(
    { email: 'principal@learnmate.test' },
    {
      name: 'Dr. Ramesh Iyer',
      email: 'principal@learnmate.test',
      role: 'principal',
      passwordHash: defaultUserHash,
      status: 'active',
      mustChangePassword: false,
      schoolId: SCHOOL_ID,
    },
    { upsert: true, new: true }
  );

  const parentUser = await User.findOneAndUpdate(
    { email: 'parent@learnmate.test' },
    {
      name: 'Sunita Sharma',
      email: 'parent@learnmate.test',
      role: 'parent',
      passwordHash: defaultUserHash,
      status: 'active',
      mustChangePassword: false,
      schoolId: SCHOOL_ID,
    },
    { upsert: true, new: true }
  );

  // 5. Classes: Grade 8 (Sections A & B)
  const grade8 = await Class.findOneAndUpdate(
    { name: 'Grade 8', schoolId: SCHOOL_ID },
    { name: 'Grade 8', sections: ['A', 'B'], academicYear: '2026-2027', schoolId: SCHOOL_ID },
    { upsert: true, new: true }
  );
  console.log('3. Grade 8 Class provisioned.');

  // 6. 3 Teachers
  const teacherData = [
    { name: 'Meera Krishnan', email: 'teacher@learnmate.test', role: 'teacher' },
    { name: 'Rajesh Verma', email: 'rajesh.v@learnmate.test', role: 'teacher' },
    { name: 'Anita Desai', email: 'anita.d@learnmate.test', role: 'teacher' },
  ];
  const teachers = [];
  for (const t of teacherData) {
    const user = await User.findOneAndUpdate(
      { email: t.email },
      { ...t, passwordHash: defaultUserHash, status: 'active', mustChangePassword: false, schoolId: SCHOOL_ID },
      { upsert: true, new: true }
    );
    teachers.push(user);
  }
  const [tMeera, tRajesh, tAnita] = teachers;
  console.log('4. Teachers seeded (Meera, Rajesh, Anita).');

  // 7. 12 Students
  const studentRoster = [
    // Section A (6 students)
    { name: 'Aarav Sharma', email: 'student@learnmate.test', admissionNo: 'ADM-2026-001', section: 'A' },
    { name: 'Ananya Gupta', email: 'ananya.g@learnmate.test', admissionNo: 'ADM-2026-002', section: 'A' },
    { name: 'Rohan Mehta', email: 'rohan.m@learnmate.test', admissionNo: 'ADM-2026-003', section: 'A' },
    { name: 'Priya Patel', email: 'priya.p@learnmate.test', admissionNo: 'ADM-2026-004', section: 'A' },
    { name: 'Kabir Verma', email: 'kabir.v@learnmate.test', admissionNo: 'ADM-2026-005', section: 'A' },
    { name: 'Diya Nair', email: 'diya.n@learnmate.test', admissionNo: 'ADM-2026-006', section: 'A' },
    // Section B (6 students)
    { name: 'Vikram Malhotra', email: 'vikram.m@learnmate.test', admissionNo: 'ADM-2026-007', section: 'B' },
    { name: 'Sneha Rao', email: 'sneha.r@learnmate.test', admissionNo: 'ADM-2026-008', section: 'B' },
    { name: 'Arjun Singh', email: 'arjun.s@learnmate.test', admissionNo: 'ADM-2026-009', section: 'B' },
    { name: 'Tanvi Joshi', email: 'tanvi.j@learnmate.test', admissionNo: 'ADM-2026-010', section: 'B' },
    { name: 'Aditya Kulkarni', email: 'aditya.k@learnmate.test', admissionNo: 'ADM-2026-011', section: 'B' },
    { name: 'Riya Sen', email: 'riya.s@learnmate.test', admissionNo: 'ADM-2026-012', section: 'B' },
  ];

  const students = [];
  for (const s of studentRoster) {
    const student = await User.findOneAndUpdate(
      { email: s.email },
      {
        name: s.name,
        email: s.email,
        role: 'student',
        admissionNo: s.admissionNo,
        classId: grade8._id,
        sectionId: s.section,
        passwordHash: defaultUserHash,
        status: 'active',
        mustChangePassword: false,
        schoolId: SCHOOL_ID,
      },
      { upsert: true, new: true }
    );
    students.push(student);
  }
  const aarav = students[0];
  parentUser.childIds = [aarav._id];
  await parentUser.save();
  console.log('5. 12 Students seeded across Section A and B.');

  // 8. Subjects
  const subjectsData = [
    { name: 'Mathematics', code: 'MATH101', isElective: false },
    { name: 'Science', code: 'SCI101', isElective: false },
    { name: 'English', code: 'ENG101', isElective: false },
    { name: 'Social Studies', code: 'SST101', isElective: false },
    { name: 'Computer Science', code: 'CS101', isElective: false },
    { name: 'Advanced Physics', code: 'PHYS101', isElective: true }, // Elective for Acceptance Check 1
  ];

  const subjects = [];
  for (const sub of subjectsData) {
    const s = await Subject.findOneAndUpdate(
      { code: sub.code, schoolId: SCHOOL_ID },
      { name: sub.name, code: sub.code, isElective: sub.isElective, classIds: [grade8._id], schoolId: SCHOOL_ID },
      { upsert: true, new: true }
    );
    subjects.push(s);
  }
  const [sMath, sSci, sEng, sSst, sCs, sPhysics] = subjects;
  console.log('6. Subjects created (Math, Sci, Eng, SST, CS, Physics).');

  // 9. Teacher Assignments
  const assignmentsList = [
    { teacherId: tMeera._id, classId: grade8._id, section: 'A', subjectId: sMath._id, isClassTeacher: true },
    { teacherId: tMeera._id, classId: grade8._id, section: 'B', subjectId: sMath._id, isClassTeacher: false },
    { teacherId: tRajesh._id, classId: grade8._id, section: 'A', subjectId: sSci._id, isClassTeacher: false },
    { teacherId: tRajesh._id, classId: grade8._id, section: 'B', subjectId: sSci._id, isClassTeacher: true },
    { teacherId: tRajesh._id, classId: grade8._id, section: 'A', subjectId: sPhysics._id, isClassTeacher: false },
    { teacherId: tAnita._id, classId: grade8._id, section: 'A', subjectId: sEng._id, isClassTeacher: false },
    { teacherId: tAnita._id, classId: grade8._id, section: 'A', subjectId: sSst._id, isClassTeacher: false },
    { teacherId: tAnita._id, classId: grade8._id, section: 'A', subjectId: sCs._id, isClassTeacher: false },
  ];

  for (const a of assignmentsList) {
    await TeacherAssignment.findOneAndUpdate(
      { teacherId: a.teacherId, classId: a.classId, section: a.section, subjectId: a.subjectId },
      { ...a, schoolId: SCHOOL_ID },
      { upsert: true, new: true }
    );
  }
  console.log('7. Teacher class-section assignments registered.');

  // 10. StudentSubject Enrollment Scoping
  // All 12 students get compulsory subjects (Math, Sci, Eng, SST, CS)
  const compulsorySubs = [sMath, sSci, sEng, sSst, sCs];
  for (const stu of students) {
    for (const sub of compulsorySubs) {
      await StudentSubject.findOneAndUpdate(
        { studentId: stu._id, subjectId: sub._id },
        { studentId: stu._id, subjectId: sub._id, classId: grade8._id, isElective: false, schoolId: SCHOOL_ID },
        { upsert: true, new: true }
      );
    }
  }

  // Acceptance Check 1: ONLY Aarav Sharma gets Advanced Physics (Elective)
  await StudentSubject.findOneAndUpdate(
    { studentId: aarav._id, subjectId: sPhysics._id },
    { studentId: aarav._id, subjectId: sPhysics._id, classId: grade8._id, isElective: true, schoolId: SCHOOL_ID },
    { upsert: true, new: true }
  );
  console.log('8. Subject allocations configured (Aarav only gets Physics elective).');

  // 11. Topics & Lessons
  const topicsData = [
    { subjectId: sMath._id, name: 'Linear Equations in One Variable', order: 1 },
    { subjectId: sMath._id, name: 'Understanding Quadrilaterals', order: 2 },
    { subjectId: sMath._id, name: 'Algebraic Expressions & Identities', order: 3 },
    { subjectId: sMath._id, name: 'Mensuration & Solid Shapes', order: 4 },
    { subjectId: sSci._id, name: 'Force and Pressure', order: 1 },
    { subjectId: sSci._id, name: 'Sound and Vibration', order: 2 },
    { subjectId: sSci._id, name: 'Chemical Effects of Electric Current', order: 3 },
    { subjectId: sEng._id, name: 'Tenses and Modals', order: 1 },
    { subjectId: sEng._id, name: 'Reading Comprehension', order: 2 },
    { subjectId: sPhysics._id, name: 'Thermodynamics & Heat Transfer', order: 1 },
  ];

  const topics = [];
  for (const t of topicsData) {
    const topic = await Topic.findOneAndUpdate(
      { subjectId: t.subjectId, name: t.name },
      { ...t, classId: grade8._id, schoolId: SCHOOL_ID },
      { upsert: true, new: true }
    );
    topics.push(topic);
  }
  const [tMath1, tMath2, tMath3, tMath4, tSci1, tSci2, tSci3, tEng1] = topics;

  // Lessons
  await Lesson.findOneAndUpdate(
    { topicId: tMath1._id, title: 'Concept of Linear Equations' },
    {
      subjectId: sMath._id,
      topicId: tMath1._id,
      title: 'Concept of Linear Equations',
      content: 'A linear equation in one variable is an algebraic equation of degree 1. Standard form: ax + b = c.',
      files: [{ name: 'Linear_Equations_Notes.pdf', url: '/uploads/Linear_Equations_Notes.pdf', type: 'application/pdf', size: 102400 }],
      links: [{ title: 'Khan Academy Linear Practice', url: 'https://khanacademy.org' }],
      status: 'published',
      readBy: [aarav._id],
      order: 1,
      schoolId: SCHOOL_ID,
    },
    { upsert: true, new: true }
  );

  await Lesson.findOneAndUpdate(
    { topicId: tSci1._id, title: 'Types of Forces & Atmospheric Pressure' },
    {
      subjectId: sSci._id,
      topicId: tSci1._id,
      title: 'Types of Forces & Atmospheric Pressure',
      content: 'Contact forces: Muscular, Friction. Non-contact forces: Magnetic, Gravitational, Electrostatic.',
      files: [{ name: 'Force_Diagrams.pdf', url: '/uploads/Force_Diagrams.pdf', type: 'application/pdf', size: 204800 }],
      status: 'published',
      readBy: [aarav._id],
      order: 1,
      schoolId: SCHOOL_ID,
    },
    { upsert: true, new: true }
  );
  console.log('9. Topics and syllabus lessons provisioned.');

  // 12. Questions & Question Bank
  const questionsData = [
    {
      subjectId: sMath._id,
      topicId: tMath1._id,
      type: 'mcq',
      text: 'What is the solution of the linear equation 2x + 7 = 15?',
      options: ['x = 3', 'x = 4', 'x = 5', 'x = 6'],
      answer: 'x = 4',
      explanation: 'Subtract 7 from both sides: 2x = 8, then divide by 2: x = 4.',
      marks: 2,
      difficulty: 'easy',
      tags: ['algebra', 'linear equations'],
    },
    {
      subjectId: sMath._id,
      topicId: tMath1._id,
      type: 'mcq',
      text: 'If 3(x - 2) = 18, what is the value of x?',
      options: ['x = 6', 'x = 7', 'x = 8', 'x = 9'],
      answer: 'x = 8',
      explanation: 'Divide both sides by 3: x - 2 = 6, hence x = 8.',
      marks: 2,
      difficulty: 'medium',
      tags: ['algebra'],
    },
    {
      subjectId: sMath._id,
      topicId: tMath2._id,
      type: 'mcq',
      text: 'What is the sum of interior angles of a quadrilateral?',
      options: ['180°', '270°', '360°', '540°'],
      answer: '360°',
      explanation: 'Sum of interior angles = (n - 2) * 180 = (4 - 2) * 180 = 360°.',
      marks: 2,
      difficulty: 'easy',
      tags: ['geometry'],
    },
    {
      subjectId: sSci._id,
      topicId: tSci1._id,
      type: 'mcq',
      text: 'Pressure is defined as:',
      options: ['Force × Area', 'Force / Area', 'Area / Force', 'Mass × Acceleration'],
      answer: 'Force / Area',
      explanation: 'P = F / A. SI unit is Pascal (N/m²).',
      marks: 2,
      difficulty: 'easy',
      tags: ['physics', 'pressure'],
    },
    {
      subjectId: sSci._id,
      topicId: tSci1._id,
      type: 'mcq',
      text: 'Which of the following is a non-contact force?',
      options: ['Friction', 'Tension', 'Gravitational Force', 'Muscular Force'],
      answer: 'Gravitational Force',
      explanation: 'Gravity acts across space without direct physical contact.',
      marks: 2,
      difficulty: 'easy',
      tags: ['physics', 'force'],
    },
  ];

  const questions = [];
  for (const q of questionsData) {
    const question = await Question.findOneAndUpdate(
      { text: q.text, subjectId: q.subjectId },
      { ...q, schoolId: SCHOOL_ID },
      { upsert: true, new: true }
    );
    questions.push(question);
  }

  // 13. Tests
  const mathTest = await Test.findOneAndUpdate(
    { title: 'Grade 8A Mathematics Unit Evaluation' },
    {
      title: 'Grade 8A Mathematics Unit Evaluation',
      subjectId: sMath._id,
      classId: grade8._id,
      section: 'A',
      topicIds: [tMath1._id, tMath2._id],
      teacherId: tMeera._id,
      questionIds: [questions[0]._id, questions[1]._id, questions[2]._id],
      durationMinutes: 20,
      totalMarks: 6,
      startWindow: new Date(Date.now() - 24 * 3600 * 1000),
      endWindow: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      shuffleQuestions: false,
      attemptLimit: 1,
      status: 'published',
      schoolId: SCHOOL_ID,
    },
    { upsert: true, new: true }
  );

  const sciTest = await Test.findOneAndUpdate(
    { title: 'Force and Pressure Diagnostic Quiz' },
    {
      title: 'Force and Pressure Diagnostic Quiz',
      subjectId: sSci._id,
      classId: grade8._id,
      section: 'A',
      topicIds: [tSci1._id],
      teacherId: tRajesh._id,
      questionIds: [questions[3]._id, questions[4]._id],
      durationMinutes: 15,
      totalMarks: 4,
      startWindow: new Date(Date.now() - 12 * 3600 * 1000),
      endWindow: new Date(Date.now() + 10 * 24 * 3600 * 1000),
      status: 'published',
      schoolId: SCHOOL_ID,
    },
    { upsert: true, new: true }
  );
  console.log('10. Question bank and Tests created.');

  // 14. Test Attempt for Aarav
  await TestAttempt.findOneAndUpdate(
    { testId: mathTest._id, studentId: aarav._id },
    {
      testId: mathTest._id,
      studentId: aarav._id,
      answers: [
        { questionId: questions[0]._id, answer: 'x = 4', isCorrect: true, marksAwarded: 2 },
        { questionId: questions[1]._id, answer: 'x = 8', isCorrect: true, marksAwarded: 2 },
        { questionId: questions[2]._id, answer: '360°', isCorrect: true, marksAwarded: 2 },
      ],
      score: 6,
      totalMarks: 6,
      startedAt: new Date(Date.now() - 2 * 3600 * 1000),
      submittedAt: new Date(Date.now() - 1.8 * 3600 * 1000),
      status: 'graded',
      schoolId: SCHOOL_ID,
    },
    { upsert: true, new: true }
  );

  // 15. 8 Realistic Assignments across states
  const assignmentsData = [
    {
      title: 'Linear Equations Problem Set 1',
      classId: grade8._id,
      section: 'A',
      subjectId: sMath._id,
      topicId: tMath1._id,
      teacherId: tMeera._id,
      description: 'Solve problems 1 through 15 on page 42 of NCERT textbook. Show all step-by-step working.',
      dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000),
      totalMarks: 25,
      estimatedMinutes: 45,
      aiHelpLevel: 'Hints only',
      status: 'published',
    },
    {
      title: 'Quadrilateral Properties Proofs',
      classId: grade8._id,
      section: 'A',
      subjectId: sMath._id,
      topicId: tMath2._id,
      teacherId: tMeera._id,
      description: 'Prove that the diagonals of a rectangle bisect each other and are equal in length.',
      dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000),
      totalMarks: 20,
      estimatedMinutes: 30,
      aiHelpLevel: 'Full',
      status: 'published',
    },
    {
      title: 'Force & Pressure Lab Report',
      classId: grade8._id,
      section: 'A',
      subjectId: sSci._id,
      topicId: tSci1._id,
      teacherId: tRajesh._id,
      description: 'Document the syringe and balloon atmospheric pressure demonstration with observations.',
      dueDate: new Date(Date.now() - 1 * 24 * 3600 * 1000),
      totalMarks: 30,
      estimatedMinutes: 60,
      aiHelpLevel: 'Hints only',
      status: 'published',
    },
    {
      title: 'Formal Letter to the Editor',
      classId: grade8._id,
      section: 'A',
      subjectId: sEng._id,
      topicId: tEng1._id,
      teacherId: tAnita._id,
      description: 'Write a letter on civic cleanliness and waste management (150 words).',
      dueDate: new Date(Date.now() + 4 * 24 * 3600 * 1000),
      totalMarks: 15,
      estimatedMinutes: 40,
      aiHelpLevel: 'None',
      status: 'published',
    },
    {
      title: 'Calculus of Waves Worksheet',
      classId: grade8._id,
      section: 'A',
      subjectId: sPhysics._id,
      teacherId: tRajesh._id,
      description: 'Elective Physics: calculate harmonic frequencies for standing waves in a stretched string.',
      dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000),
      totalMarks: 20,
      estimatedMinutes: 50,
      aiHelpLevel: 'Hints only',
      status: 'published',
    },
    {
      title: 'Sound Resonance Case Study',
      classId: grade8._id,
      section: 'A',
      subjectId: sSci._id,
      topicId: tSci2._id,
      teacherId: tRajesh._id,
      description: 'Draft notes on sonic booms and acoustic dampening.',
      dueDate: new Date(Date.now() + 8 * 24 * 3600 * 1000),
      totalMarks: 25,
      estimatedMinutes: 35,
      aiHelpLevel: 'Hints only',
      status: 'draft',
    },
    {
      title: 'History of Algorithms Essay',
      classId: grade8._id,
      section: 'A',
      subjectId: sCs._id,
      teacherId: tAnita._id,
      description: 'Outline the transition from mechanical calculating engines to stored-program computers.',
      dueDate: new Date(Date.now() + 10 * 24 * 3600 * 1000),
      totalMarks: 20,
      estimatedMinutes: 45,
      aiHelpLevel: 'Full',
      status: 'scheduled',
      scheduledAt: new Date(Date.now() + 2 * 24 * 3600 * 1000),
    },
    {
      title: 'SST: Indian Constitution Preamble Analysis',
      classId: grade8._id,
      section: 'A',
      subjectId: sSst._id,
      teacherId: tAnita._id,
      description: 'Explain the significance of the key terms Sovereign, Socialist, Secular, Democratic Republic.',
      dueDate: new Date(Date.now() + 6 * 24 * 3600 * 1000),
      totalMarks: 20,
      estimatedMinutes: 40,
      aiHelpLevel: 'Hints only',
      status: 'published',
    },
  ];

  const assignments = [];
  for (const a of assignmentsData) {
    const item = await Assignment.findOneAndUpdate(
      { title: a.title, classId: a.classId, subjectId: a.subjectId },
      { ...a, schoolId: SCHOOL_ID },
      { upsert: true, new: true }
    );
    assignments.push(item);
  }
  const [aMath1, aMath2, aSci1] = assignments;
  console.log('11. 8 Assignments seeded across states.');

  // Submissions for Aarav
  await Submission.findOneAndUpdate(
    { assignmentId: aSci1._id, studentId: aarav._id },
    {
      assignmentId: aSci1._id,
      studentId: aarav._id,
      textContent: 'Attached experiment notes showing atmospheric pressure holding water in an inverted tumbler covered with cardboard.',
      status: 'graded',
      marksAwarded: 28,
      feedback: 'Excellent observation notes and accurate diagrams! Great work on concluding with Pascal’s law.',
      submittedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      gradedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
      gradedBy: tRajesh._id,
      schoolId: SCHOOL_ID,
    },
    { upsert: true, new: true }
  );

  await Submission.findOneAndUpdate(
    { assignmentId: aMath1._id, studentId: aarav._id },
    {
      assignmentId: aMath1._id,
      studentId: aarav._id,
      textContent: 'Completed questions 1 to 10. Working on questions 11-15.',
      status: 'draft',
      schoolId: SCHOOL_ID,
    },
    { upsert: true, new: true }
  );

  // 16. Gradebook Entries
  await Grade.findOneAndUpdate(
    { studentId: aarav._id, assessmentId: aSci1._id },
    {
      studentId: aarav._id,
      assessmentType: 'assignment',
      assessmentId: aSci1._id,
      assessmentTitle: aSci1.title,
      subjectId: sSci._id,
      classId: grade8._id,
      marksObtained: 28,
      totalMarks: 30,
      percentage: 93.3,
      weight: 1,
      published: true,
      schoolId: SCHOOL_ID,
    },
    { upsert: true, new: true }
  );

  await Grade.findOneAndUpdate(
    { studentId: aarav._id, assessmentId: mathTest._id },
    {
      studentId: aarav._id,
      assessmentType: 'test',
      assessmentId: mathTest._id,
      assessmentTitle: mathTest.title,
      subjectId: sMath._id,
      classId: grade8._id,
      marksObtained: 6,
      totalMarks: 6,
      percentage: 100,
      weight: 1.5,
      published: true,
      schoolId: SCHOOL_ID,
    },
    { upsert: true, new: true }
  );

  // 17. Chat Threads
  const mathThread = await ChatThread.findOneAndUpdate(
    { studentId: aarav._id, subjectId: sMath._id },
    {
      studentId: aarav._id,
      teacherId: tMeera._id,
      subjectId: sMath._id,
      classId: grade8._id,
      section: 'A',
      lastMessageText: 'Can you please check my approach for question 12?',
      lastMessageAt: new Date(Date.now() - 30 * 60 * 1000),
      unreadTeacherCount: 1,
      unreadStudentCount: 0,
      hasUnresolvedDoubts: true,
      schoolId: SCHOOL_ID,
    },
    { upsert: true, new: true }
  );

  await ChatMessage.create({
    threadId: mathThread._id,
    senderId: aarav._id,
    senderRole: 'student',
    text: 'Good evening ma’am, I had a quick doubt regarding exercise 2.2 question 12 on ages.',
    isDoubt: true,
    resolved: false,
    schoolId: SCHOOL_ID,
  });

  await ChatMessage.create({
    threadId: mathThread._id,
    senderId: tMeera._id,
    senderRole: 'teacher',
    text: 'Hello Aarav! Remember to let x be the present age, so 15 years later it will be x + 15.',
    isDoubt: false,
    resolved: false,
    schoolId: SCHOOL_ID,
  });

  await ChatMessage.create({
    threadId: mathThread._id,
    senderId: aarav._id,
    senderRole: 'student',
    text: 'Got it, thank you! That made the quadratic equation simplify cleanly.',
    isDoubt: false,
    resolved: true,
    schoolId: SCHOOL_ID,
  });

  // 18. Attendance (past 20 school days)
  const today = new Date();
  for (let i = 1; i <= 20; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue; // skip weekends
    const dateStr = d.toISOString().slice(0, 10);

    const records = students.map((stu) => {
      // Simulate Diya Nair having lower attendance (Needs Attention)
      let status = 'present';
      if (stu.email === 'diya.n@learnmate.test' && i % 3 === 0) status = 'absent';
      else if (stu.email === 'kabir.v@learnmate.test' && i % 4 === 0) status = 'absent';
      else if (i % 9 === 0) status = 'late';
      return { studentId: stu._id, status, remarks: status === 'late' ? 'School bus delayed' : '' };
    });

    await Attendance.findOneAndUpdate(
      { classId: grade8._id, section: 'A', date: dateStr, period: 0 },
      {
        classId: grade8._id,
        section: 'A',
        date: dateStr,
        period: 0,
        records,
        markedBy: tMeera._id,
        schoolId: SCHOOL_ID,
      },
      { upsert: true, new: true }
    );
  }
  console.log('12. 20 days of student attendance records simulated.');

  // 19. Timetable Entries
  const scheduleDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const dailySlots = [
    { period: 1, startTime: '08:30', endTime: '09:15', sub: sMath, teacher: tMeera },
    { period: 2, startTime: '09:20', endTime: '10:05', sub: sSci, teacher: tRajesh },
    { period: 3, startTime: '10:20', endTime: '11:05', sub: sEng, teacher: tAnita },
    { period: 4, startTime: '11:10', endTime: '11:55', sub: sSst, teacher: tAnita },
    { period: 5, startTime: '12:40', endTime: '01:25', sub: sCs, teacher: tAnita },
    { period: 6, startTime: '01:30', endTime: '02:15', sub: sPhysics, teacher: tRajesh },
  ];

  for (const day of scheduleDays) {
    for (const slot of dailySlots) {
      await TimetableEntry.findOneAndUpdate(
        { classId: grade8._id, section: 'A', day, period: slot.period },
        {
          classId: grade8._id,
          section: 'A',
          day,
          period: slot.period,
          startTime: slot.startTime,
          endTime: slot.endTime,
          subjectId: slot.sub._id,
          teacherId: slot.teacher._id,
          room: 'Room 8-A',
          schoolId: SCHOOL_ID,
        },
        { upsert: true, new: true }
      );
    }
  }

  // 20. Topic Mastery for Aarav
  await MasteryRecord.findOneAndUpdate(
    { studentId: aarav._id, topicId: tMath1._id },
    { studentId: aarav._id, topicId: tMath1._id, subjectId: sMath._id, level: 'mastered', scorePercentage: 95, schoolId: SCHOOL_ID },
    { upsert: true, new: true }
  );
  await MasteryRecord.findOneAndUpdate(
    { studentId: aarav._id, topicId: tMath2._id },
    { studentId: aarav._id, topicId: tMath2._id, subjectId: sMath._id, level: 'developing', scorePercentage: 65, schoolId: SCHOOL_ID },
    { upsert: true, new: true }
  );
  await MasteryRecord.findOneAndUpdate(
    { studentId: aarav._id, topicId: tSci1._id },
    { studentId: aarav._id, topicId: tSci1._id, subjectId: sSci._id, level: 'proficient', scorePercentage: 88, schoolId: SCHOOL_ID },
    { upsert: true, new: true }
  );

  // 21. Study Blocks for Aarav
  const studyBlocks = [
    { day: 'Monday', startTime: '17:00', endTime: '18:00', title: 'Maths Problem Set Practice', subjectId: sMath._id, subjectName: 'Mathematics', type: 'study', isCompleted: true },
    { day: 'Monday', startTime: '18:15', endTime: '19:00', title: 'Science Notes Revision', subjectId: sSci._id, subjectName: 'Science', type: 'revision', isCompleted: false },
    { day: 'Tuesday', startTime: '17:30', endTime: '18:30', title: 'English Essay Writing', subjectId: sEng._id, subjectName: 'English', type: 'study', isCompleted: false },
    { day: 'Wednesday', startTime: '16:30', endTime: '17:30', title: 'Physics Numerical Problems', subjectId: sPhysics._id, subjectName: 'Advanced Physics', type: 'study', isCompleted: false },
  ];
  for (const b of studyBlocks) {
    await StudyBlock.create({ ...b, studentId: aarav._id, schoolId: SCHOOL_ID });
  }

  // 22. School Announcements
  await Announcement.create({
    title: 'Inter-House Science & Robotics Exhibition',
    content: 'All students are invited to register projects for the National Science Day exhibition by next Friday.',
    targetType: 'school',
    authorId: adminUser._id,
    authorName: 'Dr. Ramesh Iyer',
    schoolId: SCHOOL_ID,
  });

  await Announcement.create({
    title: 'Grade 8 Term-1 Examination Timetable Released',
    content: 'The date sheet for Term 1 assessments has been published on your student calendar.',
    targetType: 'class',
    targetId: grade8._id.toString(),
    authorId: tMeera._id,
    authorName: 'Meera Krishnan',
    schoolId: SCHOOL_ID,
  });

  // 23. Audit Log
  await AuditLog.create({
    actorId: adminUser._id,
    action: 'system.comprehensive_seed',
    targetType: 'system',
    targetId: 'seed',
    details: {
      message: 'Comprehensive seeding completed: 12 students, 3 teachers, Grade 8A/B, 6 subjects, topics, assignments, tests, timetable, and attendance.',
    },
    schoolId: SCHOOL_ID,
  });

  // 24. Class 10th Provisioning
  await seedClass10();

  console.log('--- LearnMate Comprehensive Database Seeding Finished Successfully ---');
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
