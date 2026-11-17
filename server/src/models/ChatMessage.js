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

const chatMessageSchema = new mongoose.Schema(
  {
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatThread',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['student', 'teacher'],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    files: [fileAttachmentSchema],
    attachments: [fileAttachmentSchema],
    isDoubt: {
      type: Boolean,
      default: false,
      index: true,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
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

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
