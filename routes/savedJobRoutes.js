const express = require('express');
const router = express.Router();

const { 
  saveJob, 
  unsaveJob, 
  getSavedJobs 
} = require('../controllers/savedJobController');

const { protect } = require('../middleware/authMiddleware');
const { requireJobSeeker } = require('../middleware/roleMiddleware');

// Route group explicitly locking it to authenticated JobSeekers only
router.use(protect, requireJobSeeker);

// @desc    Get all saved jobs for current user
router.get('/', getSavedJobs);

// @desc    Save a job
router.post('/:jobId', saveJob);

// @desc    Unsave a job
router.delete('/:jobId', unsaveJob);

module.exports = router;
