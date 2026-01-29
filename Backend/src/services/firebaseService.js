/**
 * Firebase Cloud Messaging Service
 * Handles sending push notifications to parents/users
 */

const admin = require('firebase-admin');

// Check if Firebase is already initialized
let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK
 * Call this once during server startup
 */
const initializeFirebase = () => {
    if (firebaseInitialized) {
        console.log('Firebase already initialized');
        return;
    }

    try {
        // Check if service account credentials are provided
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

        if (serviceAccount) {
            // Parse the JSON string from environment variable
            const credentials = JSON.parse(serviceAccount);

            admin.initializeApp({
                credential: admin.credential.cert(credentials)
            });

            console.log('✅ Firebase Admin initialized with service account');
        } else if (process.env.FIREBASE_PROJECT_ID) {
            // Use application default credentials (for cloud deployment)
            admin.initializeApp({
                projectId: process.env.FIREBASE_PROJECT_ID
            });

            console.log('✅ Firebase Admin initialized with project ID');
        } else {
            console.log('⚠️ Firebase not configured - notifications disabled');
            return;
        }

        firebaseInitialized = true;
    } catch (error) {
        console.error('❌ Firebase initialization error:', error.message);
    }
};

/**
 * Send push notification to a single device
 * @param {string} token - FCM device token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data payload
 */
const sendNotification = async (token, title, body, data = {}) => {
    if (!firebaseInitialized) {
        console.log('Firebase not initialized, skipping notification');
        return { success: false, error: 'Firebase not initialized' };
    }

    try {
        const message = {
            token,
            notification: {
                title,
                body
            },
            data: {
                ...data,
                timestamp: new Date().toISOString()
            },
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    clickAction: 'FLUTTER_NOTIFICATION_CLICK'
                }
            },
            webpush: {
                notification: {
                    icon: '/icons/icon.svg',
                    badge: '/icons/icon.svg',
                    vibrate: [100, 50, 100]
                },
                fcmOptions: {
                    link: data.url || '/'
                }
            }
        };

        const response = await admin.messaging().send(message);
        console.log('✅ Notification sent:', response);

        return { success: true, messageId: response };
    } catch (error) {
        console.error('❌ Notification error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Send notification to multiple devices
 * @param {string[]} tokens - Array of FCM tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data payload
 */
const sendMultipleNotifications = async (tokens, title, body, data = {}) => {
    if (!firebaseInitialized) {
        console.log('Firebase not initialized, skipping notifications');
        return { success: false, error: 'Firebase not initialized' };
    }

    if (!tokens || tokens.length === 0) {
        return { success: false, error: 'No tokens provided' };
    }

    try {
        const message = {
            notification: {
                title,
                body
            },
            data: {
                ...data,
                timestamp: new Date().toISOString()
            },
            tokens
        };

        const response = await admin.messaging().sendEachForMulticast(message);

        console.log(`✅ Sent ${response.successCount}/${tokens.length} notifications`);

        return {
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount,
            responses: response.responses
        };
    } catch (error) {
        console.error('❌ Multi-notification error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Send attendance notification to parent
 * @param {string} parentToken - Parent's FCM token
 * @param {object} attendanceData - Attendance details
 */
const sendAttendanceNotification = async (parentToken, attendanceData) => {
    const { studentName, status, className, time, date } = attendanceData;

    const isPresent = status === 'present';
    const emoji = isPresent ? '✅' : '❌';
    const statusText = isPresent ? 'marked present' : 'marked absent';

    const title = `${emoji} Attendance Update`;
    const body = `${studentName} was ${statusText} in ${className} at ${time}`;

    const data = {
        type: 'attendance',
        studentName,
        status,
        className,
        time,
        date,
        url: '/attendance'
    };

    return sendNotification(parentToken, title, body, data);
};

/**
 * Send bulk attendance notifications to all parents
 * @param {Array} attendanceRecords - Array of attendance records with parent tokens
 */
const sendBulkAttendanceNotifications = async (attendanceRecords) => {
    const results = {
        sent: 0,
        failed: 0,
        errors: []
    };

    for (const record of attendanceRecords) {
        if (!record.parentToken) continue;

        try {
            const result = await sendAttendanceNotification(record.parentToken, {
                studentName: record.studentName,
                status: record.status,
                className: record.className,
                time: record.time,
                date: record.date
            });

            if (result.success) {
                results.sent++;
            } else {
                results.failed++;
                results.errors.push({ student: record.studentName, error: result.error });
            }
        } catch (error) {
            results.failed++;
            results.errors.push({ student: record.studentName, error: error.message });
        }
    }

    console.log(`📱 Attendance notifications: ${results.sent} sent, ${results.failed} failed`);
    return results;
};

/**
 * Send daily summary notification to admin
 * @param {string} adminToken - Admin's FCM token
 * @param {object} summary - Daily attendance summary
 */
const sendDailySummaryNotification = async (adminToken, summary) => {
    const { totalStudents, present, absent, date } = summary;
    const attendanceRate = Math.round((present / totalStudents) * 100);

    const title = `📊 Daily Attendance Report - ${date}`;
    const body = `${present}/${totalStudents} students present (${attendanceRate}%). ${absent} absent.`;

    const data = {
        type: 'daily_summary',
        totalStudents: String(totalStudents),
        present: String(present),
        absent: String(absent),
        date,
        url: '/reports'
    };

    return sendNotification(adminToken, title, body, data);
};

module.exports = {
    initializeFirebase,
    sendNotification,
    sendMultipleNotifications,
    sendAttendanceNotification,
    sendBulkAttendanceNotifications,
    sendDailySummaryNotification
};