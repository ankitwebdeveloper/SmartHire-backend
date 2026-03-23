const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  username: String,
  jobTitle: String,
  bio: String,
  location: String,
  skills: [String],
  experience: [
    {
      company: String,
      position: String,
      startDate: Date,
      endDate: Date,
      description: String
    }
  ],
  education: [
    {
      institution: String,
      degree: String,
      field: String,
      startYear: Number,
      endYear: Number
    }
  ],
  resumeUrl: String,
  socialLinks: {
    linkedin: String,
    github: String,
    portfolio: String
  },
  profileCompletion: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const UserProfile = mongoose.model('UserProfile', userProfileSchema);
module.exports = UserProfile;
