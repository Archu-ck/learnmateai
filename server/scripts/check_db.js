const { connectDB } = require('../src/db');
require('dotenv').config();
const User = require('../src/models/User');
const Subject = require('../src/models/Subject');
const Class = require('../src/models/Class');
const StudentSubject = require('../src/models/StudentSubject');

async function check() {
  await connectDB();

  const students = await User.find({ role: 'student' }).select('name email classId');
  console.log('Students:');
  students.forEach((s) => console.log(` - ${s.name} (${s.email}) classId: ${s.classId}`));

  const classes = await Class.find().select('name gradeLevel');
  console.log('\nClasses:');
  classes.forEach((c) => console.log(` - ${c._id}: ${c.name} (Grade ${c.gradeLevel})`));

  const subjects = await Subject.find().select('name code classId');
  console.log('\nSubjects:');
  subjects.forEach((s) => console.log(` - ${s._id}: ${s.name} (${s.code}) classId: ${s.classId}`));

  console.log('\nStudent Enrollments:');
  for (const s of students) {
    const en = await StudentSubject.find({ studentId: s._id }).populate('subjectId', 'name code');
    console.log(` - ${s.email} (${en.length} subjects):`);
    en.forEach((e) => console.log(`     * ${e.subjectId?.name} (${e.subjectId?.code})`));
  }

  process.exit(0);
}

check().catch(console.error);
