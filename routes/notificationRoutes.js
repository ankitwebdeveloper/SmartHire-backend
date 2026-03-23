const express = require('express');
const router = express.Router();

const { 
  getNotifications, 
  markNotificationRead 
} = require('../controllers/notificationController');

const { protect } = require('../middleware/authMiddleware');

// Route group explicitly locking it to authenticated users (Both Employers/JobSeekers)
router.use(protect);

// @desc    Get paginated notifications
router.get('/', getNotifications);

// @desc    Mark notification as read
router.patch('/:id/read', markNotificationRead);

module.exports = router;
