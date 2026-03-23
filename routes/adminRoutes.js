const express = require('express');
const router = express.Router();
const { 
  getPendingJobs, 
  approveJob, 
  rejectJob,
  getAllUsers,
  blockUser,
  deleteUser,
  getAllPayments,
  resetUserPassword,
  getDashboardStats
} = require('../controllers/adminController');

const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// Apply Admin restriction strictly to all routes inside this router
router.use(protect, requireAdmin);

// @route   GET /api/admin/jobs/pending
// @desc    Get all pending jobs requiring review
router.get('/jobs/pending', getPendingJobs);

// @route   PATCH /api/admin/jobs/:id/approve
// @desc    Approve a pending job listing
router.patch('/jobs/:id/approve', approveJob);

// @route   PATCH /api/admin/jobs/:id/reject
// @desc    Reject a pending job listing
router.patch('/jobs/:id/reject', rejectJob);

// -----------------------------------------
// USER MANAGEMENT
// -----------------------------------------
router.get('/users', getAllUsers);
router.patch('/users/:id/block', blockUser);
router.patch('/users/:id/reset-password', resetUserPassword);
router.delete('/users/:id', deleteUser);

// -----------------------------------------
// PAYMENTS
// -----------------------------------------
router.get('/payments', getAllPayments);

// -----------------------------------------
// DASHBOARD STATS
// -----------------------------------------
router.get('/stats', getDashboardStats);

module.exports = router;
