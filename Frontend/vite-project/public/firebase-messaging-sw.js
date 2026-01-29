// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyAcW7h3xkr-UXqAnhCfuOGROjZiLj3537U",
    authDomain: "smart-attendance-system-68e4d.firebaseapp.com",
    projectId: "smart-attendance-system-68e4d",
    storageBucket: "smart-attendance-system-68e4d.firebasestorage.app",
    messagingSenderId: "320520197852",
    appId: "1:320520197852:web:6786f3775cd78cd5e94619",
    measurementId: "G-T8T0TGZ522"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/vite.svg'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
