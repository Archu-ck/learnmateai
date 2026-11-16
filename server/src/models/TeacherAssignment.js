const mongoose = require('mongoose');

const teacherAssignmentSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      index: true,
    },
    section: {
      type: String,
      required: true,
      trim: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
    },
    isClassTeacher: {
      type: Boolean,
      default: false,
    },
    schoolId: {
      type: String,
      required: true,
      default: 'school-default-01',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Note: A class-section can have only one class teacher
teacherAssignmentSchema.index(
  { schoolId: 1, classId: 1, section: 1, isClassTeacher: 1 },
  {
    unique: true,
    partialFilterExpression: { isClassTeacher: true },
  }
);

module.exports = mongoose.model('TeacherAssignment', teacherAssignmentSchema);
