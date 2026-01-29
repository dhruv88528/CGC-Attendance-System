import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  RefreshCw,
  Calendar,
  Users,
  Clock,
  TrendingUp
} from 'lucide-react'
import Button from '../common/Button'
import Card from '../common/Card'
import Input from '../common/Input'
import Table from '../common/Table'
import Modal from '../common/Modal'
import { apiMethods } from '../../utils/api'
import { syncOfflineAttendance, getOfflineAttendanceCount } from '../../utils/offlineStorage'
import { ATTENDANCE_STATUS } from '../../constants'
import toast from 'react-hot-toast'
import format from 'date-fns/format'

const AttendanceVerification = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [filteredRecords, setFilteredRecords] = useState([])
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editStatus, setEditStatus] = useState('')

  // Classes from API
  const [classes, setClasses] = useState([])
  const sections = ['A', 'B', 'C', 'D']

  // Fetch classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await apiMethods.getClasses()
        if (response.success && response.data) {
          setClasses(response.data.map(c => c.name))
        }
      } catch (error) {
        console.error('Error fetching classes:', error)
      }
    }
    fetchClasses()
  }, [])
const loadAttendance = async () => {
  setIsLoading(true)
  try {
    const response = await apiMethods.getDailyAttendance({ date: selectedDate })

    if (response.success && response.data && response.data.length > 0) {
      // Deduplicate records - keep only latest record per student
      const deduplicatedMap = new Map()
      
      response.data.forEach((att) => {
        // FIXED: Better student ID extraction with fallback
        const studentId = att.student?._id || att.studentId || att.student
        
        // FIXED: Skip records without valid student ID
        if (!studentId) {
          console.warn('Skipping attendance record without student ID:', att)
          return
        }
        
        const existingRecord = deduplicatedMap.get(studentId)
        
        // Keep the most recently updated record for each student
        if (!existingRecord || 
            new Date(att.markedAt || att.updatedAt || att.createdAt) > 
            new Date(existingRecord.markedAt || existingRecord.updatedAt || existingRecord.createdAt)) {
          deduplicatedMap.set(studentId, att)
        }
      })

      // FIXED: Better error handling and data validation
      const records = Array.from(deduplicatedMap.values())
        .filter(att => att.student?._id || att.studentId) // Only include valid records
        .map((att, i) => ({
          id: att._id || `ATT${Date.now()}-${i}`, // Better unique ID
          studentId: att.student?._id || att.studentId || att.student,
          studentName: att.student?.firstName 
            ? `${att.student.firstName} ${att.student.lastName || ''}`.trim()
            : att.student?.name || 'Unknown',
          rollNumber: att.student?.rollNumber || i + 1,
          className: att.class?.name || selectedClass || 'Unknown',
          section: att.section || 'A',
          date: selectedDate,
          status: att.status || 'absent',
          confidence: att.confidence || 0,
          recognized: att.recognitionMethod === 'face' || att.recognizedBy === 'face',
          timestamp: att.createdAt || new Date().toISOString(),
          teacher: att.markedBy?.name || 'System',
          remarks: att.remarks || '',
          syncStatus: 'synced'
        }))

      console.log('✅ Loaded attendance records:', records.length)
      console.log('Student IDs:', records.map(r => r.studentId))
      
      setAttendanceRecords(records)
      setFilteredRecords(records)
      toast.success(`Loaded ${records.length} attendance records`, { id: 'load-attendance' })
    } else {
      setAttendanceRecords([])
      setFilteredRecords([])
      toast('No attendance records found for this date', { id: 'load-attendance' })
    }
  } catch (error) {
    console.error('❌ Error loading attendance:', error)
    setAttendanceRecords([])
    setFilteredRecords([])
    toast.error('Failed to load attendance records', { id: 'load-attendance' })
  } finally {
    setIsLoading(false)
  }
}
  // Apply filters
  useEffect(() => {
    let filtered = attendanceRecords

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(record =>
        record.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.rollNumber.toString().includes(searchQuery)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter)
    }

    // Apply class filter
    if (selectedClass) {
      filtered = filtered.filter(record => record.className === selectedClass)
    }

    // Apply section filter
    if (selectedSection) {
      filtered = filtered.filter(record => record.section === selectedSection)
    }

    setFilteredRecords(filtered)
  }, [searchQuery, statusFilter, selectedClass, selectedSection, attendanceRecords])

  // Load initial data
  useEffect(() => {
    loadAttendance()
  }, [selectedDate])

  const handleEditAttendance = async () => {
    if (!selectedRecord || !editStatus) return

    try {
      // Call backend API to update attendance
      const response = await apiMethods.updateAttendance(selectedRecord.id, {
        status: editStatus,
        remarks: 'Manually updated by teacher'
      })

      if (response.success) {
        // Update local state
        setAttendanceRecords(prev =>
          prev.map(record =>
            record.id === selectedRecord.id
              ? { ...record, status: editStatus, remarks: 'Manually updated' }
              : record
          )
        )

        toast.success('Attendance updated successfully')
        setShowEditModal(false)
        setSelectedRecord(null)
        setEditStatus('')
      } else {
        toast.error(response.message || 'Failed to update attendance')
      }
    } catch (error) {
      console.error('Update attendance error:', error)
      toast.error('Failed to update attendance')
    }
  }

  const handleExport = () => {
    const csvData = [
      ['Date', 'Class', 'Section', 'Roll No', 'Student Name', 'Status', 'Confidence', 'Time'],
      ...filteredRecords.map(record => [
        record.date,
        record.className,
        record.section,
        record.rollNumber,
        record.studentName,
        record.status,
        record.confidence ? `${Math.round(record.confidence * 100)}%` : 'N/A',
        new Date(record.timestamp).toLocaleTimeString()
      ])
    ]

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance_verification_${selectedDate}.csv`
    a.click()

    toast.success('Records exported successfully')
  }

  const calculateStats = () => {
    const total = attendanceRecords.length
    const present = attendanceRecords.filter(r => r.status === ATTENDANCE_STATUS.PRESENT).length
    const absent = attendanceRecords.filter(r => r.status === ATTENDANCE_STATUS.ABSENT).length
    const recognized = attendanceRecords.filter(r => r.recognized).length
    const attendanceRate = total > 0 ? (present / total) * 100 : 0

    return { total, present, absent, recognized, attendanceRate }
  }

  const tableColumns = [
    {
      key: 'rollNumber',
      header: 'Roll No',
      width: '80px'
    },
    {
      key: 'studentName',
      header: 'Student Name',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {value}
          </div>
          <div className="text-xs text-gray-500">
            {row.studentId}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          {value === ATTENDANCE_STATUS.PRESENT ? (
            <CheckCircle className="text-green-500" size={16} />
          ) : (
            <XCircle className="text-red-500" size={16} />
          )}
          <span className={`px-2 py-1 rounded text-xs font-medium ${value === ATTENDANCE_STATUS.PRESENT
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            }`}>
            {value}
          </span>
          {row.recognized && row.confidence && (
            <span className="text-xs text-gray-500">
              ({Math.round(row.confidence * 100)}%)
            </span>
          )}
        </div>
      )
    },
    {
      key: 'confidence',
      header: 'Confidence',
      render: (value) => (
        <div className="flex items-center">
          <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-yellow-500"
              style={{ width: `${(value || 0) * 100}%` }}
            />
          </div>
          <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
            {value ? `${Math.round(value * 100)}%` : 'N/A'}
          </span>
        </div>
      )
    },
    {
      key: 'timestamp',
      header: 'Time',
      render: (value) => format(new Date(value), 'hh:mm a')
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSelectedRecord(row)
              setShowDetailsModal(true)
            }}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="View details"
          >
            <Eye size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
          <button
            onClick={() => {
              setSelectedRecord(row)
              setEditStatus(row.status)
              setShowEditModal(true)
            }}
            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            aria-label="Edit"
          >
            <Edit size={16} className="text-blue-500" />
          </button>
        </div>
      )
    }
  ]

  const stats = calculateStats()

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="page-title flex items-center">
          <CheckCircle className="mr-3" size={32} />
          Attendance Verification
        </h1>
        <p className="page-subtitle">
          Review, verify, and manage student attendance records
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Filters & Table */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Filters Card */}
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Class
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="">All Classes</option>
                  {classes.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Section
                </label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="">All Sections</option>
                  {sections.map(sec => (
                    <option key={sec} value={sec}>Section {sec}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="all">All Status</option>
                  <option value={ATTENDANCE_STATUS.PRESENT}>Present</option>
                  <option value={ATTENDANCE_STATUS.ABSENT}>Absent</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by name or roll number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={Search}
                  showClear
                  onClear={() => setSearchQuery('')}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  icon={RefreshCw}
                  onClick={loadAttendance}
                  loading={isLoading}
                >
                  Refresh
                </Button>

                <Button
                  variant="outline"
                  icon={Download}
                  onClick={handleExport}
                >
                  Export
                </Button>
              </div>
            </div>
          </Card>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.total}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center">
                <Users className="mr-1" size={14} />
                Total Students
              </div>
            </Card>

            <Card className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                {stats.present}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center">
                <CheckCircle className="mr-1" size={14} />
                Present
              </div>
            </Card>

            <Card className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                {stats.absent}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center">
                <XCircle className="mr-1" size={14} />
                Absent
              </div>
            </Card>

            <Card className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {stats.attendanceRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center">
                <TrendingUp className="mr-1" size={14} />
                Attendance Rate
              </div>
            </Card>
          </div>

          {/* Attendance Table */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Attendance Records
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({filteredRecords.length} records)
                </span>
              </h3>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                Last updated: {format(new Date(), 'hh:mm a')}
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg loading-shimmer" />
                ))}
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-12">
                <Search className="text-gray-400 mx-auto mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No attendance records found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your filters or select a different date
                </p>
              </div>
            ) : (
              <Table
                columns={tableColumns}
                data={filteredRecords}
                striped
                hoverable
                pagination={{
                  currentPage: 1,
                  totalPages: 3,
                  total: filteredRecords.length,
                  from: 1,
                  to: filteredRecords.length
                }}
              />
            )}
          </Card>
        </motion.div>

        {/* Right Column - Details & Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Record Details */}
          {selectedRecord && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📋 Record Details
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Student Name
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {selectedRecord.studentName}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Roll No
                    </div>
                    <div className="font-medium">{selectedRecord.rollNumber}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Student ID
                    </div>
                    <div className="font-medium">{selectedRecord.studentId}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Status
                  </div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full ${selectedRecord.status === ATTENDANCE_STATUS.PRESENT
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                    {selectedRecord.status === ATTENDANCE_STATUS.PRESENT ? (
                      <CheckCircle className="mr-1" size={14} />
                    ) : (
                      <XCircle className="mr-1" size={14} />
                    )}
                    <span className="capitalize">{selectedRecord.status}</span>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Confidence Score
                  </div>
                  <div className="flex items-center">
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-yellow-500"
                        style={{ width: `${(selectedRecord.confidence || 0) * 100}%` }}
                      />
                    </div>
                    <span className="ml-2 text-sm">
                      {selectedRecord.confidence ? `${Math.round(selectedRecord.confidence * 100)}%` : 'N/A'}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Recognition Method
                  </div>
                  <div className="font-medium">
                    {selectedRecord.recognized ? 'AI Recognition' : 'Manual Entry'}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Time Recorded
                  </div>
                  <div className="font-medium">
                    {format(new Date(selectedRecord.timestamp), 'hh:mm a')}
                  </div>
                </div>

                {selectedRecord.remarks && (
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Remarks
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedRecord.remarks}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setEditStatus(selectedRecord.status)
                    setShowEditModal(true)
                  }}
                >
                  Edit Record
                </Button>
              </div>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              ⚡ Quick Actions
            </h3>

            <div className="space-y-3">
              <Button
                variant="primary"
                fullWidth
                onClick={() => window.location.href = '/attendance'}
              >
                Take New Attendance
              </Button>

              <Button
                variant="outline"
                fullWidth
                onClick={() => window.location.href = '/reports'}
              >
                Generate Report
              </Button>

              <Button
                variant="outline"
                fullWidth
                onClick={() => window.location.href = '/reports'}
              >
                View Attendance Trends
              </Button>

              <Button
                variant="ghost"
                fullWidth
                onClick={async () => {
                  const offlineCount = getOfflineAttendanceCount()
                  if (offlineCount === 0) {
                    toast.success('✅ No offline data to sync')
                    return
                  }

                  toast.loading(`📤 Syncing ${offlineCount} offline record(s)...`, { id: 'sync' })

                  try {
                    const result = await syncOfflineAttendance(apiMethods)

                    if (result.success) {
                      toast.success(`✅ Synced ${result.synced} record(s) successfully!`, { id: 'sync' })
                    } else {
                      toast.error(`⚠️ Synced ${result.synced}, Failed ${result.failed}`, { id: 'sync' })
                    }

                    // Reload attendance data
                    loadAttendance()
                  } catch (error) {
                    toast.error('❌ Sync failed: ' + error.message, { id: 'sync' })
                  }
                }}
              >
                Sync Offline Data
              </Button>
            </div>
          </Card>

          {/* Tips Card */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              💡 Verification Tips
            </h3>

            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <AlertCircle className="text-yellow-500 mr-2 mt-0.5 flex-shrink-0" size={14} />
                <span>Review low-confidence recognitions</span>
              </li>
              <li className="flex items-start">
                <AlertCircle className="text-yellow-500 mr-2 mt-0.5 flex-shrink-0" size={14} />
                <span>Update status for absent students</span>
              </li>
              <li className="flex items-start">
                <AlertCircle className="text-yellow-500 mr-2 mt-0.5 flex-shrink-0" size={14} />
                <span>Add remarks for special cases</span>
              </li>
              <li className="flex items-start">
                <AlertCircle className="text-yellow-500 mr-2 mt-0.5 flex-shrink-0" size={14} />
                <span>Verify before final submission</span>
              </li>
            </ul>
          </Card>
        </motion.div>
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Attendance Record Details"
        size="md"
      >
        {selectedRecord && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Student Name
                </div>
                <div className="font-medium text-lg text-gray-900 dark:text-white">
                  {selectedRecord.studentName}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Roll Number
                </div>
                <div className="font-medium text-lg">{selectedRecord.rollNumber}</div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Status
              </div>
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg ${selectedRecord.status === ATTENDANCE_STATUS.PRESENT
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                {selectedRecord.status === ATTENDANCE_STATUS.PRESENT ? (
                  <CheckCircle className="mr-2" size={20} />
                ) : (
                  <XCircle className="mr-2" size={20} />
                )}
                <span className="capitalize">{selectedRecord.status}</span>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Recognition Details
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Confidence:</span>
                  <span className="font-medium">
                    {selectedRecord.confidence ? `${Math.round(selectedRecord.confidence * 100)}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Method:</span>
                  <span className="font-medium">
                    {selectedRecord.recognized ? 'AI Recognition' : 'Manual Entry'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span className="font-medium">
                    {format(new Date(selectedRecord.timestamp), 'hh:mm:ss a')}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Class Information
              </div>
              <div className="flex space-x-4">
                <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {selectedRecord.className}
                </div>
                <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  Section {selectedRecord.section}
                </div>
              </div>
            </div>

            {selectedRecord.remarks && (
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Remarks
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {selectedRecord.remarks}
                </div>
              </div>
            )}

            <div className="flex space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="primary"
                onClick={() => {
                  setShowDetailsModal(false)
                  setShowEditModal(true)
                }}
                className="flex-1"
              >
                Edit Record
              </Button>

              <Button
                variant="secondary"
                onClick={() => setShowDetailsModal(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedRecord(null)
          setEditStatus('')
        }}
        title="Edit Attendance Record"
        size="sm"
      >
        {selectedRecord && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-school-purple flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">
                  {selectedRecord.studentName.charAt(0)}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedRecord.studentName}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Roll No: {selectedRecord.rollNumber} • {selectedRecord.className}
              </p>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Update Status
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setEditStatus(ATTENDANCE_STATUS.PRESENT)}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center ${editStatus === ATTENDANCE_STATUS.PRESENT
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-green-500'
                    } transition-colors`}
                >
                  <CheckCircle className={`mb-2 ${editStatus === ATTENDANCE_STATUS.PRESENT ? 'text-green-500' : 'text-gray-400'
                    }`} size={24} />
                  <span className="font-medium">Present</span>
                </button>

                <button
                  onClick={() => setEditStatus(ATTENDANCE_STATUS.ABSENT)}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center ${editStatus === ATTENDANCE_STATUS.ABSENT
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-red-500'
                    } transition-colors`}
                >
                  <XCircle className={`mb-2 ${editStatus === ATTENDANCE_STATUS.ABSENT ? 'text-red-500' : 'text-gray-400'
                    }`} size={24} />
                  <span className="font-medium">Absent</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Remarks (Optional)
              </label>
              <textarea
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                rows={3}
                placeholder="Add remarks for this update..."
              />
            </div>

            <div className="flex space-x-3">
              <Button
                variant="primary"
                onClick={handleEditAttendance}
                className="flex-1"
              >
                Save Changes
              </Button>

              <Button
                variant="secondary"
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedRecord(null)
                  setEditStatus('')
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AttendanceVerification