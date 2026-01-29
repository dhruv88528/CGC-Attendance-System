import { useState, useEffect, useCallback } from 'react'
import { useOffline } from '../context/OfflineContext'
import toast from 'react-hot-toast'

export const useOfflineSync = (options = {}) => {
  const {
    autoSync = true,
    syncInterval = 300000, // 5 minutes
    onSyncComplete,
    onSyncError
  } = options

  const { isOnline, isSyncing, queuedRequests, syncData } = useOffline()
  
  const [lastAttempt, setLastAttempt] = useState(null)
  const [syncAttempts, setSyncAttempts] = useState(0)
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(autoSync)

  // Auto-sync when online and there are queued requests
  useEffect(() => {
    if (!autoSyncEnabled || !isOnline || isSyncing || queuedRequests === 0) {
      return
    }

    const sync = async () => {
      const now = Date.now()
      
      // Don't sync too frequently
      if (lastAttempt && now - lastAttempt < 30000) {
        return
      }
      
      setLastAttempt(now)
      setSyncAttempts(prev => prev + 1)
      
      const results = await syncData()
      
      if (results.success > 0) {
        if (onSyncComplete) {
          onSyncComplete(results)
        }
      }
      
      if (results.failed > 0) {
        if (onSyncError) {
          onSyncError(results.errors)
        }
      }
    }

    const interval = setInterval(sync, syncInterval)
    sync() // Initial sync
    
    return () => clearInterval(interval)
  }, [
    isOnline,
    isSyncing,
    queuedRequests,
    autoSyncEnabled,
    syncInterval,
    lastAttempt,
    syncData,
    onSyncComplete,
    onSyncError
  ])

  // Manual sync
  const manualSync = useCallback(async () => {
    if (isSyncing) {
      toast('Already syncing...')
      return
    }
    
    if (queuedRequests === 0) {
      toast('No pending data to sync')
      return
    }
    
    if (!isOnline) {
      toast.error('Cannot sync while offline')
      return
    }
    
    setSyncAttempts(prev => prev + 1)
    
    const results = await syncData()
    return results
  }, [isOnline, isSyncing, queuedRequests, syncData])

  // Toggle auto-sync
  const toggleAutoSync = useCallback(() => {
    const newValue = !autoSyncEnabled
    setAutoSyncEnabled(newValue)
    
    toast(newValue ? 'Auto-sync enabled' : 'Auto-sync disabled', {
      icon: newValue ? '🔄' : '⏸️'
    })
    
    return newValue
  }, [autoSyncEnabled])

  // Check sync status
  const getSyncStatus = useCallback(() => {
    if (!isOnline) {
      return {
        status: 'offline',
        message: 'Device is offline',
        icon: '📴'
      }
    }
    
    if (isSyncing) {
      return {
        status: 'syncing',
        message: 'Syncing data...',
        icon: '🔄'
      }
    }
    
    if (queuedRequests > 0) {
      return {
        status: 'pending',
        message: `${queuedRequests} items pending sync`,
        icon: '📤'
      }
    }
    
    return {
      status: 'synced',
      message: 'All data synced',
      icon: '✅'
    }
  }, [isOnline, isSyncing, queuedRequests])

  // Force retry failed syncs
  const retryFailedSyncs = useCallback(async () => {
    // This would typically retry failed items from localStorage
    toast('Retrying failed syncs...')
    
    const results = await manualSync()
    return results
  }, [manualSync])

  // Get sync statistics
  const getSyncStats = useCallback(() => {
    return {
      queuedRequests,
      syncAttempts,
      lastAttempt: lastAttempt ? new Date(lastAttempt) : null,
      autoSyncEnabled,
      isOnline,
      isSyncing
    }
  }, [queuedRequests, syncAttempts, lastAttempt, autoSyncEnabled, isOnline, isSyncing])

  return {
    // State
    isSyncing,
    queuedRequests,
    autoSyncEnabled,
    syncAttempts,
    lastAttempt,
    
    // Methods
    manualSync,
    toggleAutoSync,
    getSyncStatus,
    retryFailedSyncs,
    getSyncStats,
    
    // Control
    setAutoSyncEnabled
  }
}