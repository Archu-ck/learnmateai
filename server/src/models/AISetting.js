const mongoose = require('mongoose');

const aiSettingSchema = new mongoose.Schema(
  {
    schoolId: {
      type: String,
      required: true,
      unique: true,
      default: 'school-default-01',
      index: true,
    },
    dailyLimitPerStudent: {
      type: Number,
      default: 50,
    },
    dailyLimitPerTeacher: {
      type: Number,
      default: 150,
    },
    chatHoursEnabled: {
      type: Boolean,
      default: false,
    },
    chatStartTime: {
      type: String,
      default: '07:00', // e.g. 7 AM
    },
    chatEndTime: {
      type: String,
      default: '21:00', // e.g. 9 PM
    },
    profanityFilterEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AISetting', aiSettingSchema);
