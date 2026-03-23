const express = require('express');
const router = express.Router();
const { 
  createJob, 
  getEmployerJobs, 
  getApprovedJobs, 
  getJobById,
  updateJob,
  deleteJob
} = require('../controllers/jobController');

const { protect } = require('../middleware/authMiddleware');
const { requireEmployer, checkBlockedStatus } = require('../middleware/roleMiddleware');
const { validateRequest, schemas } = require('../middleware/validationMiddleware');

// @route   POST /api/jobs
// @desc    Create a job listing
// @access  Private (Employer only, cannot be blocked)
router.post('/', protect, checkBlockedStatus, requireEmployer, validateRequest(schemas.jobCreation), createJob);

// @route   GET /api/jobs
// @desc    Get all public approved jobs
// @access  Public
router.get('/', getApprovedJobs);

// @route   GET /api/jobs/employer
// @desc    Get all jobs attached to current employer
// @access  Private (Employer)
// NOTE: Must be above /:id to prevent keyword collision
router.get('/employer', protect, requireEmployer, getEmployerJobs);

// @route   PUT /api/jobs/:id
// @desc    Update a job listing (resubmits for approval)
// @access  Private (Employer only)
router.put('/:id', protect, checkBlockedStatus, requireEmployer, validateRequest(schemas.jobUpdate), updateJob);

// @route   DELETE /api/jobs/:id
// @desc    Delete a job listing
// @access  Private (Employer only)
router.delete('/:id', protect, checkBlockedStatus, requireEmployer, deleteJob);

// @route   GET /api/jobs/:id
// @desc    Get specific job by ID
// @access  Public (pending variants restricted)
router.get('/:id', getJobById);

module.exports = router;
