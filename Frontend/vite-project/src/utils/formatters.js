
import { format, parseISO, isValid, differenceInDays } from 'date-fns'
import { DATE_FORMATS } from '../constants'

// Format date for display
export const formatDate = (date, formatStr = DATE_FORMATS.DISPLAY) => {
  if (!date) return 'N/A'
  
  try {
    const dateObj = date instanceof Date ? date : parseISO(date)
    if (!isValid(dateObj)) return 'Invalid Date'
    return format(dateObj, formatStr)
  } catch (error) {
    return 'Invalid Date'
  }
}

// Format time
export const formatTime = (time) => {
  if (!time) return 'N/A'
  return format(new Date(time), DATE_FORMATS.TIME)
}

// Format attendance percentage
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return 'N/A'
  return `${value.toFixed(decimals)}%`
}

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Format duration
export const formatDuration = (seconds) => {
  if (!seconds) return '0s'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  const parts = []
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)
  
  return parts.join(' ')
}

// Format student name
export const formatStudentName = (student) => {
  if (!student) return 'N/A'
  return `${student.firstName} ${student.lastName}`.trim()
}

// Format class section
export const formatClassSection = (classObj, section) => {
  if (!classObj) return 'N/A'
  return `${classObj.name} - Section ${section}`
}

// Format attendance status with icon
export const formatAttendanceStatus = (status) => {
  const statusConfig = {
    present: {
      label: 'Present',
      color: 'text-green-600',
      bg: 'bg-green-100',
      icon: '✓'
    },
    absent: {
      label: 'Absent',
      color: 'text-red-600',
      bg: 'bg-red-100',
      icon: '✗'
    },
    late: {
      label: 'Late',
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
      icon: '⌚'
    },
    excused: {
      label: 'Excused',
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      icon: 'ℹ️'
    }
  }
  
  const config = statusConfig[status] || statusConfig.absent
  return config
}

// Format confidence score
export const formatConfidence = (confidence) => {
  if (!confidence) return 'N/A'
  const percentage = Math.round(confidence * 100)
  return `${percentage}%`
}

// Format number with commas
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0'
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// Format phone number
export const formatPhoneNumber = (phone) => {
  if (!phone) return 'N/A'
  
  // Indian phone number format: +91 XXXXX XXXXX
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  }
  
  return phone
}

// Format address (truncate if too long)
export const formatAddress = (address, maxLength = 50) => {
  if (!address) return 'N/A'
  if (address.length <= maxLength) return address
  return address.substring(0, maxLength) + '...'
}

// Format time ago
export const formatTimeAgo = (date) => {
  if (!date) return 'N/A'
  
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = Math.floor((now - past) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`
  return `${Math.floor(diffInSeconds / 31536000)} years ago`
}

// Format days until date
export const formatDaysUntil = (date) => {
  if (!date) return 'N/A'
  
  const now = new Date()
  const future = new Date(date)
  const diffInDays = differenceInDays(future, now)
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Tomorrow'
  if (diffInDays === -1) return 'Yesterday'
  if (diffInDays > 0) return `In ${diffInDays} days`
  if (diffInDays < 0) return `${Math.abs(diffInDays)} days ago`
  
  return 'Today'
}

// Format report filename
export const formatReportFilename = (reportType, startDate, endDate) => {
  const typeMap = {
    'daily': 'Daily_Attendance',
    'monthly': 'Monthly_Summary',
    'student': 'Student_Report',
    'midday-meal': 'Midday_Meal_Report'
  }
  
  const typeName = typeMap[reportType] || 'Report'
  const start = formatDate(startDate, 'yyyy-MM-dd')
  const end = formatDate(endDate, 'yyyy-MM-dd')
  
  if (start === end) {
    return `${typeName}_${start}.pdf`
  }
  
  return `${typeName}_${start}_to_${end}.pdf`
}

// Format CSV data
export const formatCSVData = (data, columns) => {
  const headers = columns.map(col => col.header)
  const rows = data.map(item => 
    columns.map(col => {
      const value = col.accessor(item)
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
    })
  )
  
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

// Export all formatters
export default {
  formatDate,
  formatTime,
  formatPercentage,
  formatFileSize,
  formatDuration,
  formatStudentName,
  formatClassSection,
  formatAttendanceStatus,
  formatConfidence,
  formatNumber,
  formatPhoneNumber,
  formatAddress,
  formatTimeAgo,
  formatDaysUntil,
  formatReportFilename,
  formatCSVData
}
