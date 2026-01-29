// Firebase Configuration for Smart Attendance System
// These are the actual Firebase project keys

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase configuration from Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyAcW7h3xkr-UXqAnhCfuOGROjZiLj3537U",
    authDomain: "smart-attendance-system-68e4d.firebaseapp.com",
    projectId: "smart-attendance-system-68e4d",
    storageBucket: "smart-attendance-system-68e4d.firebasestorage.app",
    messagingSenderId: "320520197852",
    appId: "1:320520197852:web:6786f3775cd78cd5e94619",
    measurementId: "G-T8T0TGZ522"
};

// VAPID Key for Push Notifications (from Firebase Cloud Messaging)
const VAPID_KEY = "BDpC0oOxl6Lgez-Gd9TNo3n4SNZTv2zPeUsQWuueNzUidzk_XycMhO0Hv61Duds6cr10782wjh9R4IjTzOm48pg";

// Initialize Firebase
let app;
let messaging;

try {
    app = initializeApp(firebaseConfig);

    // Initialize Firebase Cloud Messaging (only in browser with notification support)
    if (typeof window !== 'undefined' && 'Notification' in window) {
        messaging = getMessaging(app);
    }
} catch (error) {
    console.error('Firebase initialization error:', error);
}

/**
 * Request notification permission and get FCM token
 * @returns {Promise<string|null>} FCM token or null if failed
 */
export const requestNotificationPermission = async () => {
    try {
        // Check if notifications are supported
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return null;
        }

        // Request permission
        const permission = await Notification.requestPermission();

        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return null;
        }

        // Get FCM token
        if (messaging) {
            const token = await getToken(messaging, {
                vapidKey: VAPID_KEY
            });

            console.log('FCM Token:', token);
            return token;
        }

        return null;
    } catch (error) {
        console.error('Error getting notification permission:', error);
        return null;
    }
};

/**
 * Listen for foreground messages
 * @param {Function} callback - Function to call when message is received
 */
export const onForegroundMessage = (callback) => {
    if (messaging) {
        onMessage(messaging, (payload) => {
            console.log('Foreground message received:', payload);
            callback(payload);
        });
    }
};

/**
 * Show a notification
 * @param {string} title - Notification title
 * @param {object} options - Notification options
 */
export const showNotification = (title, options = {}) => {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            icon: '/icons/icon.svg',
            badge: '/icons/icon.svg',
            vibrate: [100, 50, 100],
            ...options
        });
    }
};

export { app, messaging };
export default app;