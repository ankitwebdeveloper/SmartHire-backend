const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check if token exists in Headers under authorization: Bearer <token>
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header (split "Bearer" from the token string itself)
      token = req.headers.authorization.split(' ')[1];

      // Verify and decode token using the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by ID embedded in token, excluding the password field
      // We explicitly select the fields required for the subsequent role middlewares
      req.user = await User.findById(decoded.id).select('-password');

      next(); // Move to the actual guarded route
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        // Expected behavior for expired tokens; downgrade logging to avoid messy consoles
        console.log(`[AUTH] Token expired for a request. Sent 401.`);
      } else {
        console.error('Authorization Token Error:', error.message);
      }
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
