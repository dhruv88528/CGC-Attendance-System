import { apiMethods } from '../utils/api'
import { REPORT_TYPES, EXPORT_FORMATS } from '../constants'
import formatters from '../utils/formatters'

class ReportService {
  // Generate report
  async generateReport(type, params = {}) {
    try {
      const response = await apiMethods.generateReport(type, params)
      
      // Process and format the data
      const processedData = this.processReportData(type, response.data)
      
      return {
        success: true,
        report: processedData,
        metadata: {
          type,
          generatedAt: new Date().toISOString(),
          params
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to generate report'
      }
    }
  }

  // Process report data based on type
  processReportData(type, rawData) {
    switch (type) {
      case REPORT_TYPES.DAILY:
        return this.processDailyReport(rawData)
      case REPORT_TYPES.MONTHLY:
        return this.processMonthlyReport(rawData)
      case REPORT_TYPES.STUDENT:
        return this.processStudentReport(rawData)
      case REPORT_TYPES.MIDDAY_MEAL:
        return this.processMiddayMealReport(rawData)
      default:
        return rawData
    }
  }

  // Process daily attendance report
  processDailyReport(data) {
    const { date, class: classInfo, records = [], summary } = data
    
    // Calculate statistics if not provided
    const stats = summary || this.calculateAttendanceStats(records)
    
    // Format records
    const formattedRecords = records.map(record => ({
      ...record,
      studentName: formatters.formatStudentName(record.student),
      statusFormatted: formatters.formatAttendanceStatus(record.status),
      timeFormatted: record.timestamp ? formatters.formatTime(record.timestamp) : 'N/A'
    }))
    
    return {
      title: `Daily Attendance Report - ${formatters.formatDate(date)}`,
      subtitle: classInfo ? `${classInfo.name} - Section ${data.section}` : 'All Classes',
      date,
      class: classInfo,
      section: data.section,
      records: formattedRecords,
      statistics: stats,
      generatedAt: new Date().toISOString()
    }
  }

  // Process monthly attendance report
  processMonthlyReport(data) {
    const { month, year, class: classInfo, summary = [], dailyStats = [] } = data
    
    // Format summary
    const formattedSummary = summary.map(item => ({
      ...item,
      presentPercentage: formatters.formatPercentage(item.presentPercentage),
      absentPercentage: formatters.formatPercentage(item.absentPercentage)
    }))
    
    // Format daily stats
    const formattedDailyStats = dailyStats.map(day => ({
      ...day,
      dateFormatted: formatters.formatDate(day.date),
      presentPercentage: formatters.formatPercentage(day.presentPercentage)
    }))
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    
    return {
      title: `Monthly Attendance Report - ${monthNames[month - 1]} ${year}`,
      subtitle: classInfo ? `${classInfo.name} - Section ${data.section}` : 'All Classes',
      month,
      year,
      class: classInfo,
      section: data.section,
      summary: formattedSummary,
      dailyStats: formattedDailyStats,
      generatedAt: new Date().toISOString()
    }
  }

  // Process student attendance report
  processStudentReport(data) {
    const { student, attendance = [], summary } = data
    
    // Calculate overall statistics
    const totalDays = attendance.length
    const presentDays = attendance.filter(a => a.status === 'present').length
    const presentPercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0
    
    // Format attendance records
    const formattedAttendance = attendance.map(record => ({
      ...record,
      dateFormatted: formatters.formatDate(record.date),
      statusFormatted: formatters.formatAttendanceStatus(record.status),
      classInfo: record.class ? `${record.class.name} - Section ${record.section}` : 'N/A'
    }))
    
    return {
      title: `Student Attendance Report - ${formatters.formatStudentName(student)}`,
      subtitle: `Student ID: ${student.studentId} | Class: ${student.class?.name || 'N/A'}`,
      student,
      attendance: formattedAttendance,
      statistics: {
        totalDays,
        presentDays,
        absentDays: totalDays - presentDays,
        presentPercentage: formatters.formatPercentage(presentPercentage),
        ...summary
      },
      generatedAt: new Date().toISOString()
    }
  }

  // Process midday meal report
  processMiddayMealReport(data) {
    const { date, class: classInfo, attendance = [], mealDetails = {} } = data
    
    // Calculate meal statistics
    const totalStudents = attendance.length
    const presentStudents = attendance.filter(a => a.status === 'present').length
    const mealServed = mealDetails.served || presentStudents // Default to present count
    const mealWasted = mealDetails.wasted || 0
    
    // Format attendance for meal report
    const mealAttendance = attendance.map(record => ({
      studentId: record.student?.studentId,
      studentName: formatters.formatStudentName(record.student),
      status: record.status,
      mealServed: record.status === 'present', // Assuming meal served to present students
      remarks: record.remarks || ''
    }))
    
    return {
      title: `Mid-Day Meal Report - ${formatters.formatDate(date)}`,
      subtitle: classInfo ? `${classInfo.name} - Section ${data.section}` : 'All Classes',
      date,
      class: classInfo,
      section: data.section,
      attendance: mealAttendance,
      mealStatistics: {
        totalStudents,
        presentStudents,
        mealServed,
        mealWasted,
        mealConsumed: mealServed - mealWasted,
        attendancePercentage: formatters.formatPercentage((presentStudents / totalStudents) * 100)
      },
      mealDetails,
      generatedAt: new Date().toISOString()
    }
  }

  // Calculate attendance statistics
  calculateAttendanceStats(records) {
    if (!records || records.length === 0) {
      return {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        presentPercentage: '0%',
        absentPercentage: '0%'
      }
    }
    
    const present = records.filter(r => r.status === 'present').length
    const absent = records.filter(r => r.status === 'absent').length
    const late = records.filter(r => r.status === 'late').length
    const excused = records.filter(r => r.status === 'excused').length
    const total = records.length
    
    return {
      total,
      present,
      absent,
      late,
      excused,
      presentPercentage: formatters.formatPercentage((present / total) * 100),
      absentPercentage: formatters.formatPercentage((absent / total) * 100),
      latePercentage: formatters.formatPercentage((late / total) * 100),
      excusedPercentage: formatters.formatPercentage((excused / total) * 100)
    }
  }

  // Export report to different formats
  async exportReport(reportData, format = EXPORT_FORMATS.PDF) {
    try {
      const response = await apiMethods.exportReport(format, reportData)
      
      // Create download
      const blob = new Blob([response.data], { 
        type: this.getMimeType(format) 
      })
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = this.generateFilename(reportData, format)
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

  // Get MIME type for export format
  getMimeType(format) {
    const mimeTypes = {
      [EXPORT_FORMATS.PDF]: 'application/pdf',
      [EXPORT_FORMATS.EXCEL]: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      [EXPORT_FORMATS.CSV]: 'text/csv'
    }
    
    return mimeTypes[format] || 'application/octet-stream'
  }

  // Generate filename for export
  generateFilename(reportData, format) {
    const { title, date, month, year } = reportData
    const timestamp = new Date().toISOString().split('T')[0]
    
    let baseName = title || 'report'
    
    // Clean filename
    baseName = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
    
    if (date) {
      const dateStr = formatters.formatDate(date, 'yyyy-MM-dd')
      return `${baseName}_${dateStr}.${format}`
    } else if (month && year) {
      return `${baseName}_${year}_${String(month).padStart(2, '0')}.${format}`
    }
    
    return `${baseName}_${timestamp}.${format}`
  }

  // Generate report preview data
  generatePreview(type, params) {
    // Generate mock preview data for UI
    const previews = {
      [REPORT_TYPES.DAILY]: {
        title: 'Daily Attendance Preview',
        date: params.date || new Date().toISOString().split('T')[0],
        totalStudents: 45,
        present: 38,
        absent: 5,
        late: 2,
        attendanceRate: '84.4%'
      },
      [REPORT_TYPES.MONTHLY]: {
        title: 'Monthly Summary Preview',
        month: params.month || new Date().getMonth() + 1,
        year: params.year || new Date().getFullYear(),
        averageAttendance: '82.5%',
        bestDay: '2024-01-15 (95.6%)',
        worstDay: '2024-01-22 (68.9%)'
      },
      [REPORT_TYPES.STUDENT]: {
        title: 'Student Report Preview',
        studentName: 'Sample Student',
        totalDays: 22,
        presentDays: 18,
        attendanceRate: '81.8%',
        lastAttendance: '2024-01-25 (Present)'
      },
      [REPORT_TYPES.MIDDAY_MEAL]: {
        title: 'Mid-Day Meal Report Preview',
        date: params.date || new Date().toISOString().split('T')[0],
        totalStudents: 45,
        mealServed: 38,
        mealConsumed: 36,
        wastage: '5.3%'
      }
    }
    
    return previews[type] || { title: 'Report Preview' }
  }

  // Get available report types
  getReportTypes() {
    return [
      {
        id: REPORT_TYPES.DAILY,
        name: 'Daily Attendance Report',
        description: 'Detailed attendance report for a specific day',
        icon: '📅',
        availableFormats: [EXPORT_FORMATS.PDF, EXPORT_FORMATS.EXCEL, EXPORT_FORMATS.CSV]
      },
      {
        id: REPORT_TYPES.MONTHLY,
        name: 'Monthly Summary Report',
        description: 'Monthly attendance summary and statistics',
        icon: '📊',
        availableFormats: [EXPORT_FORMATS.PDF, EXPORT_FORMATS.EXCEL]
      },
      {
        id: REPORT_TYPES.STUDENT,
        name: 'Student Attendance History',
        description: 'Individual student attendance record',
        icon: '👨‍🎓',
        availableFormats: [EXPORT_FORMATS.PDF, EXPORT_FORMATS.EXCEL]
      },
      {
        id: REPORT_TYPES.MIDDAY_MEAL,
        name: 'Mid-Day Meal Report',
        description: 'Attendance report for mid-day meal scheme',
        icon: '🍛',
        availableFormats: [EXPORT_FORMATS.PDF, EXPORT_FORMATS.EXCEL, EXPORT_FORMATS.CSV]
      }
    ]
  }

  // Validate report parameters
  validateReportParams(type, params) {
    const errors = {}
    
    switch (type) {
      case REPORT_TYPES.DAILY:
        if (!params.date) errors.date = 'Date is required'
        if (!params.classId) errors.classId = 'Class is required'
        break
        
      case REPORT_TYPES.MONTHLY:
        if (!params.month) errors.month = 'Month is required'
        if (!params.year) errors.year = 'Year is required'
        if (!params.classId) errors.classId = 'Class is required'
        break
        
      case REPORT_TYPES.STUDENT:
        if (!params.studentId) errors.studentId = 'Student is required'
        if (!params.startDate) errors.startDate = 'Start date is required'
        if (!params.endDate) errors.endDate = 'End date is required'
        break
        
      case REPORT_TYPES.MIDDAY_MEAL:
        if (!params.date) errors.date = 'Date is required'
        if (!params.classId) errors.classId = 'Class is required'
        break
    }
    
    return errors
  }
}

export default new ReportService()