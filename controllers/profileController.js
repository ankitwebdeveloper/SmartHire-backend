const UserProfile = require('../models/UserProfile');
const User = require('../models/User');

// @desc    Get current user profile
// @route   GET /api/profiles/me
// @access  Private
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    let profile = await UserProfile.findOne({ userId: req.user._id });

    if (!profile) {
      // Create empty profile if none exists
      profile = await UserProfile.create({
        userId: req.user._id,
        username: user.name,
      });
    }

    res.json({
      user,
      profile
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

// @desc    Update user profile and core user details
// @route   PUT /api/profiles/me
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { 
      name, 
      jobTitle, 
      bio, 
      location, 
      skills, 
      experience, 
      education, 
      socialLinks 
    } = req.body;

    // 1. Update Core User Model — only 'name' is allowed here.
    // Avatar updates must go through /api/upload/image and are not accepted here 
    // to prevent client-side URL injection (javascript: or phishing URLs as avatar).
    const userUpdates = {};
    if (name && typeof name === 'string' && name.trim().length >= 2) userUpdates.name = name.trim();

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(userId, userUpdates, { new: true, runValidators: true });
    }

    // 2. Update Profile Model (Everything else)
    let profile = await UserProfile.findOne({ userId });

    if (!profile) {
      profile = new UserProfile({ userId });
    }

    if (jobTitle !== undefined) profile.jobTitle = jobTitle;
    if (bio !== undefined) profile.bio = bio;
    if (location !== undefined) profile.location = location;
    if (skills !== undefined) profile.skills = skills;
    if (experience !== undefined) profile.experience = experience;
    if (education !== undefined) profile.education = education;
    if (socialLinks !== undefined) profile.socialLinks = socialLinks;

    await profile.save();

    // Fetch unified data to return
    const updatedUser = await User.findById(userId).select('-password');
    const updatedProfile = await UserProfile.findOne({ userId });

    res.json({
      user: updatedUser,
      profile: updatedProfile
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

module.exports = {
  getMyProfile,
  updateProfile
};
