const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['admin', 'principal', 'coordinator', 'teacher', 'counsellor', 'student', 'parent'],
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active',
      index: true,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    schoolId: {
      type: String,
      required: true,
      default: 'school-default-01',
      index: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    // Student extras
    admissionNo: {
      type: String,
      trim: true,
      sparse: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null,
    },
    sectionId: {
      type: String,
      trim: true,
      default: null,
    },
    // Parent extras
    childIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
