const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const UserProfile = require('../models/UserProfile');
const EmployerProfile = require('../models/EmployerProfile');

// @desc    Upload generic resume explicitly mapping to user Profile
// @route   POST /api/upload/resume
// @access  Private
router.post('/resume', protect, upload.single('resume'), async (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file explicitly uploaded' });
    }

    try {
      // Normalize path to use forward slashes for URLs, regardless of OS
      const fileUrl = `/${req.file.path.replace(/\\/g, '/')}`;

      // Automatically attach to UserProfile if JobSeeker
      if (req.user.role === 'jobseeker') {
         let profile = await UserProfile.findOne({ userId: req.user._id });
         if (!profile) profile = new UserProfile({ userId: req.user._id });
         profile.resume = fileUrl;
         await profile.save();
      }

      res.status(201).json({ success: true, message: 'Resume uploaded gracefully', data: fileUrl });
    } catch (dbErr) {
      next(dbErr);
    }
});

// @desc    Upload generic image (avatar / logo)
// @route   POST /api/upload/image
// @access  Private
router.post('/image', protect, upload.single('image'), (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileUrl = `/${req.file.path.replace(/\\/g, '/')}`;
    res.status(201).json({ success: true, message: 'Image uploaded gracefully', data: fileUrl });
});

module.exports = router;
