import React, { createContext, useState, useContext, useEffect, useCallback } from 'react'
import { apiMethods } from '../utils/api'
import offlineStorage from '../utils/offlineStorage'
import { STORAGE_KEYS } from '../constants'
import toast from 'react-hot-toast'

const OfflineContext = createContext({})

export const useOffline = () => useContext(OfflineContext)

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [queuedRequests, setQueuedRequests] = useState(0)
  const [lastSync, setLastSync] = useState(null)
  const [storageStats, setStorageStats] = useState({
    totalSize: 0,
    itemCount: 0,
    totalSizeMB: '0.00'
  })

  // Initialize offline storage
  useEffect(() => {
    offlineStorage.initOfflineStorage()
    updateStorageStats()
    
    // Load last sync time
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}')
    if (settings.lastSync) {
      setLastSync(new Date(settings.lastSync))
    }
    
    // Check for queued requests
    const queue = JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_DATA) || '[]')
    setQueuedRequests(queue.length)
  }, [])

  // Network status listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Back online! Syncing data...')
      
      // Auto-sync when coming online
      if (queuedRequests > 0) {
        setTimeout(() => {
          syncData()
        }, 2000)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast('You are offline. Changes will be saved locally.', {
        icon: '📡',
        duration: 4000
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cleanup interval on unmount
    const interval = setInterval(() => {
      updateStorageStats()
    }, 60000) // Update every minute

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [queuedRequests])

  // Update storage statistics
  const updateStorageStats = () => {
    const stats = offlineStorage.getStorageStats()
    setStorageStats(stats)
  }

  // Manual sync function
  const syncData = useCallback(async () => {
    if (!isOnline || isSyncing) return
    
    setIsSyncing(true)
    
    try {
      const results = await offlineStorage.processQueue(apiMethods)
      
      if (results.success > 0) {
        toast.success(`Synced ${results.success} items`)
      }
      
      if (results.failed > 0) {
        toast.error(`Failed to sync ${results.failed} items`)
      }
      
      // Update queue count
      const queue = JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_DATA) || '[]')
      setQueuedRequests(queue.length)
      
      // Update last sync time
      const now = new Date()
      setLastSync(now)
      
      // Update storage stats
      updateStorageStats()
      
      // Cleanup old data
      offlineStorage.cleanupOldData()
      
      return results
    } catch (error) {
      toast.error('Sync failed. Please try again.')
      console.error('Sync error:', error)
      return { success: 0, failed: 0, errors: [error.message] }
    } finally {
      setIsSyncing(false)
    }
  }, [isOnline, isSyncing])

  // Queue a request for offline processing
  const queueRequest = useCallback((method, endpoint, data) => {
    const requestId = offlineStorage.queueRequest(method, endpoint, data)
    setQueuedRequests(prev => prev + 1)
    
    toast('Request queued for offline processing', {
      icon: '📝',
      duration: 3000
    })
    
    return requestId
  }, [])

  // Store attendance offline
  const storeAttendance = useCallback((attendanceData) => {
    if (!offlineStorage.shouldStoreOffline()) return false
    
    const success = offlineStorage.storeAttendanceOffline(attendanceData)
    
    if (success) {
      toast('Attendance saved offline', {
        icon: '💾',
        duration: 3000
      })
      updateStorageStats()
    }
    
    return success
  }, [])

  // Store student data offline
  const storeStudent = useCallback((studentData) => {
    if (!offlineStorage.shouldStoreOffline()) return false
    
    const success = offlineStorage.storeStudentOffline(studentData)
    
    if (success) {
      toast('Student data saved offline', {
        icon: '💾',
        duration: 3000
      })
      updateStorageStats()
    }
    
    return success
  }, [])

  // Get offline data
  const getOfflineData = useCallback((key) => {
    return offlineStorage.getOfflineData(key)
  }, [])

  // Check if should use offline mode
  const shouldUseOfflineMode = useCallback(() => {
    if (!isOnline) return true
    
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}')
    return settings.offlineMode === true
  }, [isOnline])

  // Toggle offline mode
  const toggleOfflineMode = useCallback(() => {
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}')
    settings.offlineMode = !settings.offlineMode
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
    
    toast(settings.offlineMode ? 'Offline mode enabled' : 'Offline mode disabled', {
      icon: settings.offlineMode ? '📴' : '📡'
    })
    
    return settings.offlineMode
  }, [])

  // Clear all offline data
  const clearOfflineData = useCallback(() => {
    // Clear all attendance and student data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.startsWith('attendance_') || key.startsWith('student_')) {
        localStorage.removeItem(key)
      }
    }
    
    // Clear queue
    localStorage.setItem(STORAGE_KEYS.OFFLINE_DATA, JSON.stringify([]))
    
    setQueuedRequests(0)
    updateStorageStats()
    
    toast.success('Offline data cleared')
  }, [])

  const value = {
    isOnline,
    isSyncing,
    queuedRequests,
    lastSync,
    storageStats,
    syncData,
    queueRequest,
    storeAttendance,
    storeStudent,
    getOfflineData,
    shouldUseOfflineMode,
    toggleOfflineMode,
    clearOfflineData,
    updateStorageStats
  }

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  )
}