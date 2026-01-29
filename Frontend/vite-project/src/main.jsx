import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster, toast } from 'react-hot-toast'
import App from './App'
import './styles/globals.css'
import { requestNotificationPermission, onForegroundMessage } from './config/firebase'

// Initialize Firebase Cloud Messaging
const initializeFCM = async () => {
  try {
    // Register service worker for push notifications
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
      console.log('FCM Service Worker registered:', registration.scope)
    }

    // Request notification permission after a delay (better UX)
    setTimeout(async () => {
      const token = await requestNotificationPermission()
      if (token) {
        console.log('FCM Token obtained:', token.substring(0, 20) + '...')
        // Store token in localStorage for later use
        localStorage.setItem('fcmToken', token)
      }
    }, 5000) // Wait 5 seconds before asking for permission

    // Listen for foreground messages
    onForegroundMessage((payload) => {
      console.log('Foreground notification:', payload)
      toast(payload.notification?.body || 'New notification', {
        icon: '🔔',
        duration: 5000,
      })
    })
  } catch (error) {
    console.error('FCM initialization error:', error)
  }
}

// Initialize FCM when app loads
initializeFCM()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
      <Toaster
        position="top-right"
        containerStyle={{
          top: 20,
          right: 20,
        }}
        toastOptions={{
          // Shorter duration to prevent stacking
          duration: 2000,
          // Limit to only 1 visible toast
          style: {
            background: '#1f2937',
            color: '#fff',
            borderRadius: '10px',
            padding: '16px',
            maxWidth: '400px',
          },
          success: {
            duration: 2000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 3000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
          loading: {
            duration: Infinity,
          },
        }}
        // Only show 1 toast at a time
        gutter={8}
      />
    </HelmetProvider>
  </React.StrictMode>
)