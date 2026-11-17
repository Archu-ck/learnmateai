const mongoose = require('mongoose');

const fileAttachmentSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    url: { type: String, default: '' },
    type: { type: String, default: '' },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const rubricScoreSchema = new mongoose.Schema(
  {
    criterion: { type: String, default: '' },
    score: { type: Number, default: 0 },
    maxMarks: { type: Number, default: 0 },
    comment: { type: String, default: '' },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    textContent: {
      type: String,
      default: '',
    },
    files: [fileAttachmentSchema],
    status: {
      type: String,
      enum: ['draft', 'submitted', 'graded', 'revision_requested', 'late'],
      default: 'submitted',
      index: true,
    },
    marksAwarded: {
      type: Number,
      default: null,
    },
    feedback: {
      type: String,
      default: '',
    },
    rubricScores: [rubricScoreSchema],
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    gradedAt: {
      type: Date,
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
