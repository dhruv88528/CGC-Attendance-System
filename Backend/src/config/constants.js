module.exports = {
  ROLES: {
    ADMIN: 'admin',
    TEACHER: 'teacher',
  },
  
  ATTENDANCE_STATUS: {
    PRESENT: 'present',
    ABSENT: 'absent',
    LATE: 'late',
    LEAVE: 'leave',
  },
  
  RECOGNITION_CONFIDENCE_THRESHOLD: 0.7,
  
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  
  REPORT_TYPES: {
    DAILY: 'daily',
    MONTHLY: 'monthly',
    STUDENT: 'student',
    GOVERNMENT: 'government',
  },
  
  SYNC_STATUS: {
    PENDING: 'pending',
    SYNCED: 'synced',
    FAILED: 'failed',
  },
};