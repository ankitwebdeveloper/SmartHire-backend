const express = require('express');
const router = express.Router();
const { getMyProfile, updateProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

router.route('/me')
  .get(protect, getMyProfile)
  .put(protect, updateProfile);

module.exports = router;
