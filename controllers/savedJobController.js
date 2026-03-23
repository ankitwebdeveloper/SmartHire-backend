const SavedJob = require('../models/SavedJob');
const Job = require('../models/Job');

// @desc    Save a job
// @route   POST /api/saved-jobs/:jobId
// @access  Private (JobSeeker)
const saveJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const userId = req.user._id;

    // Check if job exists
    const jobExists = await Job.findById(jobId);
    if (!jobExists) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Try to create the saved job. MongoDB schema unique index handles duplicate prevention
    try {
      const savedJob = await SavedJob.create({ userId, jobId });
      res.status(201).json({ success: true, message: 'Job saved successfully', data: savedJob });
    } catch (err) {
      // 11000 is the standard MongoDB duplicate key code
      if (err.code === 11000) {
        return res.status(409).json({ success: false, message: 'Job already saved' });
      }
      throw err; // Send other unexpected DB errors down to standard handler
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Unsave a job
// @route   DELETE /api/saved-jobs/:jobId
// @access  Private (JobSeeker)
const unsaveJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const userId = req.user._id;

    const deletedJob = await SavedJob.findOneAndDelete({ userId, jobId });

    if (!deletedJob) {
      return res.status(404).json({ success: false, message: 'Saved job not found or already removed' });
    }

    res.json({ success: true, message: 'Job removed from saved list' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all saved jobs for current user
// @route   GET /api/saved-jobs
// @access  Private (JobSeeker)
const getSavedJobs = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch and populate the actual job details
    const savedJobs = await SavedJob.find({ userId })
      .populate('jobId')
      .sort({ savedAt: -1 });

    // Filter out nulls in case a job was deleted globally but still referenced here
    const validSavedJobs = savedJobs.filter(save => save.jobId !== null);

    res.json({ success: true, count: validSavedJobs.length, data: validSavedJobs });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  saveJob,
  unsaveJob,
  getSavedJobs
};
