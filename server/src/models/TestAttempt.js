const mongoose = require('mongoose');

const testAttemptSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question',
        },
        answer: String,
        selectedOption: String, // 'A', 'B', 'C', 'D' or string
        isCorrect: Boolean,
        marksAwarded: Number,
        feedback: String,
        flagged: {
          type: Boolean,
          default: false,
        },
        flaggedForReview: {
          type: Boolean,
          default: false,
        },
        timeSpent: {
          type: Number,
          default: 0,
        },
      },
    ],
    score: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    durationMinutes: {
      type: Number,
      default: 30,
    },
    expiresAt: {
      type: Date,
    },
    submittedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'auto_submitted', 'graded'],
      default: 'in_progress',
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

testAttemptSchema.index({ testId: 1, studentId: 1 });

module.exports = mongoose.model('TestAttempt', testAttemptSchema);
