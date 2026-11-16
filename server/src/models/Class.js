const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sections: {
      type: [String],
      default: ['A'],
    },
    academicYear: {
      type: String,
      default: '2026-2027',
      trim: true,
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

module.exports = mongoose.model('Class', classSchema);
