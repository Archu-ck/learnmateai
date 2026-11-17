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

const linkSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    url: { type: String, default: '' },
  },
  { _id: false }
);

const lessonSchema = new mongoose.Schema(
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
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },
    files: [fileAttachmentSchema],
    links: [linkSchema],
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published',
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    order: {
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

module.exports = mongoose.model('Lesson', lessonSchema);
