// API Endpoints
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1'
export const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000'

// Roles
export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher'
}

// Attendance Status
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused'
}

// Face Recognition Threshold
export const FACE_RECOGNITION_THRESHOLD = 0.6

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  OFFLINE_DATA: 'attendance_offline',
  SETTINGS: 'attendance_settings'
}

// Export Formats
export const EXPORT_FORMATS = {
  PDF: 'pdf',
  EXCEL: 'excel',
  CSV: 'csv'
}

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'dd MMM yyyy',
  API: 'yyyy-MM-dd',
  TIME: 'hh:mm a'
}

// School Types
export const SCHOOL_TYPES = [
  'Primary School',
  'Middle School',
  'High School',
  'Higher Secondary School'
]

// Classes (1-12)
export const CLASSES = Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`)

// Sections
export const SECTIONS = ['A', 'B', 'C', 'D', 'E']

// Genders
export const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
]

// Report Types
export const REPORT_TYPES = {
  DAILY: 'daily',
  MONTHLY: 'monthly',
  STUDENT: 'student',
  MIDDAY_MEAL: 'midday-meal',
  CUSTOM: 'custom'
}

// Camera Modes
export const CAMERA_MODES = {
  PHOTO: 'photo',
  VIDEO: 'video',
  SCAN: 'scan'
}

// Recognition Modes
export const RECOGNITION_MODES = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  HYBRID: 'hybrid'
}

// Toast Messages
export const TOAST_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful! Redirecting...',
  LOGOUT_SUCCESS: 'Logged out successfully',
  ATTENDANCE_MARKED: 'Attendance marked successfully',
  STUDENT_ADDED: 'Student added successfully',
  DATA_SAVED: 'Data saved successfully',
  SYNC_COMPLETE: 'Offline data synced successfully',
  ERROR_GENERIC: 'Something went wrong. Please try again.',
  ERROR_NETWORK: 'Network error. Please check your connection.',
  ERROR_UNAUTHORIZED: 'Session expired. Please login again.'
}

// Animation Durations
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500
}

// Breakpoints
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536
}

// Chart Colors
export const CHART_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Yellow
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#6366f1'  // Indigo
]

// Default Settings
export const DEFAULT_SETTINGS = {
  theme: 'light',
  recognitionMode: 'hybrid',
  cameraQuality: 'medium',
  autoSync: true,
  offlineStorage: true,
  notifications: true
}