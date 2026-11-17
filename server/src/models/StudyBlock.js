const mongoose = require('mongoose');

const studyBlockSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    },
    startTime: {
      type: String, // e.g. "17:00"
      required: true,
    },
    endTime: {
      type: String, // e.g. "18:30"
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
    },
    subjectName: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['school', 'study', 'coaching', 'free', 'revision'],
      default: 'study',
    },
    isCompleted: {
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

module.exports = mongoose.model('StudyBlock', studyBlockSchema);
