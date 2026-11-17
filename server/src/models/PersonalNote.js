const mongoose = require('mongoose');

const personalNoteSchema = new mongoose.Schema(
  {
    studentId: {
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
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      default: null,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      enum: ['ai', 'manual'],
      default: 'ai',
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

personalNoteSchema.index({ studentId: 1, subjectId: 1 });

module.exports = mongoose.model('PersonalNote', personalNoteSchema);
