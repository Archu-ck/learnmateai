const mongoose = require('mongoose');

const generatedQuestionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOption: { type: String, required: true }, // 'A', 'B', 'C', 'D'
    explanation: { type: String, required: true },
    topic: { type: String, default: '' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    marks: { type: Number, default: 1 },
  },
  { _id: true }
);

const generatedTestDraftSchema = new mongoose.Schema(
  {
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
    },
    params: {
      topicIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],
      topicNames: [String],
      questionCount: { type: Number, default: 10 },
      difficulty: { type: String, default: 'medium' },
      marksPerQuestion: { type: Number, default: 1 },
      extraInstructions: { type: String, default: '' },
      sourceText: { type: String, default: '' },
    },
    questions: [generatedQuestionSchema],
    status: {
      type: String,
      enum: ['draft', 'saved_to_bank', 'published'],
      default: 'draft',
      index: true,
    },
    publishedTestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      default: null,
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

module.exports = mongoose.model('GeneratedTestDraft', generatedTestDraftSchema);
