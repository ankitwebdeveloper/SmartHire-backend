const mongoose = require('mongoose');

const employerSubscriptionSchema = new mongoose.Schema({
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  planType: {
    type: String,
    enum: ['basic', 'premium', 'platinum'],
    required: true,
  },
  jobPostLimitPerMonth: {
    type: Number,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

const EmployerSubscription = mongoose.model('EmployerSubscription', employerSubscriptionSchema);
module.exports = EmployerSubscription;
