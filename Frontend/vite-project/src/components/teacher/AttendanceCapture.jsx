import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Camera,
  CheckCircle,
  XCircle,
  Users,
  Save,
  AlertCircle,
  Calendar,
  Clock,
  RefreshCw,
  UserCheck,
  UserX,
  Loader2,
  Wifi,
  WifiOff
} from 'lucide-react'
import Button from '../common/Button'
import Card from '../common/Card'
import CameraCapture from '../common/CameraCapture'
import { apiMethods } from '../../utils/api'
import {
  storeAttendanceOffline,
  getOfflineData,
  cacheClassesOffline,
  getCachedClasses,
  cacheStudentsOffline,
  getCachedStudents
} from '../../utils/offlineStorage'
import { ShimmerAttendancePage } from '../common/Shimmer'
import toast from 'react-hot-toast'

const AttendanceCapture = () => {
  // Step: 1 = Select Class, 2 = Capture, 3 = Review & Submit
  const [step, setStep] = useState(1)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedClass, setSelectedClass] = useState(null)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [students, setStudents] = useState([]) // Students shown in review (recognized/present)
  const [allStudentsForClass, setAllStudentsForClass] = useState([]) // All students in the class
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [classes, setClasses] = useState([])
  const [imageConfirmed, setImageConfirmed] = useState(false)

  // Offline mode state
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Monitor network status and auto-sync when back online
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      toast.success('Back online!')

      // Auto-sync offline data when back online
      const { syncOfflineAttendance, getOfflineAttendanceCount } = await import('../../utils/offlineStorage')
      const offlineCount = getOfflineAttendanceCount()

      if (offlineCount > 0) {
        toast.loading(`📤 Auto-syncing ${offlineCount} offline record(s)...`, { id: 'auto-sync' })

        try {
          const result = await syncOfflineAttendance(apiMethods)

          if (result.success) {
            toast.success(`✅ Synced ${result.synced} record(s)!`, { id: 'auto-sync' })
          } else {
            toast.error(`⚠️ Synced ${result.synced}, Failed ${result.failed}`, { id: 'auto-sync' })
          }
        } catch (error) {
          toast.error('❌ Auto-sync failed', { id: 'auto-sync' })
        }
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setIsOfflineMode(true)
      toast.error('You are offline. Switching to offline mode.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Fetch classes on mount and when offline mode changes
  useEffect(() => {
    fetchClasses()
  }, [isOfflineMode, isOnline])

  const fetchClasses = async () => {
    setIsLoading(true)
    try {
      // If offline, use cached data
      if (isOfflineMode || !isOnline) {
        const cachedClasses = getCachedClasses()
        if (cachedClasses.length > 0) {
          setClasses(cachedClasses)
          console.log('[Offline] Loaded', cachedClasses.length, 'classes from cache')
        } else {
          toast.error('No cached classes available. Go online first to load data.')
          setClasses([])
        }
        setIsLoading(false)
        return
      }

      // Online - fetch from API
      const response = await apiMethods.getClasses()
      if (response.success && response.data) {
        setClasses(response.data)
        // Cache for offline use
        cacheClassesOffline(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error)
      // Try to use cached data on error
      const cachedClasses = getCachedClasses()
      if (cachedClasses.length > 0) {
        setClasses(cachedClasses)
        toast('Using cached classes', { icon: '📴' })
      } else {
        setClasses([])
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch students when class is selected
  useEffect(() => {
    if (selectedClassId) {
      fetchStudentsByClass(selectedClassId)
      const cls = classes.find(c => c._id === selectedClassId)
      setSelectedClass(cls)
    }
  }, [selectedClassId, classes])

  const fetchStudentsByClass = async (classId) => {
    try {
      // If offline, use cached data
      if (isOfflineMode || !isOnline) {
        const cachedStudents = getCachedStudents(classId)
        if (cachedStudents.length > 0) {
          // Save ALL students
          setAllStudentsForClass(cachedStudents)
          
          // Initialize all students as PENDING (not yet marked)
          const studentList = cachedStudents.map(s => ({
            _id: s._id ? (typeof s._id === 'object' ? s._id.toString() : String(s._id)) : undefined,
            firstName: s.firstName,
            lastName: s.lastName || '',
            rollNumber: s.rollNumber,
            class: s.class,
            status: 'pending',
            confidence: 0
          }))
          setStudents(studentList)
          console.log('[Offline] Loaded', studentList.length, 'students from cache')
        } else {
          toast.error('No cached students for this class. Go online first to load data.')
          setStudents([])
          setAllStudentsForClass([])
        }
        return
      }

      // Online - fetch from API
      const response = await apiMethods.getStudentsByClass(classId)
      // Handle different response formats
      let studentData = []
      if (response.success && response.data) {
        studentData = Array.isArray(response.data) ? response.data :
          response.data.students ? response.data.students : []
      } else if (Array.isArray(response)) {
        studentData = response
      }

      // Cache for offline use
      if (studentData.length > 0) {
        cacheStudentsOffline(classId, studentData)
      }

      // Save ALL students for the class (for pending → absent conversion later)
      setAllStudentsForClass(studentData)

      // Initialize all students as PENDING (not yet marked)
      const studentList = studentData.map(s => {
        // Explicitly ensure _id is preserved and converted to string
        const studentId = s._id ? (typeof s._id === 'object' ? s._id.toString() : String(s._id)) : undefined
        
        return {
          _id: studentId,
          firstName: s.firstName,
          lastName: s.lastName || '',
          rollNumber: s.rollNumber,
          class: s.class,
          status: 'pending',
          confidence: 0
        }
      })
      
      console.log('📚 Students initialized:', {
        total: studentList.length,
        students: studentList.map(s => ({ id: s._id, name: `${s.firstName} ${s.lastName}`, status: s.status }))
      })
      
      setStudents(studentList)
    } catch (error) {
      console.error('Failed to fetch students:', error)

      // Try to use cached data on error
      const cachedStudents = getCachedStudents(classId)
      if (cachedStudents.length > 0) {
        const studentList = cachedStudents.map(s => ({
          ...s,
          status: 'present',
          confidence: 0
        }))
        setStudents(studentList)
        toast('Using cached students', { icon: '📴' })
        return
      }

      // If no cache, try fetching all students as fallback
      try {
        const allStudents = await apiMethods.getStudents()
        let studentData = []
        if (allStudents.success && allStudents.data) {
          studentData = Array.isArray(allStudents.data) ? allStudents.data :
            allStudents.data.students ? allStudents.data.students : []
        }
        const studentList = studentData
          .filter(s => s.class?._id === classId || s.class === classId)
          .map(s => ({
            ...s,
            status: 'present',
            confidence: 0
          }))
        setStudents(studentList)
      } catch (e) {
        setStudents([])
      }
    }
  }

  // Handle camera capture
  const handleCapture = async (data) => {
    if (data?.image) {
      setCapturedImage(data.image.url || data.image)
      setIsCameraOpen(false)
      setImageConfirmed(false) // Reset confirmation when new image captured
    }
  }



  // Confirm image has students
  const handleConfirmImage = async () => {
    if (!imageConfirmed) {
      toast.error('Please confirm that students are visible in the image')
      return
    }
    await processAttendance(capturedImage)
  }

  // Process captured image with AI (or manual mode if offline)
  const processAttendance = async (imageData) => {
    setIsProcessing(true)
    try {
      // Get image as base64 string
      const imageBase64 = typeof imageData === 'string' ? imageData : imageData.url || imageData

      // OFFLINE MODE: Skip AI, go straight to manual attendance
      if (isOfflineMode || !isOnline) {
        toast('📴 Offline Mode: Please mark attendance manually', { icon: 'ℹ️' })

        // All students start as "present" - teacher will manually mark
        setStudents(prev => prev.map(s => ({
          ...s,
          status: 'present', // Default to present, teacher can toggle
          confidence: 0
        })))

        setStep(3)
        setIsProcessing(false)
        return
      }

      // ONLINE MODE: Call AI recognition API
      const result = await apiMethods.recognizeAttendance({
        classId: selectedClassId,
        imageData: imageBase64,
        mode: 'online'
      })

      if (result.success && result.data) {
        const recognitions = result.data.recognitions || result.data.recognized || []
        const errors = result.data.errors || []

        // Get previously present students from current state
        const previouslyPresentStudents = students.filter(s => s.status === 'present')
        const previouslyPresentIds = previouslyPresentStudents.map(s => s._id?.toString())

        // Update local state - PRESERVE previous present, add new recognized
        const updatedStudents = allStudentsForClass.map(student => {
          // Ensure consistent ID format
          const studentIdStr = student._id ? (typeof student._id === 'object' ? student._id.toString() : String(student._id)) : undefined
          
          // Keep previously present students as present
          if (previouslyPresentIds.includes(studentIdStr)) {
            const existing = previouslyPresentStudents.find(s => {
              const sId = s._id ? (typeof s._id === 'object' ? s._id.toString() : String(s._id)) : undefined
              return sId === studentIdStr
            })
            return existing || { 
              ...student, 
              _id: studentIdStr,
              status: 'present', 
              confidence: 0 
            }
          }

          // Check if newly recognized
          const recognition = recognitions.find(r => {
            const recogId = r.studentId ? (typeof r.studentId === 'object' ? r.studentId.toString() : String(r.studentId)) : undefined
            return recogId === studentIdStr || recogId === student._id
          })

          if (recognition) {
            return {
              ...student,
              _id: studentIdStr,
              status: 'present',
              confidence: recognition.confidence || recognition.confidenceScore * 100 || 0
            }
          }

          // Not recognized - keep as pending (NOT saved to DB yet)
          return { 
            ...student, 
            _id: studentIdStr,
            status: 'pending', 
            confidence: 0 
          }
        })

        setStudents(updatedStudents)

        // Show results - DON'T save to DB yet
        const newlyRecognizedCount = recognitions.filter(r => {
          const recogId = r.studentId?.toString() || r.studentId
          return !previouslyPresentIds.includes(recogId)
        }).length
        const presentCount = updatedStudents.filter(s => s.status === 'present').length
        const pendingCount = updatedStudents.filter(s => s.status === 'pending').length

        console.log('🎯 After processing:', {
          total: updatedStudents.length,
          presentCount,
          pendingCount,
          students: updatedStudents.map(s => ({ id: s._id, name: `${s.firstName} ${s.lastName}`, status: s.status, confidence: s.confidence }))
        })

        if (newlyRecognizedCount > 0) {
          toast.success(`✅ ${newlyRecognizedCount} new recognized! Total: ${presentCount} present, ${pendingCount} pending`, { id: 'recognition-result' })
        } else if (recognitions.length > 0) {
          toast('These students are already marked present', { icon: 'ℹ️' })
        } else if (errors.length > 0) {
          toast.error(errors[0], { id: 'recognition-result' })
        } else {
          toast('No faces recognized. Try again.', { icon: 'ℹ️', id: 'recognition-result' })
        }

        setStep(3)
      } else {
        // AI service failed
        const errorMsg = result.message || result.error || 'Face recognition failed'
        toast.error(errorMsg, { id: 'recognition-result' })

        // Initialize students as pending if not already
        if (students.length === 0) {
          setStudents(allStudentsForClass.map(s => ({ ...s, status: 'pending', confidence: 0 })))
        }
        setStep(3)
      }
    } catch (error) {
      console.error('Recognition error:', error)
      toast.error('Failed to process image: ' + (error.message || 'Please try again'), { id: 'recognition-result' })

      // Initialize students as pending if not already
      if (students.length === 0) {
        const studentList = allStudentsForClass.map(s => ({
          _id: s._id ? (typeof s._id === 'object' ? s._id.toString() : String(s._id)) : undefined,
          firstName: s.firstName,
          lastName: s.lastName || '',
          rollNumber: s.rollNumber,
          class: s.class,
          status: 'pending',
          confidence: 0
        }))
        setStudents(studentList)
      }
      setStep(3)
    } finally {
      setIsProcessing(false)
    }
  }

  // Toggle student attendance status (pending → present → absent → pending)
  const toggleStudentStatus = (studentId) => {
    console.log('🔄 Toggling student status for ID:', studentId)
    
    setStudents(prev => {
      const updated = prev.map(student => {
        // Ensure comparison works with both string and object IDs
        const currentId = typeof student._id === 'object' ? student._id.toString() : student._id
        const targetId = typeof studentId === 'object' ? studentId.toString() : studentId
        
        if (currentId === targetId) {
          const nextStatus = student.status === 'pending' ? 'present'
            : student.status === 'present' ? 'absent'
              : 'present'
          
          console.log(`  ✅ Toggled ${student.firstName}: ${student.status} → ${nextStatus}`)
          
          // Ensure _id is preserved as string
          return { 
            ...student, 
            _id: typeof student._id === 'object' ? student._id.toString() : student._id,
            status: nextStatus 
          }
        }
        
        // Ensure _id is preserved as string for all students
        return {
          ...student,
          _id: typeof student._id === 'object' ? student._id.toString() : student._id
        }
      })
      
      console.log('Updated students:', updated.map(s => ({ id: s._id, name: s.firstName, status: s.status })))
      return updated
    })
  }

  // Final Submit - Save ALL students (present as present, pending as absent)
  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Build final attendance - present stay present, pending become absent
      const finalAttendance = students.map(student => {
        // Ensure _id is a valid string
        const studentId = student._id ? (typeof student._id === 'object' ? student._id.toString() : String(student._id)) : null
        
        if (!studentId) {
          console.error('❌ Student has no valid ID:', student)
          throw new Error(`Student ${student.firstName} has no valid ID`)
        }
        
        return {
          studentId: studentId,
          studentName: `${student.firstName} ${student.lastName || ''}`.trim(),
          rollNumber: student.rollNumber,
          status: student.status === 'present' ? 'present' : 'absent',
          confidenceScore: student.confidence || 0
        }
      })

      // Validate data
      if (finalAttendance.some(a => !a.studentId)) {
        toast.error('❌ Some students have invalid IDs. Please try again.')
        setIsSubmitting(false)
        return
      }

      // DEBUG: Log what we're sending
      console.log('📤 Sending attendance data:', {
        total: finalAttendance.length,
        studentIds: finalAttendance.map(s => ({ id: s.studentId, name: s.studentName, status: s.status })),
        classId: selectedClassId,
        date: date
      })

      const presentCount = finalAttendance.filter(s => s.status === 'present').length
      const absentCount = finalAttendance.filter(s => s.status === 'absent').length

      if (finalAttendance.length === 0) {
        toast.error('No students to submit')
        setIsSubmitting(false)
        return
      }

      const attendancePayload = {
        classId: selectedClassId,
        className: selectedClass?.name || `Class ${selectedClass?.grade}`,
        section: selectedClass?.section,
        date: date,
        mode: isOfflineMode || !isOnline ? 'offline' : 'online',
        attendanceData: finalAttendance,
        timestamp: Date.now()
      }

      // OFFLINE MODE: Store locally
      if (isOfflineMode || !isOnline) {
        storeAttendanceOffline(attendancePayload)
        toast.success(`📴 Saved offline! ${presentCount} present, ${absentCount} absent`)
        resetForm()
        return
      }

      // ONLINE MODE: Send ALL students to server in ONE call
      const response = await apiMethods.markAttendance(attendancePayload)

      console.log('📥 Backend Response:', response)

      if (response.success) {
        console.log('✅ Attendance successfully marked:', {
          success: response.data?.success,
          failed: response.data?.failed,
          details: response.data?.details
        })
        toast.success(`✅ Attendance saved! ${presentCount} present, ${absentCount} absent`)
      } else {
        console.warn('⚠️ Backend returned error:', response.message)
        storeAttendanceOffline(attendancePayload)
        toast.success('📴 Saved offline - will sync later')
      }

      // Reset form
      resetForm()
    } catch (error) {
      console.error('Submit error:', error)

      // On error, try to store offline
      const finalAttendance = students.map(student => {
        const studentId = student._id ? (typeof student._id === 'object' ? student._id.toString() : String(student._id)) : null
        return {
          studentId: studentId,
          studentName: `${student.firstName} ${student.lastName || ''}`.trim(),
          rollNumber: student.rollNumber,
          status: student.status === 'present' ? 'present' : 'absent',
          confidenceScore: student.confidence || 0
        }
      })

      const attendancePayload = {
        classId: selectedClassId,
        className: selectedClass?.name || `Class ${selectedClass?.grade}`,
        section: selectedClass?.section,
        date: date,
        mode: 'offline',
        attendanceData: finalAttendance,
        timestamp: Date.now()
      }
      storeAttendanceOffline(attendancePayload)
      toast.success('📴 Saved offline - will sync when connected')

      resetForm()
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form helper
  const resetForm = () => {
    setStep(1)
    setSelectedClassId('')
    setSelectedClass(null)
    setCapturedImage(null)
    setStudents([])
    setAllStudentsForClass([])
    setImageConfirmed(false)
  }

  // Complete Attendance - converts all pending to absent AND sends notifications
  const completeAttendance = async () => {
    // First, convert pending to absent
    const finalStudents = students.map(student => ({
      ...student,
      status: student.status === 'pending' ? 'absent' : student.status
    }))
    setStudents(finalStudents)

    // Show loading toast
    toast.loading('Preparing WhatsApp notifications...', { id: 'notify-parents' })

    try {
      // Prepare notification data for ALL students (server will fetch parentPhone from DB)
      const notificationData = finalStudents.map(student => ({
        studentId: student._id,
        studentName: `${student.firstName} ${student.lastName || ''}`.trim(),
        status: student.status,
        className: selectedClass?.name || `Class ${selectedClass?.grade}`,
        date: date
      }))

      // Call API to prepare notifications
      const response = await apiMethods.sendAttendanceNotifications({
        classId: selectedClassId,
        className: selectedClass?.name || `Class ${selectedClass?.grade}`,
        date: date,
        attendanceData: notificationData
      })

      if (response.success && response.data) {
        const { sent, failed, results } = response.data

        if (sent > 0) {
          // Get successful results with WhatsApp links
          const successfulResults = results.filter(r => r.success && r.whatsappLink)

          toast.success(`✅ Attendance complete! ${sent} WhatsApp messages ready.`, { id: 'notify-parents' })

          if (successfulResults.length > 0) {
            // Ask user if they want to open WhatsApp
            const openWhatsApp = window.confirm(
              `Open WhatsApp to send ${successfulResults.length} message(s) to parents?\n\nClick OK to open WhatsApp for each parent.`
            )

            if (openWhatsApp) {
              // Open each WhatsApp link with a small delay
              successfulResults.forEach((result, index) => {
                setTimeout(() => {
                  window.open(result.whatsappLink, '_blank')
                }, index * 1500) // 1.5 second delay between each
              })
            }
          }
        } else if (failed > 0) {
          toast.success(`✅ Attendance complete! (${failed} parents have no phone number)`, { id: 'notify-parents' })
        } else {
          toast.success('✅ Attendance marked complete!', { id: 'notify-parents' })
        }
      } else {
        toast.success('✅ Attendance marked complete!', { id: 'notify-parents' })
      }
    } catch (error) {
      console.error('Failed to send notifications:', error)
      toast.success('✅ Attendance marked complete! (Notifications may be delayed)', { id: 'notify-parents' })
    }
  }

  const presentCount = students.filter(s => s.status === 'present').length
  const absentCount = students.filter(s => s.status === 'absent').length
  const pendingCount = students.filter(s => s.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-6 md:mb-8 overflow-x-auto">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {[
            { num: 1, label: 'Select Class' },
            { num: 2, label: 'Capture Photo' },
            { num: 3, label: 'Review & Submit' }
          ].map((s, i) => (
            <React.Fragment key={s.num}>
              <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full font-bold text-sm sm:text-base ${step >= s.num ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                {step > s.num ? <CheckCircle size={16} /> : s.num}
              </div>
              <span className={`text-xs sm:text-sm font-medium hidden sm:inline ${step >= s.num ? 'text-blue-600' : 'text-gray-500'}`}>
                {s.label}
              </span>
              {i < 2 && <div className={`w-8 sm:w-16 h-1 ${step > s.num ? 'bg-blue-500' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step 1: Select Class */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
                <Calendar className="mr-2" size={20} />
                Select Class & Date
              </h2>

              {/* Network Status & Mode Toggle */}
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                {/* Network Status */}
                <div className={`flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                  {isOnline ? <Wifi size={14} className="mr-1" /> : <WifiOff size={14} className="mr-1" />}
                  {isOnline ? 'Online' : 'Offline'}
                </div>

                {/* Mode Toggle */}
                <label className="flex items-center cursor-pointer">
                  <span className="mr-2 text-xs sm:text-sm font-medium text-gray-700 hidden sm:inline">
                    {isOfflineMode ? '📴 Offline Mode' : '🌐 Online Mode'}
                  </span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isOfflineMode}
                      onChange={(e) => {
                        setIsOfflineMode(e.target.checked)
                        if (e.target.checked) {
                          toast('Offline mode enabled - AI recognition disabled', { icon: '📴' })
                        } else {
                          toast.success('Online mode - AI recognition enabled')
                        }
                      }}
                      className="sr-only"
                    />
                    <div className={`w-10 h-6 rounded-full transition-colors ${isOfflineMode ? 'bg-orange-500' : 'bg-blue-500'
                      }`}></div>
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isOfflineMode ? 'translate-x-4' : ''
                      }`}></div>
                  </div>
                </label>
              </div>
            </div>

            {isLoading ? (
              <ShimmerAttendancePage />
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Class *
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                  >
                    <option value="">Choose a class</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name || `Class ${cls.grade}`} - Section {cls.section}
                      </option>
                    ))}
                  </select>
                  {classes.length === 0 && (
                    <p className="text-yellow-600 text-sm mt-2">
                      No classes found. Admin needs to create classes first.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date <span className="text-gray-400 text-xs">(Today only)</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    readOnly
                    disabled
                    className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  />
                </div>
              </div>
            )}

            {selectedClass && students.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800">
                  <strong>{selectedClass.name || `Class ${selectedClass.grade}`} - {selectedClass.section}</strong> has <strong>{students.length} students</strong>
                </p>
              </div>
            )}

            {selectedClass && students.length === 0 && (
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <p className="text-yellow-800">
                  <AlertCircle className="inline mr-2" size={16} />
                  No students in this class. Add students first.
                </p>
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <Button
                variant="primary"
                icon={Camera}
                onClick={() => setStep(2)}
                disabled={!selectedClassId || students.length === 0}
              >
                Next: Capture Photo
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Step 2: Capture Photo */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <Camera className="mr-2" size={24} />
              Capture Classroom Photo
            </h2>

            <div className="text-center">
              {!capturedImage && !isProcessing && (
                <>
                  <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center mb-6">
                    <div className="text-center">
                      <Camera className="mx-auto text-gray-400 mb-4" size={48} />
                      <p className="text-gray-600">Click button below to open camera</p>
                    </div>
                  </div>
                  <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      icon={Camera}
                      onClick={() => setIsCameraOpen(true)}
                    >
                      Open Camera
                    </Button>
                  </div>
                </>
              )}

              {isProcessing && (
                <div className="py-12">
                  <RefreshCw className="animate-spin mx-auto text-blue-500 mb-4" size={48} />
                  <p className="text-gray-600">Processing image with AI...</p>
                  <p className="text-sm text-gray-500 mt-2">Recognizing faces...</p>
                </div>
              )}

              {capturedImage && !isProcessing && (
                <div>
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="max-w-full h-64 object-contain mx-auto rounded-lg mb-4"
                  />

                  {/* Confirmation Checkbox */}
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={imageConfirmed}
                        onChange={(e) => setImageConfirmed(e.target.checked)}
                        className="w-5 h-5 text-blue-600 mr-3"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        ✓ I confirm that students are clearly visible in this image
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      icon={RefreshCw}
                      onClick={() => {
                        setCapturedImage(null)
                        setImageConfirmed(false)
                        setIsCameraOpen(true)
                      }}
                    >
                      Retake Photo
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleConfirmImage}
                      disabled={!imageConfirmed}
                    >
                      Confirm & Process
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Camera Modal */}
          {isCameraOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl max-w-2xl w-full overflow-hidden">
                <CameraCapture
                  onCapture={handleCapture}
                  onClose={() => setIsCameraOpen(false)}
                  mode="photo"
                />
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Step 3: Review & Submit */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <Card className="p-3 text-center">
              <Users className="mx-auto text-blue-500 mb-1" size={20} />
              <div className="text-xl font-bold">{students.length}</div>
              <div className="text-xs text-gray-600">Total</div>
            </Card>
            <Card className="p-3 text-center bg-green-50">
              <UserCheck className="mx-auto text-green-500 mb-1" size={20} />
              <div className="text-xl font-bold text-green-600">{presentCount}</div>
              <div className="text-xs text-gray-600">Present</div>
            </Card>
            <Card className="p-3 text-center bg-orange-50">
              <Clock className="mx-auto text-orange-500 mb-1" size={20} />
              <div className="text-xl font-bold text-orange-600">{pendingCount}</div>
              <div className="text-xs text-gray-600">Pending</div>
            </Card>
            <Card className="p-3 text-center bg-red-50">
              <UserX className="mx-auto text-red-500 mb-1" size={20} />
              <div className="text-xl font-bold text-red-600">{absentCount}</div>
              <div className="text-xs text-gray-600">Absent</div>
            </Card>
          </div>

          {/* Student List - Show ALL students with their current status */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                All Students - Review & Adjust
              </h2>
              <span className="text-sm text-gray-500">
                {selectedClass?.name || 'Class'} - {selectedClass?.section} | {date}
              </span>
            </div>

            {students.length === 0 ? (
              <div className="text-center py-8">
                <UserX className="mx-auto text-gray-400 mb-3" size={40} />
                <p className="text-gray-600 font-medium">No students in this class</p>
              </div>
            ) : (
              <>
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                  💡 <strong>Click on a student row to toggle status:</strong> Present ↔ Absent
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {students.map((student) => (
                    <div
                      key={student._id}
                      onClick={() => toggleStudentStatus(student._id)}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        student.status === 'present'
                          ? 'border-green-200 bg-green-50 hover:bg-green-100'
                          : 'border-red-200 bg-red-50 hover:bg-red-100'
                      }`}
                    >
                      <div className="flex items-center flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                          student.status === 'present' ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {student.status === 'present' ? (
                            <CheckCircle className="text-white" size={20} />
                          ) : (
                            <XCircle className="text-white" size={20} />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-sm text-gray-600">
                            Roll: {student.rollNumber}
                            {student.confidence > 0 && student.status === 'present' && (
                              <span className="ml-2 text-green-600">
                                ({Math.round(student.confidence)}% confidence)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        student.status === 'present'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {student.status === 'present' ? 'Present' : 'Absent'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">
                    📋 <strong>Summary:</strong> <span className="text-green-600 font-bold">{presentCount} Present</span>
                    {' '}|{' '}
                    <span className="text-red-600 font-bold">{absentCount} Absent</span>
                    {pendingCount > 0 && <span className="text-orange-600 font-bold"> | {pendingCount} Pending (will be Absent)</span>}
                  </p>
                </div>
              </>
            )}

            <div className="mt-6 flex flex-wrap gap-3 justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setStep(2)
                  setCapturedImage(null)
                }}
              >
                ← Add More Students
              </Button>

              <Button
                variant="primary"
                icon={isSubmitting ? Loader2 : Save}
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={presentCount === 0 ? 'bg-red-500 hover:bg-red-600' : ''}
              >
                {isSubmitting ? 'Submitting...' : `Submit (${presentCount} Present, ${allStudentsForClass.length - presentCount} Absent)`}
              </Button>
            </div>

            {presentCount === 0 && (
              <p className="mt-3 text-center text-sm text-orange-600">
                ⚠️ No students recognized. Take photo again.
              </p>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  )
}

export default AttendanceCapture