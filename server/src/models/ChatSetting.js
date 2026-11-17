const mongoose = require('mongoose');

const chatSettingSchema = new mongoose.Schema(
  {
    schoolId: {
      type: String,
      required: true,
      unique: true,
      default: 'school-default-01',
    },
    chatHoursEnabled: {
      type: Boolean,
      default: true,
    },
    startHour: {
      type: Number, // 7 for 7 AM
      default: 7,
    },
    endHour: {
      type: Number, // 21 for 9 PM
      default: 21,
    },
    disabledClassIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ChatSetting', chatSettingSchema);
