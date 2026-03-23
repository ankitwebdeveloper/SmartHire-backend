const Job = require('../models/Job');
const User = require('../models/User');
const Payment = require('../models/Payment');
const AdminLog = require('../models/AdminLog');
const bcrypt = require('bcryptjs');
const { createNotification } = require('./notificationController');

// @desc    Get all pending jobs requiring admin review
// @route   GET /api/admin/jobs/pending
// @access  Private (Admin)
const getPendingJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ approvalStatus: 'pending' }).sort({ createdAt: 1 });
    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a pending job listing
// @route   PATCH /api/admin/jobs/:id/approve
// @access  Private (Admin)
const approveJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    job.approvalStatus = 'approved';
    job.status = 'approved';
    job.approvedBy = req.user._id;
    await job.save();

    // Log action structurally
    await AdminLog.create({
      adminId: req.user._id,
      action: 'APPROVED_JOB',
      targetCollection: 'jobs',
      targetId: job._id
    });

    // Notify Employer
    await createNotification(
      job.employerId,
      'system',
      'Job Approved',
      `Your job listing "${job.jobTitle}" has been approved and is now live!`,
      job._id
    );

    res.json({ success: true, message: 'Job officially approved', data: job });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a pending job listing
// @route   PATCH /api/admin/jobs/:id/reject
// @access  Private (Admin)
const rejectJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    job.approvalStatus = 'rejected';
    job.status = 'rejected';
    // approvedBy shouldn't truly apply if rejected, but can leave blank.
    await job.save();

    // Log action structurally
    await AdminLog.create({
      adminId: req.user._id,
      action: 'REJECTED_JOB',
      targetCollection: 'jobs',
      targetId: job._id
    });

    // Notify Employer
    await createNotification(
      job.employerId,
      'system',
      'Job Rejected',
      `Your job listing "${job.jobTitle}" has been rejected.`,
      job._id
    );

    res.json({ success: true, message: 'Job rejected', data: job });
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------
// USER MANAGEMENT
// ----------------------------------------------------

// @desc    Get all users (paginated)
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;

    const query = {};
    if (role) query.role = role;

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limitNum);

    res.json({
      success: true,
      page: pageNum,
      totalPages: Math.ceil(totalUsers / limitNum),
      totalUsers,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Block or Unblock a user conditionally
// @route   PATCH /api/admin/users/:id/block
// @access  Private (Admin)
const blockUser = async (req, res, next) => {
  try {
    const { action } = req.body; // 'block' or 'unblock'
    const userToUpdate = await User.findById(req.params.id);

    if (!userToUpdate) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (userToUpdate.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot block another admin' });
    }
    // Prevent self-blocking
    if (req.user._id.toString() === req.params.id) {
      return res.status(403).json({ success: false, message: 'You cannot block your own account' });
    }

    if (action === 'block') {
      userToUpdate.accountStatus = 'blocked';
      // Default block to 30 days into future if blocked manually without explicit bound
      userToUpdate.blockUntil = new Date(Date.now() + 86400000 * 30); 
    } else if (action === 'unblock') {
      userToUpdate.accountStatus = 'active';
      userToUpdate.blockUntil = null;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action payload. Use block or unblock.' });
    }

    await userToUpdate.save();

    await AdminLog.create({
      adminId: req.user._id,
      action: action === 'block' ? 'BLOCKED_USER' : 'UNBLOCKED_USER',
      targetCollection: 'users',
      targetId: userToUpdate._id
    });

    res.json({ success: true, message: `User mathematically ${action}ed successfully`, data: userToUpdate });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user strictly (WARNING: Data destructive, orphans references usually avoided)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res, next) => {
  try {
    const userToUpdate = await User.findById(req.params.id);

    if (!userToUpdate) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (userToUpdate.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot delete another admin centrally' });
    }
    // Prevent admin from deleting their own account (would orphan all audit logs)
    if (req.user._id.toString() === req.params.id) {
      return res.status(403).json({ success: false, message: 'You cannot delete your own admin account' });
    }

    await User.findByIdAndDelete(req.params.id);

    await AdminLog.create({
      adminId: req.user._id,
      action: 'DELETED_USER',
      targetCollection: 'users',
      targetId: userToUpdate._id
    });

    res.json({ success: true, message: 'User permanently deleted' });
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------
// PAYMENTS MANAGEMENT
// ----------------------------------------------------

// @desc    Get all payments globally
// @route   GET /api/admin/payments
// @access  Private (Admin)
const getAllPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;

    const total = await Payment.countDocuments({});
    const payments = await Payment.find({})
      .populate({ path: 'employerId', select: 'name email' })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limitNum);

    res.json({
      success: true,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalPayments: total,
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Force reset a user's password (Admin only)
// @route   PATCH /api/admin/users/:id/reset-password
// @access  Private (Admin)
const resetUserPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }
    // Prevent admin resetting their own password via this admin endpoint
    if (req.user._id.toString() === req.params.id) {
      return res.status(403).json({ success: false, message: 'Use your profile settings to change your own password' });
    }
    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const salt = await bcrypt.genSalt(10);
    userToUpdate.password = await bcrypt.hash(newPassword, salt);
    // We call save with pre-save bypass since password is already hashed
    // To avoid double-hashing, mark as NOT modified so pre-save won't re-hash
    userToUpdate.$locals = { skipPreSave: true };
    await User.findByIdAndUpdate(req.params.id, { password: userToUpdate.password });

    await AdminLog.create({
      adminId: req.user._id,
      action: 'RESET_USER_PASSWORD',
      targetCollection: 'users',
      targetId: userToUpdate._id
    });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getDashboardStats = async (req, res, next) => {
  try {
    const [totalUsers, activeJobs, companies, pendingJobs, recentUsers] = await Promise.all([
      User.countDocuments({}),
      Job.countDocuments({ approvalStatus: 'approved', acceptApplications: true }),
      User.countDocuments({ role: 'employer' }),
      Job.countDocuments({ approvalStatus: 'pending' }),
      User.find({}).sort({ createdAt: -1 }).limit(6).select('name role createdAt avatar'),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeJobs,
        companies,
        pendingJobs,
        recentUsers,
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingJobs,
  approveJob,
  rejectJob,
  getAllUsers,
  blockUser,
  deleteUser,
  getAllPayments,
  resetUserPassword,
  getDashboardStats,
};
