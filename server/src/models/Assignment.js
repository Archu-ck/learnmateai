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

const rubricItemSchema = new mongoose.Schema(
  {
    criterion: { type: String, default: '' },
    maxMarks: { type: Number, default: 0 },
    description: { type: String, default: '' },
  },
  { _id: false }
);

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
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
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      index: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    attachments: [fileAttachmentSchema],
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    totalMarks: {
      type: Number,
      default: 100,
    },
    estimatedMinutes: {
      type: Number,
      default: 45,
    },
    estimatedEffortReasoning: {
      type: String,
      default: '',
    },
    aiHelpLevel: {
      type: String,
      enum: ['None', 'Hints only', 'Full'],
      default: 'Hints only',
    },
    latePolicy: {
      type: String,
      enum: ['allowed', 'not_allowed', 'penalty'],
      default: 'allowed',
    },
    resubmissionAllowed: {
      type: Boolean,
      default: true,
    },
    rubric: [rubricItemSchema],
    status: {
      type: String,
      enum: ['draft', 'published', 'scheduled'],
      default: 'published',
      index: true,
    },
    scheduledAt: {
      type: Date,
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

module.exports = mongoose.model('Assignment', assignmentSchema);
