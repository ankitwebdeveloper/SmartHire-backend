const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['applied', 'under_review', 'shortlisted', 'interview', 'selected', 'rejected'],
    default: 'applied',
  },
  resumeUrl: String,
  appliedDate: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

const Application = mongoose.model('Application', applicationSchema);
module.exports = Application;
