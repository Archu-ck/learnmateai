const mongoose = require('mongoose');

const chatThreadSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
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
    section: {
      type: String,
      default: 'A',
    },
    lastMessageText: {
      type: String,
      default: '',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    unreadStudentCount: {
      type: Number,
      default: 0,
    },
    unreadTeacherCount: {
      type: Number,
      default: 0,
    },
    hasUnresolvedDoubts: {
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

chatThreadSchema.index({ studentId: 1, subjectId: 1 }, { unique: true });

module.exports = mongoose.model('ChatThread', chatThreadSchema);
