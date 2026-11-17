const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
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
    type: {
      type: String,
      enum: ['mcq', 'true_false', 'short_answer', 'long_answer'],
      required: true,
      default: 'mcq',
    },
    text: {
      type: String,
      required: true,
    },
    options: [
      {
        type: String,
      },
    ],
    answer: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
      default: '',
    },
    marks: {
      type: Number,
      default: 1,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
      index: true,
    },
    tags: [
      {
        type: String,
      },
    ],
    source: {
      type: String,
      enum: ['manual', 'ai'],
      default: 'manual',
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

module.exports = mongoose.model('Question', questionSchema);
