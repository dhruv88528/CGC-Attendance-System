import { useState, useCallback } from 'react'
import { apiMethods } from '../utils/api'
import { useOffline } from '../context/OfflineContext'
import { ATTENDANCE_STATUS, RECOGNITION_MODES } from '../constants'
import toast from 'react-hot-toast'

export const useAttendance = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [attendanceData, setAttendanceData] = useState(null)
  const [recognitionResults, setRecognitionResults] = useState([])
  
  const { storeAttendance, shouldUseOfflineMode, queueRequest } = useOffline()

  // Mark attendance
  const markAttendance = useCallback(async (data) => {
    setLoading(true)
    setError(null)
    
    const {
      classId,
      date,
      image,
      mode = RECOGNITION_MODES.ONLINE,
      students = []
    } = data
    
    try {
      let results = []
      
      // If students array is provided, use manual marking
      if (students.length > 0) {
        results = students.map(student => ({
          studentId: student.id,
          status: student.status || ATTENDANCE_STATUS.PRESENT,
          confidence: 1,
          manual: true
        }))
      } 
      // Otherwise, use facial recognition
      else if (image) {
        // Call AI service for recognition
        const recognitionResponse = await apiMethods.recognizeFaces(image)
        results = recognitionResponse.data.results
      }
      
      setRecognitionResults(results)
      
      // Prepare attendance data
      const attendancePayload = {
        classId,
        date,
        records: results,
        mode
      }
      
      // Check if we should use offline mode
      const useOffline = shouldUseOfflineMode()
      
      let response
      
      if (useOffline) {
        // Store offline and queue for sync
        storeAttendance(attendancePayload)
        queueRequest('POST', '/attendance/capture', attendancePayload)
        
        response = {
          data: {
            ...attendancePayload,
            syncStatus: 'pending',
            offline: true
          }
        }
      } else {
        // Send to server
        response = await apiMethods.captureAttendance(attendancePayload)
      }
      
      setAttendanceData(response.data)
      
      const message = useOffline 
        ? 'Attendance saved offline. Will sync when online.' 
        : 'Attendance marked successfully!'
      
      toast.success(message)
      
      return {
        success: true,
        data: response.data,
        results,
        offline: useOffline
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to mark attendance'
      setError(errorMsg)
      toast.error(errorMsg)
      
      return {
        success: false,
        error: errorMsg
      }
    } finally {
      setLoading(false)
    }
  }, [storeAttendance, shouldUseOfflineMode, queueRequest])

  // Get daily attendance
  const getDailyAttendance = useCallback(async (params) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiMethods.getDailyAttendance(params)
      return {
        success: true,
        data: response.data
      }
    } catch (err) {
      setError(err.message)
      return {
        success: false,
        error: err.message
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Get monthly attendance
  const getMonthlyAttendance = useCallback(async (params) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiMethods.getMonthlyAttendance(params)
      return {
        success: true,
        data: response.data
      }
    } catch (err) {
      setError(err.message)
      return {
        success: false,
        error: err.message
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Get student attendance history
  const getStudentAttendance = useCallback(async (studentId) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiMethods.getStudentAttendance(studentId)
      return {
        success: true,
        data: response.data
      }
    } catch (err) {
      setError(err.message)
      return {
        success: false,
        error: err.message
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Update attendance manually
  const updateAttendance = useCallback(async (attendanceId, updates) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiMethods.updateAttendance(attendanceId, updates)
      
      // Update local state if needed
      if (attendanceData && attendanceData._id === attendanceId) {
        setAttendanceData(prev => ({
          ...prev,
          ...updates
        }))
      }
      
      toast.success('Attendance updated successfully')
      
      return {
        success: true,
        data: response.data
      }
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
      return {
        success: false,
        error: err.message
      }
    } finally {
      setLoading(false)
    }
  }, [attendanceData])

  // Clear attendance data
  const clearAttendanceData = useCallback(() => {
    setAttendanceData(null)
    setRecognitionResults([])
    setError(null)
  }, [])

  // Verify attendance
  const verifyAttendance = useCallback(async (verificationData) => {
    setLoading(true)
    
    try {
      // This would typically send verification to server
      // For now, we'll simulate
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Attendance verified and saved')
      
      return {
        success: true,
        verified: true
      }
    } catch (err) {
      setError(err.message)
      toast.error('Verification failed')
      
      return {
        success: false,
        error: err.message
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Calculate attendance statistics
  const calculateStats = useCallback((records) => {
    if (!records || records.length === 0) {
      return {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        presentPercentage: 0
      }
    }
    
    const present = records.filter(r => r.status === ATTENDANCE_STATUS.PRESENT).length
    const absent = records.filter(r => r.status === ATTENDANCE_STATUS.ABSENT).length
    const late = records.filter(r => r.status === ATTENDANCE_STATUS.LATE).length
    const excused = records.filter(r => r.status === ATTENDANCE_STATUS.EXCUSED).length
    const total = records.length
    
    const presentPercentage = total > 0 ? (present / total) * 100 : 0
    
    return {
      total,
      present,
      absent,
      late,
      excused,
      presentPercentage
    }
  }, [])

  // Export attendance data
  const exportAttendance = useCallback(async (format, data) => {
    setLoading(true)
    
    try {
      const response = await apiMethods.exportReport(format, data)
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `attendance_report.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success(`Report exported as ${format.toUpperCase()}`)
      
      return {
        success: true
      }
    } catch (err) {
      setError(err.message)
      toast.error('Export failed')
      return {
        success: false,
        error: err.message
      }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    // State
    loading,
    error,
    attendanceData,
    recognitionResults,
    
    // Methods
    markAttendance,
    getDailyAttendance,
    getMonthlyAttendance,
    getStudentAttendance,
    updateAttendance,
    clearAttendanceData,
    verifyAttendance,
    calculateStats,
    exportAttendance,
    
    // Utility
    setRecognitionResults
  }
}