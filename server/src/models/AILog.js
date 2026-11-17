const mongoose = require('mongoose');

const aiLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      default: null,
    },
    feature: {
      type: String,
      required: true,
      index: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    response: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    tokens: {
      promptTokens: { type: Number, default: 0 },
      candidatesTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
    },
    latencyMs: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['success', 'error', 'rate_limited'],
      default: 'success',
      index: true,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
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

module.exports = mongoose.model('AILog', aiLogSchema);
