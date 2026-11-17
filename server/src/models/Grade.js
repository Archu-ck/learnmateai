const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assessmentType: {
      type: String,
      enum: ['assignment', 'test', 'exam'],
      required: true,
    },
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    assessmentTitle: {
      type: String,
      default: '',
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      index: true,
    },
    marksObtained: {
      type: Number,
      required: true,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    weight: {
      type: Number,
      default: 1,
    },
    published: {
      type: Boolean,
      default: true,
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

module.exports = mongoose.model('Grade', gradeSchema);
