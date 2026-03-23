const express = require('express');
const router = express.Router();
const passport = require('passport');
const { registerUser, loginUser, googleAuthCallback, forgotPassword, resetPassword } = require('../controllers/authController');
const generateToken = require('../config/generateToken');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest, schemas } = require('../middleware/validationMiddleware');

// ----------------------------------------------------
// Standard Login and Registration Routes
// ----------------------------------------------------
router.post('/register', validateRequest(schemas.userRegistration), registerUser);
router.post('/login', loginUser);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:token', resetPassword);

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, (req, res) => {
  res.json(req.user);
});

// ----------------------------------------------------
// Google OAuth Authentication Routes
// ----------------------------------------------------

// @desc    Auth with Google
// @route   GET /api/auth/google
// @access  Public
router.get(
  '/google',
  (req, res, next) => {
    // Dynamically grab the ?state=employer query parameter from React and inject it into Passport's state
    const roleState = req.query.state || 'jobseeker'; // default to jobseeker
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      state: roleState 
    })(req, res, next);
  }
);

// @desc    Google auth callback
// @route   GET /api/auth/google/callback
// @access  Public
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL}/login`,
    session: false, // We aren't doing server-side sessions
  }),
  (req, res) => {
    // We arrive here if the Google Authentication was SUCCESSFUL.
    // req.user was set by our Passport callback strategy.

    // 1. Generate a JWT token for the user who just logged in via Google
    const token = generateToken(req.user._id);

    // 2. Redirect back to the React app with the token included in the URL so the frontend can catch it and log the user in locally.
    res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${token}`);
  }
);

module.exports = router;
