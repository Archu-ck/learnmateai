const mongoose = require('mongoose');

const masteryRecordSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    level: {
      type: String,
      enum: ['not_started', 'learning', 'developing', 'proficient', 'mastered'],
      default: 'not_started',
    },
    scorePercentage: {
      type: Number,
      default: 0,
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

masteryRecordSchema.index({ studentId: 1, topicId: 1 }, { unique: true });

module.exports = mongoose.model('MasteryRecord', masteryRecordSchema);
