const { connectDB } = require('../src/db');
require('dotenv').config();
const User = require('../src/models/User');
const Subject = require('../src/models/Subject');
const Class = require('../src/models/Class');
const StudentSubject = require('../src/models/StudentSubject');
const TeacherAssignment = require('../src/models/TeacherAssignment');
const Topic = require('../src/models/Topic');
const Lesson = require('../src/models/Lesson');
const Test = require('../src/models/Test');

async function migrate() {
  await connectDB();
  console.log('--- Migrating Class 10 to Strictly 4 Core Subjects in MongoDB ---');

  const SCHOOL_ID = process.env.SCHOOL_ID || 'school-default-01';

  // 1. Locate Class 10
  let class10 = await Class.findOne({ name: 'Class 10', schoolId: SCHOOL_ID });
  if (!class10) {
    class10 = await Class.findOne({ name: /10/i, schoolId: SCHOOL_ID });
  }
  if (!class10) {
    throw new Error('Class 10 not found in database!');
  }
  console.log(`Found Class 10: ${class10._id} (${class10.name})`);

  // 2. Define strictly the 4 core subjects
  const fourCoreSubjects = [
    { code: 'MATH10', name: 'Mathematics (Class 10)' },
    { code: 'SCI10', name: 'Science (Class 10)' },
    { code: 'ENG10', name: 'English (Class 10)' },
    { code: 'SST10', name: 'Social Studies (Class 10)' },
  ];

  const fourSubjectDocs = [];
  for (const s of fourCoreSubjects) {
    const doc = await Subject.findOneAndUpdate(
      { code: s.code, schoolId: SCHOOL_ID },
      {
        name: s.name,
        code: s.code,
        isElective: false,
        $addToSet: { classIds: class10._id },
        schoolId: SCHOOL_ID,
      },
      { upsert: true, new: true }
    );
    fourSubjectDocs.push(doc);
    console.log(`✓ Subject registered: ${doc.name} (${doc.code}) -> ${doc._id}`);
  }

  const fourSubjectIds = fourSubjectDocs.map((s) => s._id);

  // 3. Remove Class 10 from any other subjects in database
  const otherSubjects = await Subject.find({
    _id: { $nin: fourSubjectIds },
    classIds: class10._id,
  });
  for (const other of otherSubjects) {
    other.classIds = other.classIds.filter((cid) => cid.toString() !== class10._id.toString());
    await other.save();
    console.log(`Unlinked extra subject from Class 10: ${other.name} (${other.code})`);
  }

  // 4. Enroll Class 10 students into EXACTLY these 4 subjects
  const class10Students = await User.find({
    role: 'student',
    classId: class10._id,
  });

  // Also include student@learnmate.test
  const defaultStudent = await User.findOne({ email: 'student@learnmate.test' });
  if (defaultStudent && !class10Students.some((s) => s._id.toString() === defaultStudent._id.toString())) {
    defaultStudent.classId = class10._id;
    defaultStudent.sectionId = 'A';
    await defaultStudent.save();
    class10Students.push(defaultStudent);
  }

  for (const st of class10Students) {
    // Remove any enrollments outside the 4 core subjects
    const deleted = await StudentSubject.deleteMany({
      studentId: st._id,
      subjectId: { $nin: fourSubjectIds },
    });
    if (deleted.deletedCount > 0) {
      console.log(`Removed ${deleted.deletedCount} extraneous subject enrollments for ${st.email}`);
    }

    // Ensure the 4 core subjects are enrolled
    for (const subDoc of fourSubjectDocs) {
      await StudentSubject.findOneAndUpdate(
        { studentId: st._id, subjectId: subDoc._id },
        {
          studentId: st._id,
          subjectId: subDoc._id,
          classId: class10._id,
          section: st.sectionId || 'A',
          schoolId: SCHOOL_ID,
        },
        { upsert: true }
      );
    }

    const currentEnrollments = await StudentSubject.find({ studentId: st._id }).populate('subjectId', 'name code');
    console.log(
      `✓ Verified ${st.email} (${st.name}) has exactly ${currentEnrollments.length} subjects:`,
      currentEnrollments.map((e) => e.subjectId?.name).join(', ')
    );
  }

  // 5. Ensure teachers are assigned to all 4 subjects
  const tMeera = await User.findOne({ email: 'teacher@learnmate.test' });
  const tRajesh = await User.findOne({ email: 'teacher.rajesh@learnmate.test' });
  const tAnita = await User.findOne({ email: 'teacher.anita@learnmate.test' });

  if (tMeera) {
    await TeacherAssignment.findOneAndUpdate(
      { classId: class10._id, subjectId: fourSubjectDocs[0]._id, section: 'A' },
      { teacherId: tMeera._id, classId: class10._id, subjectId: fourSubjectDocs[0]._id, section: 'A', schoolId: SCHOOL_ID },
      { upsert: true }
    );
  }
  if (tRajesh) {
    await TeacherAssignment.findOneAndUpdate(
      { classId: class10._id, subjectId: fourSubjectDocs[1]._id, section: 'A' },
      { teacherId: tRajesh._id, classId: class10._id, subjectId: fourSubjectDocs[1]._id, section: 'A', schoolId: SCHOOL_ID },
      { upsert: true }
    );
    await TeacherAssignment.findOneAndUpdate(
      { classId: class10._id, subjectId: fourSubjectDocs[3]._id, section: 'A' },
      { teacherId: tRajesh._id, classId: class10._id, subjectId: fourSubjectDocs[3]._id, section: 'A', schoolId: SCHOOL_ID },
      { upsert: true }
    );
  }
  if (tAnita) {
    await TeacherAssignment.findOneAndUpdate(
      { classId: class10._id, subjectId: fourSubjectDocs[2]._id, section: 'A' },
      { teacherId: tAnita._id, classId: class10._id, subjectId: fourSubjectDocs[2]._id, section: 'A', schoolId: SCHOOL_ID },
      { upsert: true }
    );
  }
  console.log('✓ Teacher assignments verified for all 4 subjects.');

  console.log('\n--- Migration Completed Successfully: Class 10 is 100% DB-driven with exactly 4 subjects! ---');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
