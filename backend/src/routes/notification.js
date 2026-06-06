const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const { validateCreateNotification } = require('../validators/notificationValidator');
const {
  createNotification,
  getAllNotifications,
  deleteNotification,
} = require('../controllers/notificationController');

const router = express.Router();

// Add a new notification (admin only)
router.post('/', auth, adminOnly, validateCreateNotification, createNotification);

// Get notifications (authenticated)
router.get('/', auth, getAllNotifications);

// Delete a notification (admin only)
router.delete('/:id', auth, adminOnly, deleteNotification);

module.exports = router; 