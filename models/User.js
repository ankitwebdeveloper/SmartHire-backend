const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      unique: true,
      required: true,
      // Provide a fast default UUID generator if missing
      default: () => new mongoose.Types.ObjectId().toHexString(), 
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      required: false, // Optional for OAuth
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['admin', 'employer', 'jobseeker'],
      default: 'jobseeker',
    },
    authProvider: {
      type: String,
      enum: ['email', 'google'],
      default: 'email',
    },
    planName: {
      type: String,
      default: null,
    },
    totalJobCredits: {
      type: Number,
      default: 0,
    },
    remainingJobCredits: {
      type: Number,
      default: 0,
    },
    accountStatus: {
      type: String,
      enum: ['active', 'blocked'],
      default: 'active',
    },
    blockUntil: {
      type: Date,
      default: null,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Middleware to hash the password before saving
userSchema.pre('save', async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return;
  }

  // Only hash if there is a password (e.g., standard login, not OAuth)
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Method to compare entered password to hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate and hash password token
userSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
