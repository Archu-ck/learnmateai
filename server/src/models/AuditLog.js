const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      index: true,
    },
    targetId: {
      type: String,
      default: null,
      index: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    schoolId: {
      type: String,
      required: true,
      default: 'school-default-01',
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
