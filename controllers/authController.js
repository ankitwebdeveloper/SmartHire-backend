const User = require('../models/User');
const generateToken = require('../config/generateToken');
const sendEmail = require('../utils/sendEmail');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate request
    if (!name || !email || !password) {
      console.log(`[REGISTER FAILED] Missing required fields. Email provided: ${email}`);
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      console.log(`[REGISTER FAILED] Attempted to create an account with an existing email: ${email}`);
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    console.log(`[REGISTER SUCCESS] Creating new account for ${email} with role ${role || 'jobseeker'}`);

    // Create new user (password is hashed in the Mongoose pre-save middleware)
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'jobseeker',
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        token: generateToken(user._id), // Send JWT to frontend
      });
    } else {
      console.log(`[REGISTER ERROR] DB failed to return user document for ${email}`);
      res.status(400).json({ message: 'Invalid user data received by database.' });
    }
  } catch (error) {
    console.error(`[REGISTER FATAL ERROR] ${error.message}`);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate request
    if (!email || !password) {
      console.log(`[LOGIN FAILED] Empty email or password submitted.`);
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`[LOGIN FAILED] Account not found for email: ${email}`);
      return res.status(404).json({ message: 'Account not found. Please register first.' });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      console.log(`[LOGIN FAILED] Wrong password provided for email: ${email}`);
      return res.status(401).json({ message: 'Wrong password. Please try again.' });
    }

    // Check if user exists AND if the password matches the hash
    if (user && isMatch) {
      console.log(`[LOGIN SUCCESS] Authenticated ${user.role} account for: ${email}`);
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        token: generateToken(user._id), // Send JWT to frontend
      });
    }
  } catch (error) {
    console.error(`[LOGIN FATAL ERROR] ${error.message}`);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({ message: 'There is no user with that email' });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset url
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please go to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'SmartHire Password Reset Request',
        message: message,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>Password Reset</h2>
            <p>You requested a password reset. Please click the button below to reset your password:</p>
            <br>
            <a href="${resetUrl}" style="padding: 12px 20px; background-color: #2563EB; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
            <br><br>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${resetUrl}</p>
            <p style="color: #666; font-size: 12px; mt-4">If you did not request this, please ignore this email.</p>
          </div>
        `
      });

      console.log(`[FORGOT PASSWORD] Reset email successfully dispatched to ${user.email}.`);

      res.status(200).json({
        success: true,
        message: 'Password reset link sent to email! Please check your inbox.',
      });
    } catch (err) {
      console.error(`[SEND EMAIL ERROR] ${err}`);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ message: 'Email could not be sent. Please check SMTP configuration.' });
    }
  } catch (error) {
    console.error(`[FORGOT PASSWORD ERROR] ${error.message}`);
    // Revert changes if error
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(500).json({ message: 'Email could not be sent' });
  }
};

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const crypto = require('crypto');
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid token or token has expired' });
    }

    if (!req.body.password || req.body.password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error(`[RESET PASSWORD ERROR] ${error.message}`);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
};
