/**
 * Notification Controller
 * Handles FCM token registration and notification management
 */

const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorMiddleware');
const {
    sendNotification,
    sendAttendanceNotification
} = require('../services/firebaseService');

/**
 * @desc    Register FCM token for a user
 * @route   POST /api/notifications/register-token
 * @access  Private
 */
const registerFCMToken = asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({
            success: false,
            message: 'FCM token is required'
        });
    }

    // Save token to user document
    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    // Add token if not already present
    if (!user.fcmTokens) {
        user.fcmTokens = [];
    }

    if (!user.fcmTokens.includes(token)) {
        user.fcmTokens.push(token);
        await user.save();
    }

    console.log(`📱 FCM token registered for user: ${user.name}`);

    res.status(200).json({
        success: true,
        message: 'FCM token registered successfully'
    });
});

/**
 * @desc    Remove FCM token
 * @route   DELETE /api/notifications/remove-token
 * @access  Private
 */
const removeFCMToken = asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({
            success: false,
            message: 'FCM token is required'
        });
    }

    const user = await User.findById(req.user.id);

    if (user && user.fcmTokens) {
        user.fcmTokens = user.fcmTokens.filter(t => t !== token);
        await user.save();
    }

    res.status(200).json({
        success: true,
        message: 'FCM token removed successfully'
    });
});

/**
 * @desc    Send test notification
 * @route   POST /api/notifications/test
 * @access  Private/Admin
 */
const sendTestNotification = asyncHandler(async (req, res) => {
    const { token, title, body } = req.body;

    if (!token) {
        return res.status(400).json({
            success: false,
            message: 'FCM token is required'
        });
    }

    const result = await sendNotification(
        token,
        title || 'Test Notification',
        body || 'This is a test notification from Smart Attendance System',
        { type: 'test' }
    );

    if (result.success) {
        res.status(200).json({
            success: true,
            message: 'Test notification sent successfully',
            messageId: result.messageId
        });
    } else {
        res.status(500).json({
            success: false,
            message: 'Failed to send notification',
            error: result.error
        });
    }
});

/**
 * @desc    Get notification settings
 * @route   GET /api/notifications/settings
 * @access  Private
 */
const getNotificationSettings = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('notificationSettings fcmTokens');

    res.status(200).json({
        success: true,
        data: {
            settings: user.notificationSettings || {
                attendanceAlerts: true,
                dailySummary: true,
                absentAlerts: true
            },
            tokensRegistered: user.fcmTokens?.length || 0
        }
    });
});

/**
 * @desc    Update notification settings
 * @route   PUT /api/notifications/settings
 * @access  Private
 */
const updateNotificationSettings = asyncHandler(async (req, res) => {
    const { attendanceAlerts, dailySummary, absentAlerts } = req.body;

    const user = await User.findById(req.user.id);

    if (!user.notificationSettings) {
        user.notificationSettings = {};
    }

    if (attendanceAlerts !== undefined) {
        user.notificationSettings.attendanceAlerts = attendanceAlerts;
    }
    if (dailySummary !== undefined) {
        user.notificationSettings.dailySummary = dailySummary;
    }
    if (absentAlerts !== undefined) {
        user.notificationSettings.absentAlerts = absentAlerts;
    }

    await user.save();

    res.status(200).json({
        success: true,
        message: 'Notification settings updated',
        data: user.notificationSettings
    });
});

/**
 * @desc    Send attendance notifications to parents
 * @route   POST /api/notifications/attendance
 * @access  Private/Teacher
 */
const sendAttendanceToParents = asyncHandler(async (req, res) => {
    const { classId, className, date, attendanceData } = req.body;

    if (!attendanceData || !Array.isArray(attendanceData)) {
        return res.status(400).json({
            success: false,
            message: 'Attendance data is required'
        });
    }

    // Import Student model to get parent phone numbers
    const Student = require('../models/Student');

    let sent = 0;
    let failed = 0;
    const results = [];

    // Process each student
    for (const studentData of attendanceData) {
        const { studentId, studentName, status } = studentData;

        try {
            // Fetch student from database to get parentPhone
            const student = await Student.findById(studentId);

            if (!student) {
                failed++;
                results.push({
                    studentName,
                    success: false,
                    error: 'Student not found'
                });
                continue;
            }

            const parentPhone = student.parentPhone;

            if (!parentPhone) {
                failed++;
                results.push({
                    studentName,
                    success: false,
                    error: 'No parent phone number'
                });
                continue;
            }

            // Format phone number (remove +91 or add if needed)
            let formattedPhone = parentPhone.replace(/\D/g, '');
            if (formattedPhone.length === 10) {
                formattedPhone = '91' + formattedPhone;
            }

            // Create WhatsApp message
            const statusEmoji = status === 'present' ? '✅' : '❌';
            const statusText = status === 'present' ? 'PRESENT' : 'ABSENT';
            const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

            const message = encodeURIComponent(
                `${statusEmoji} *Smart Attendance Alert*\n\n` +
                `Dear Parent,\n\n` +
                `Your child *${studentName}* was marked *${statusText}* today.\n\n` +
                `📚 Class: ${className}\n` +
                `📅 Date: ${date}\n` +
                `⏰ Time: ${time}\n\n` +
                `_This is an automated message from Smart Attendance System._`
            );

            // Store the WhatsApp link for the frontend to open
            results.push({
                studentName,
                phone: formattedPhone,
                status,
                whatsappLink: `https://wa.me/${formattedPhone}?text=${message}`,
                success: true
            });

            sent++;
        } catch (error) {
            console.error(`Failed to prepare notification for ${studentName}:`, error);
            failed++;
            results.push({
                studentName,
                success: false,
                error: error.message
            });
        }
    }

    console.log(`📱 Attendance notifications: ${sent} prepared, ${failed} failed`);

    res.status(200).json({
        success: true,
        message: `Notifications prepared for ${sent} parents`,
        data: {
            sent,
            failed,
            results
        }
    });
});

module.exports = {
    registerFCMToken,
    removeFCMToken,
    sendTestNotification,
    getNotificationSettings,
    updateNotificationSettings,
    sendAttendanceToParents
};