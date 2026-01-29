import { STORAGE_KEYS } from '../constants'

// Initialize offline storage
export const initOfflineStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.OFFLINE_DATA)) {
    localStorage.setItem(STORAGE_KEYS.OFFLINE_DATA, JSON.stringify([]))
  }

  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
      offlineMode: true,
      autoSync: true,
      syncInterval: 300000, // 5 minutes
      lastSync: null
    }))
  }
}

// Store data offline
export const storeOffline = (key, data) => {
  try {
    const offlineData = JSON.parse(localStorage.getItem(key) || '{}')
    offlineData[Date.now()] = data
    localStorage.setItem(key, JSON.stringify(offlineData))
    return true
  } catch (error) {
    console.error('Failed to store offline data:', error)
    return false
  }
}

// Retrieve offline data
export const getOfflineData = (key) => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : {}
  } catch (error) {
    console.error('Failed to retrieve offline data:', error)
    return {}
  }
}

// Queue API request for offline processing
export const queueRequest = (method, endpoint, data) => {
  const queue = JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_DATA) || '[]')

  const request = {
    id: generateRequestId(),
    method,
    endpoint,
    data,
    timestamp: Date.now(),
    attempts: 0,
    status: 'pending'
  }

  queue.push(request)
  localStorage.setItem(STORAGE_KEYS.OFFLINE_DATA, JSON.stringify(queue))

  return request.id
}

// Process queued requests
export const processQueue = async (api) => {
  const queue = JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_DATA) || '[]')
  const pending = queue.filter(req => req.status === 'pending')

  const results = {
    success: 0,
    failed: 0,
    errors: []
  }

  for (const request of pending) {
    try {
      // Prevent infinite retries
      if (request.attempts >= 3) {
        request.status = 'failed'
        results.failed++
        continue
      }

      // Execute the request
      const response = await api({
        method: request.method,
        url: request.endpoint,
        data: request.data
      })

      request.status = 'completed'
      request.completedAt = Date.now()
      request.response = response
      results.success++

    } catch (error) {
      request.attempts++
      request.lastError = error.message
      results.failed++
      results.errors.push({
        requestId: request.id,
        error: error.message
      })
    }
  }

  // Update queue
  const updatedQueue = queue.filter(req => req.status === 'pending')
  localStorage.setItem(STORAGE_KEYS.OFFLINE_DATA, JSON.stringify(updatedQueue))

  // Update sync settings
  const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}')
  settings.lastSync = Date.now()
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))

  return results
}

// Store attendance data offline - simpler format
export const storeAttendanceOffline = (attendanceData) => {
  try {
    const key = `attendance_record_${Date.now()}`
    // Store the data directly, not nested
    localStorage.setItem(key, JSON.stringify(attendanceData))
    console.log('[Offline] Saved attendance to:', key)
    return true
  } catch (error) {
    console.error('Failed to store offline attendance:', error)
    return false
  }
}

// Store student data offline
export const storeStudentOffline = (studentData) => {
  const key = `student_${Date.now()}`
  return storeOffline(key, studentData)
}

// Check if data should be stored offline
export const shouldStoreOffline = () => {
  const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}')
  return settings.offlineMode === true
}

// Get offline storage stats
export const getStorageStats = () => {
  let totalSize = 0
  let itemCount = 0

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key.startsWith('attendance_') || key.startsWith('student_') || key === STORAGE_KEYS.OFFLINE_DATA) {
      const value = localStorage.getItem(key)
      totalSize += new Blob([value]).size
      itemCount++
    }
  }

  return {
    totalSize,
    itemCount,
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
  }
}

// Clear old offline data
export const cleanupOldData = (maxAgeDays = 7) => {
  const maxAge = maxAgeDays * 24 * 60 * 60 * 1000
  const now = Date.now()

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)

    if (key.startsWith('attendance_') || key.startsWith('student_')) {
      try {
        const timestamp = parseInt(key.split('_')[1])
        if (now - timestamp > maxAge) {
          localStorage.removeItem(key)
        }
      } catch (error) {
        // Ignore keys that don't match the pattern
      }
    }
  }

  // Clean up completed requests from queue
  const queue = JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_DATA) || '[]')
  const activeQueue = queue.filter(req => {
    if (req.status === 'completed') {
      return now - req.completedAt < maxAge
    }
    return true
  })

  localStorage.setItem(STORAGE_KEYS.OFFLINE_DATA, JSON.stringify(activeQueue))
}

// Generate unique request ID
const generateRequestId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Get all pending offline attendance records
export const getPendingAttendance = () => {
  const pendingRecords = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)

    // Only match attendance_record_ keys (not attendance_settings, attendance_offline, etc.)
    if (key && key.startsWith('attendance_record_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key))

        // Data should have classId and attendanceData at root level
        if (data && data.classId && data.attendanceData) {
          pendingRecords.push({
            key,
            timestamp: key.split('_')[2], // Extract timestamp from key
            data: data
          })
        } else {
          console.warn('[Offline] Invalid record format, removing:', key)
          localStorage.removeItem(key)
        }
      } catch (e) {
        console.error('Error reading offline attendance:', e)
        localStorage.removeItem(key) // Remove corrupted data
      }
    }
  }

  console.log('[Offline] Found pending records:', pendingRecords.length)
  return pendingRecords
}

