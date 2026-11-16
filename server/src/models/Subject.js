const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    classIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
      },
    ],
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

module.exports = mongoose.model('Subject', subjectSchema);
