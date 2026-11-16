const mongoose = require('mongoose');

const rolePermissionSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      unique: true,
      enum: ['admin', 'principal', 'coordinator', 'teacher', 'counsellor', 'student', 'parent'],
      index: true,
    },
    permissions: {
      type: [String],
      default: [],
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

module.exports = mongoose.model('RolePermission', rolePermissionSchema);