// Sync all offline attendance to server
export const syncOfflineAttendance = async (apiMethods) => {
  const pendingRecords = getPendingAttendance()

  if (pendingRecords.length === 0) {
    return { success: true, synced: 0, message: 'No offline data to sync' }
  }

  const results = {
    success: true,
    synced: 0,
    failed: 0,
    errors: []
  }

  for (const record of pendingRecords) {
    try {
      const attendanceData = record.data

      // Skip if data is malformed
      if (!attendanceData || !attendanceData.attendanceData) {
        console.warn('Skipping malformed offline record:', record.key)
        localStorage.removeItem(record.key)
        continue
      }

      // Prepare data for API
      const payload = {
        classId: attendanceData.classId,
        date: attendanceData.date,
        mode: 'offline_sync',
        attendanceData: attendanceData.attendanceData.map(s => ({
          studentId: s.studentId,
          status: s.status,
          confidenceScore: s.confidenceScore || 0
        }))
      }

      // Try to sync with server
      const response = await apiMethods.markAttendance(payload)

      // Response comes from axios interceptor which returns response.data
      // Backend returns { success: true, message: "...", data: { success: N, failed: M } }
      if (response && response.success) {
        // Remove from localStorage after successful sync
        localStorage.removeItem(record.key)

        // Count based on backend response data
        const backendData = response.data || {}
        results.synced += backendData.success || 1
        results.failed += backendData.failed || 0
      } else {
        // Request completed but marked as failed
        results.failed++
        results.errors.push({
          record: record.key,
          error: response?.message || 'Sync failed'
        })
        // Still remove the record to avoid infinite retries
        localStorage.removeItem(record.key)
      }
    } catch (error) {
      results.failed++
      results.errors.push({
        record: record.key,
        error: error.message || 'Network error'
      })
      // Keep record for retry if it's a network error
      console.error('Sync error for record:', record.key, error)
    }
  }

  results.success = results.failed === 0

  // Update last sync time
  const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}')
  settings.lastSync = Date.now()
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))

  return results
}

// Get offline attendance count
export const getOfflineAttendanceCount = () => {
  let count = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('attendance_record_')) {
      count++
    }
  }
  return count
}

// ========== OFFLINE CACHE FOR CLASSES & STUDENTS ==========

// Cache classes for offline use
export const cacheClassesOffline = (classes) => {
  try {
    localStorage.setItem('offline_classes_cache', JSON.stringify({
      data: classes,
      timestamp: Date.now()
    }))
    console.log('[Offline] Cached', classes.length, 'classes')
    return true
  } catch (error) {
    console.error('Failed to cache classes:', error)
    return false
  }
}

// Get cached classes for offline
export const getCachedClasses = () => {
  try {
    const cached = localStorage.getItem('offline_classes_cache')
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      // Cache valid for 7 days
      if (Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000) {
        console.log('[Offline] Using cached classes:', data.length)
        return data
      }
    }
    return []
  } catch (error) {
    console.error('Failed to get cached classes:', error)
    return []
  }
}

// Cache students for a specific class for offline use
export const cacheStudentsOffline = (classId, students) => {
  try {
    // Get existing cache
    const cacheKey = 'offline_students_cache'
    const existingCache = JSON.parse(localStorage.getItem(cacheKey) || '{}')

    // Add/update students for this class
    existingCache[classId] = {
      data: students,
      timestamp: Date.now()
    }

    localStorage.setItem(cacheKey, JSON.stringify(existingCache))
    console.log('[Offline] Cached', students.length, 'students for class', classId)
    return true
  } catch (error) {
    console.error('Failed to cache students:', error)
    return false
  }
}

// Get cached students for a class for offline
export const getCachedStudents = (classId) => {
  try {
    const cacheKey = 'offline_students_cache'
    const cached = localStorage.getItem(cacheKey)

    if (cached) {
      const allCache = JSON.parse(cached)
      const classCache = allCache[classId]

      if (classCache) {
        // Cache valid for 7 days
        if (Date.now() - classCache.timestamp < 7 * 24 * 60 * 60 * 1000) {
          console.log('[Offline] Using cached students for class', classId, ':', classCache.data.length)
          return classCache.data
        }
      }
    }
    return []
  } catch (error) {
    console.error('Failed to get cached students:', error)
    return []
  }
}

// Get all cached students (for all classes)
export const getAllCachedStudents = () => {
  try {
    const cacheKey = 'offline_students_cache'
    const cached = localStorage.getItem(cacheKey)

    if (cached) {
      const allCache = JSON.parse(cached)
      let allStudents = []

      Object.values(allCache).forEach(classCache => {
        if (classCache.data && Array.isArray(classCache.data)) {
          allStudents = [...allStudents, ...classCache.data]
        }
      })

      return allStudents
    }
    return []
  } catch (error) {
    console.error('Failed to get all cached students:', error)
    return []
  }
}

// Clear offline cache
export const clearOfflineCache = () => {
  try {
    localStorage.removeItem('offline_classes_cache')
    localStorage.removeItem('offline_students_cache')
    console.log('[Offline] Cache cleared')
    return true
  } catch (error) {
    console.error('Failed to clear cache:', error)
    return false
  }
}

// Export all offline storage functions
export default {
  initOfflineStorage,
  storeOffline,
  getOfflineData,
  queueRequest,
  processQueue,
  storeAttendanceOffline,
  storeStudentOffline,
  shouldStoreOffline,
  getStorageStats,
  cleanupOldData,
  getPendingAttendance,
  syncOfflineAttendance,
  getOfflineAttendanceCount,
  // New cache functions
  cacheClassesOffline,
  getCachedClasses,
  cacheStudentsOffline,
  getCachedStudents,
  getAllCachedStudents,
  clearOfflineCache
}