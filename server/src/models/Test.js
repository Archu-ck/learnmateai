const mongoose = require('mongoose');

const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
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
      default: 'all',
    },
    topicIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
      },
    ],
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    questionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    durationMinutes: {
      type: Number,
      required: true,
      default: 30,
    },
    totalMarks: {
      type: Number,
      default: 20,
    },
    startWindow: {
      type: Date,
      default: Date.now,
    },
    endWindow: {
      type: Date,
    },
    shuffleQuestions: {
      type: Boolean,
      default: false,
    },
    attemptLimit: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'available'],
      default: 'published',
      index: true,
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

module.exports = mongoose.model('Test', testSchema);
