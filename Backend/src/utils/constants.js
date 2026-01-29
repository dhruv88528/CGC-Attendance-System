/**
 * Application-wide constants
 */

module.exports = {
  // User roles
  ROLES: {
    ADMIN: 'admin',
    TEACHER: 'teacher',
    STUDENT: 'student'
  },

  // Attendance statuses
  ATTENDANCE_STATUS: {
    PRESENT: 'present',
    ABSENT: 'absent',
    LATE: 'late',
    LEAVE: 'leave'
  },

  // Gender options
  GENDER: {
    MALE: 'Male',
    FEMALE: 'Female',
    OTHER: 'Other'
  },

  // Recognition confidence threshold
  RECOGNITION_CONFIDENCE_THRESHOLD: 0.7,

  // File upload limits
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],

  // Report types
  REPORT_TYPES: {
    DAILY: 'daily',
    MONTHLY: 'monthly',
    STUDENT: 'student',
    CLASS: 'class',
    SCHOOL: 'school'
  },

  // Sync statuses for offline mode
  SYNC_STATUS: {
    PENDING: 'pending',
    SYNCED: 'synced',
    FAILED: 'failed'
  },

  // Default pagination values
  PAGINATION: {
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
  },

  // Cache TTL (in seconds)
  CACHE_TTL: {
    SHORT: 300,      // 5 minutes
    MEDIUM: 1800,    // 30 minutes
    LONG: 86400      // 24 hours
  }
};