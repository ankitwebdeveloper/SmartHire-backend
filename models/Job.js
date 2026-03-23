const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  jobTitle: {
    type: String,
    required: true,
    index: true,
  },
  companyName: String,
  companyLogo: String,
  location: {
    type: String,
    index: true,
  },
  salaryMin: Number,
  salaryMax: Number,
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'internship', 'contract', 'remote'],
    required: true,
  },
  category: {
    type: String,
    enum: ['IT', 'Marketing', 'Finance', 'Design', 'Engineering', 'Other'],
    default: 'Other',
    index: true,
  },
  experienceLevel: {
    type: String,
    enum: ['fresher', '1-3 years', '3-5 years', '5+ years'],
    index: true,
  },
  jobDescription: {
    type: String,
    required: true,
  },
  responsibilities: [String],
  requiredSkills: [String],
  benefits: [String],
  applicationDeadline: Date,
  isDemo: {
    type: Boolean,
    default: false,
  },
  acceptApplications: {
    type: Boolean,
    default: true,
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending' // Admin must review
  },
  // Alias used by frontend dashboard & API contract
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
}, { timestamps: true });

// Pre-save middleware to enforce Demo logic
jobSchema.pre('save', function() {
  if (this.isDemo) {
    this.acceptApplications = false;
  }

  // Keep status & approvalStatus in sync
  // Prefer approvalStatus as the canonical backend field (admin workflows already use it)
  if (!this.approvalStatus && this.status) {
    this.approvalStatus = this.status;
  } else if (this.approvalStatus && (!this.status || this.status !== this.approvalStatus)) {
    this.status = this.approvalStatus;
  }
});

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;
