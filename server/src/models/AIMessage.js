const mongoose = require('mongoose');

const aiMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AIConversation',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'model', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    thumbsUp: {
      type: Boolean,
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

aiMessageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('AIMessage', aiMessageSchema);
