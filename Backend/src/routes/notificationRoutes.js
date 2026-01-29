/**
 * Notification Routes
 * FCM token management and notification settings
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    registerFCMToken,
    removeFCMToken,
    sendTestNotification,
    getNotificationSettings,
    updateNotificationSettings,
    sendAttendanceToParents
} = require('../controllers/notificationController');

// All routes require authentication
router.use(protect);

// FCM Token management
router.post('/register-token', registerFCMToken);
router.delete('/remove-token', removeFCMToken);

// Notification settings
router.get('/settings', getNotificationSettings);
router.put('/settings', updateNotificationSettings);

// Send attendance notifications to parents (teacher only)
router.post('/attendance', authorize('teacher', 'admin'), sendAttendanceToParents);

// Test notification (admin only)
router.post('/test', authorize('admin'), sendTestNotification);

module.exports = router;