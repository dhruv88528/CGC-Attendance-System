import { apiMethods } from '../utils/api'
import { ATTENDANCE_STATUS, RECOGNITION_MODES } from '../constants'
import { useOffline } from '../context/OfflineContext'

class AttendanceService {
  constructor() {
    this.offlineContext = null
  }

  // Set offline context
  setOfflineContext(context) {
    this.offlineContext = context
  }

  // Mark attendance
  async markAttendance(data) {
    try {
      const { image, mode = RECOGNITION_MODES.ONLINE, ...attendanceData } = data
      
      let recognitionResults = []
      
      // If image provided, use facial recognition
      if (image) {
        const recognitionResponse = await apiMethods.recognizeFaces(image)
        recognitionResults = recognitionResponse.data?.results || []
      }
      
      // Prepare final payload
      const payload = {
        ...attendanceData,
        records: recognitionResults.map(result => ({
          studentId: result.studentId,
          status: result.confidence > 0.6 ? ATTENDANCE_STATUS.PRESENT : ATTENDANCE_STATUS.ABSENT,
          confidence: result.confidence,
          recognized: true
        })),
        mode
      }
      
      // Check if offline mode should be used
      const useOffline = this.offlineContext?.shouldUseOfflineMode()
      
      let response
      
      if (useOffline) {
        // Store offline
        this.offlineContext.storeAttendance(payload)
        this.offlineContext.queueRequest('POST', '/attendance/capture', payload)
        
        response = {
          data: {
            ...payload,
            syncStatus: 'pending',
            offline: true,
            _id: `offline_${Date.now()}`
          }
        }
      } else {
        // Send to server
        response = await apiMethods.captureAttendance(payload)
      }
      
      return {
        success: true,
        attendance: response.data,
        recognitionResults,
        offline: useOffline,
        message: useOffline 
          ? 'Attendance saved offline. Will sync when online.' 
          : 'Attendance marked successfully!'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to mark attendance'
      }
    }
  }

  // Get daily attendance
  async getDailyAttendance(classId, date, section = null) {
    try {
      const params = { classId, date }
      if (section) params.section = section
      
      const response = await apiMethods.getDailyAttendance(params)
      return {
        success: true,
        attendance: response.data,
        date,
        classId,
        section
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch daily attendance'
      }
    }
  }

  // Get monthly attendance
  async getMonthlyAttendance(classId, month, year, section = null) {
    try {
      const params = { classId, month, year }
      if (section) params.section = section
      
      const response = await apiMethods.getMonthlyAttendance(params)
      return {
        success: true,
        attendance: response.data,
        month,
        year,
        classId,
        section
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch monthly attendance'
      }
    }
  }

  // Get student attendance history
  async getStudentAttendance(studentId, startDate, endDate) {
    try {
      const params = { startDate, endDate }
      const response = await apiMethods.getStudentAttendance(studentId, params)
      return {
        success: true,
        attendance: response.data,
        studentId,
        startDate,
        endDate
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch student attendance'
      }
    }
  }

  // Update attendance record
  async updateAttendance(attendanceId, updates) {
    try {
      const response = await apiMethods.updateAttendance(attendanceId, updates)
      
      // If offline mode, queue the update
      if (this.offlineContext?.shouldUseOfflineMode()) {
        this.offlineContext.queueRequest('PUT', `/attendance/${attendanceId}`, updates)
      }
      
      return {
        success: true,
        attendance: response.data,
        message: 'Attendance updated successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to update attendance'
      }
    }
  }

  // Calculate attendance statistics
  calculateStats(records) {
    if (!records || records.length === 0) {
      return {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        presentPercentage: 0,
        absentPercentage: 0,
        latePercentage: 0,
        excusedPercentage: 0
      }
    }
    
    const present = records.filter(r => r.status === ATTENDANCE_STATUS.PRESENT).length
    const absent = records.filter(r => r.status === ATTENDANCE_STATUS.ABSENT).length
    const late = records.filter(r => r.status === ATTENDANCE_STATUS.LATE).length
    const excused = records.filter(r => r.status === ATTENDANCE_STATUS.EXCUSED).length
    const total = records.length
    
    return {
      total,
      present,
      absent,
      late,
      excused,
      presentPercentage: total > 0 ? (present / total) * 100 : 0,
      absentPercentage: total > 0 ? (absent / total) * 100 : 0,
      latePercentage: total > 0 ? (late / total) * 100 : 0,
      excusedPercentage: total > 0 ? (excused / total) * 100 : 0
    }
  }

  // Generate attendance report
  async generateReport(type, params) {
    try {
      const response = await apiMethods.generateReport(type, params)
      return {
        success: true,
        report: response.data,
        type,
        params
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to generate report'
      }
    }
  }

  // Export report
  async exportReport(format, data) {
    try {
      const response = await apiMethods.exportReport(format, data)
      
      // Create download
      const blob = new Blob([response.data], { type: `application/${format}` })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      
      return {
        success: true,
        message: `Report exported as ${format.toUpperCase()}`
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to export report'
      }
    }
  }

  // Sync offline attendance
  async syncOfflineAttendance() {
    try {
      if (!this.offlineContext) {
        return {
          success: false,
          error: 'Offline context not available'
        }
      }
      
      const results = await this.offlineContext.syncData()
      return {
        success: true,
        results,
        message: 'Offline attendance synced successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to sync offline attendance'
      }
    }
  }

  // Get attendance trends
  async getAttendanceTrends(classId, startDate, endDate) {
    try {
      // This would typically come from a dedicated trends endpoint
      // For now, we'll simulate
      const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
      
      const trends = Array.from({ length: days }, (_, i) => {
        const date = new Date(startDate)
        date.setDate(date.getDate() + i)
        
        return {
          date: date.toISOString().split('T')[0],
          present: Math.floor(Math.random() * 30) + 20,
          absent: Math.floor(Math.random() * 10) + 1,
          total: Math.floor(Math.random() * 35) + 25
        }
      })
      
      return {
        success: true,
        trends,
        classId,
        startDate,
        endDate
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch attendance trends'
      }
    }
  }

  // Get class attendance summary
  async getClassAttendanceSummary(classId, date) {
    try {
      const response = await apiMethods.getDailyAttendance({ classId, date })
      
      if (response.data) {
        const stats = this.calculateStats(response.data.records)
        return {
          success: true,
          summary: {
            date,
            classId,
            ...stats
          }
        }
      }
      
      return {
        success: false,
        error: 'No attendance data found'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get class summary'
      }
    }
  }
}

export default new AttendanceService()