const express = require('express');
const router = express.Router();

const { 
  applyToJob, 
  getMyApplications, 
  getJobApplications, 
  updateApplicationStatus,
  getEmployerApplications
} = require('../controllers/applicationController');

const { protect } = require('../middleware/authMiddleware');
const { requireJobSeeker, requireEmployer, checkBlockedStatus } = require('../middleware/roleMiddleware');

// ----------------------------------------------------
// JOBSEEKER ROUTES
// ----------------------------------------------------
// @desc    Get all applications made by the current jobseeker
// @access  Private (JobSeeker)
router.get('/me', protect, requireJobSeeker, getMyApplications);

// @desc    Apply to a specific job
// @access  Private (JobSeeker, Block Check strictly enforced to prevent malicious spam)
router.post('/:jobId', protect, checkBlockedStatus, requireJobSeeker, applyToJob);

// ----------------------------------------------------
// EMPLOYER ROUTES
// ----------------------------------------------------
// @desc    Get all candidates/applications for employer's jobs
// @access  Private (Employer)
router.get('/employer', protect, requireEmployer, getEmployerApplications);

// @desc    Get all candidates/applications for a specific job
// @access  Private (Employer)
router.get('/job/:jobId', protect, requireEmployer, getJobApplications);

// @desc    Employer updates specific candidate pipeline status
// @access  Private (Employer)
router.patch('/:id/status', protect, requireEmployer, updateApplicationStatus);

module.exports = router;
