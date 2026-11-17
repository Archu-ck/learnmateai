const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      index: true,
    },
    section: {
      type: String,
      required: true,
    },
    date: {
      type: String, // Format YYYY-MM-DD
      required: true,
      index: true,
    },
    period: {
      type: Number,
      default: 0, // 0 means daily attendance, 1-8 means specific period
    },
    records: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        status: {
          type: String,
          enum: ['present', 'absent', 'late', 'leave'],
          default: 'present',
        },
        remarks: {
          type: String,
          default: '',
        },
      },
    ],
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

attendanceSchema.index({ classId: 1, section: 1, date: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
