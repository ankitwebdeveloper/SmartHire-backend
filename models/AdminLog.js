const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true, // e.g., "APPROVED_JOB", "BLOCKED_USER"
  },
  targetCollection: {
    type: String, // e.g., "users", "jobs"
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

const AdminLog = mongoose.model('AdminLog', adminLogSchema);
module.exports = AdminLog;
