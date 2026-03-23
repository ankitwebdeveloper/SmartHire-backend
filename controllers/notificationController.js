const Notification = require('../models/Notification');

// @desc    Helper function to generate a notification internally
// @access  Internal Backend System Only
const createNotification = async (userId, type, title, message, relatedJobId = null) => {
  try {
    await Notification.create({
      userId,
      type,
      title,
      message,
      relatedJobId
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

// @desc    Get all notifications for logged in user (JobSeeker or Employer)
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;

    const query = { userId: req.user._id };

    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limitNum);

    res.json({
      success: true,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      total,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a specific notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, userId: req.user._id });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found or unauthorized' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ success: true, message: 'Notification marked as read', data: notification });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNotification,
  getNotifications,
  markNotificationRead
};
