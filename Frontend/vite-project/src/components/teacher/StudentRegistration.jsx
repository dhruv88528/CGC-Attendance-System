import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../context/AuthContext'
import {
  Camera,
  UserPlus,
  Upload,
  CheckCircle,
  XCircle,
  User,
  BookOpen,
  Hash,
  Calendar,
  Phone,
  MapPin,
  Users
} from 'lucide-react'
import Button from '../common/Button'
import Input from '../common/Input'
import Card from '../common/Card'
import Modal from '../common/Modal'
import CameraCapture from '../common/CameraCapture'
import { apiMethods } from '../../utils/api'
import toast from 'react-hot-toast'

const StudentRegistration = () => {
  const { user } = useAuth()
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm()
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const [faceEncoding, setFaceEncoding] = useState(null)  // 512-D FaceNet encoding
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [capturedFaces, setCapturedFaces] = useState([])
  const fileInputRef = useRef(null)

  // Available classes and sections
  const classes = Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`)
  const sections = ['A', 'B', 'C', 'D', 'E']

  // Generate student ID
  const generateStudentId = () => {
    const year = new Date().getFullYear().toString().slice(-2)
    const random = Math.floor(1000 + Math.random() * 9000)
    return `STU${year}${random}`
  }

  // Handle image upload and process face encoding
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }

      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64Image = e.target.result
        setPreviewImage(base64Image)
        setValue('photo', file)

        // Generate FaceNet encoding for uploaded image
        try {
          toast.loading('Processing face...', { id: 'face-process' })

          // Use detectFaces to check if there is a face first and get encoding if available
          // Or use encodeFace directly if your API supports it. Based on API utils, encodeFace exists.
          const response = await apiMethods.encodeFace(base64Image)

          if (response.success && response.encoding) {
            setFaceEncoding(response.encoding)
            setCapturedFaces([{ id: 1, status: 'detected' }]) // Dummy face data for UI feedback
            toast.success('Face detected successfully!', { id: 'face-process' })
          } else {
            setFaceEncoding(null)
            setCapturedFaces([])
            toast.error('No face detected in uploaded photo. Please try another.', { id: 'face-process' })
          }
        } catch (error) {
          console.error('Face processing error:', error)
          toast.error('Failed to process face: ' + (error.message || 'Unknown error'), { id: 'face-process' })
          setFaceEncoding(null)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle camera capture - stores image and FaceNet encoding
  const handleCameraCapture = (data) => {
    if (data.image) {
      setPreviewImage(data.image.url || data.image)
      setCapturedFaces(data.faces || [])

      // Store FaceNet encoding if available (from AI service)
      if (data.encoding) {
        setFaceEncoding(data.encoding)  // 512-D FaceNet encoding
        console.log('FaceNet encoding captured:', data.encoding.length, 'dimensions')
      }

      setIsCameraOpen(false)
      // Toast is already shown by CameraCapture component
    }
  }

  // Handle face registration (unused in onSubmit but kept for modularity)
  const handleFaceRegistration = async (studentId) => {
    if (!previewImage) {
      toast.error('Please capture a photo first')
      return
    }

    try {
      // Convert base64 to blob
      const response = await fetch(previewImage)
      const blob = await response.blob()

      // Register face
      const result = await apiMethods.registerFace(studentId, blob)

      if (result.success) {
        toast.success('Face registered successfully')
        return true
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error('Face registration failed: ' + error.message)
      return false
    }
  }

  // Form submission
  const onSubmit = async (data) => {
    setIsSubmitting(true)

    try {
      // Validate face was captured
      if (!previewImage) {
        toast.error('Please capture student face photo first')
        setIsSubmitting(false)
        return
      }

      if (!faceEncoding) {
        toast.error('Face encoding not captured. Please retake the photo.')
        setIsSubmitting(false)
        return
      }

      // Generate student ID if not provided
      if (!data.studentId) {
        data.studentId = generateStudentId()
      }

      // Prepare student data with face information
      const studentData = {
        rollNumber: data.rollNumber,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : undefined,
        gender: data.gender,  // Already in correct format (Male/Female/Other)
        parentName: data.fatherName || data.motherName || '',
        parentPhone: data.contactNumber || '',
        address: data.address || '',
        classId: data.class,  // This will need to be mapped to actual class ID
        midDayMealEligible: true,
        faceImage: previewImage,       // Base64 image for viewing
        faceEncoding: faceEncoding,    // 512-D FaceNet encoding for matching
      }

      console.log('Registering student with FaceNet encoding:', faceEncoding.length, 'dimensions')

      // Submit to API - face data is included directly
      const response = await apiMethods.createStudent(studentData)

      if (response.success) {
        setRegistrationComplete(true)
        toast.success('Student registered successfully with face data!')
        reset()
        setPreviewImage(null)
        setFaceEncoding(null)
        setCapturedFaces([])
      } else {
        throw new Error(response.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Registration failed: ' + (error.message || 'Unknown error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Quick registration for multiple students
  const handleQuickRegistration = () => {
    // Generate sample data for quick registration
    const sampleData = {
      firstName: 'New',
      lastName: 'Student',
      class: 'Class 1',
      section: 'A',
      rollNumber: Math.floor(Math.random() * 50) + 1,
      gender: 'Male',
      dateOfBirth: '2015-01-01'
    }

    Object.keys(sampleData).forEach(key => {
      setValue(key, sampleData[key])
    })

    toast.success('Sample data loaded. Fill remaining details.')
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="page-title flex items-center">
          <UserPlus className="mr-3" size={32} />
          Student Registration
        </h1>
        <p className="page-subtitle">
          Register new students with facial recognition for automated attendance
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          <Card>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <User className="mr-2" size={20} />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    placeholder="Enter first name"
                    {...register('firstName', { required: 'First name is required' })}
                    error={errors.firstName?.message}
                    icon={User}
                    required
                  />

                  <Input
                    label="Last Name"
                    placeholder="Enter last name"
                    {...register('lastName', { required: 'Last name is required' })}
                    error={errors.lastName?.message}
                    icon={User}
                    required
                  />

                  <Input
                    label="Student ID (Optional)"
                    placeholder="Will be auto-generated"
                    {...register('studentId')}
                    icon={Hash}
                    helperText="Leave empty for auto-generation"
                  />

                  <Input
                    label="Roll Number"
                    type="number"
                    placeholder="Enter roll number"
                    {...register('rollNumber', {
                      required: 'Roll number is required',
                      min: { value: 1, message: 'Roll number must be positive' }
                    })}
                    error={errors.rollNumber?.message}
                    icon={Hash}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-4">
                      {['Male', 'Female', 'Other'].map(gender => (
                        <label key={gender} className="inline-flex items-center">
                          <input
                            type="radio"
                            value={gender}
                            {...register('gender', { required: 'Gender is required' })}
                            className="text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2">{gender}</span>
                        </label>
                      ))}
                    </div>
                    {errors.gender && (
                      <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                    )}
                  </div>

                  <Input
                    label="Date of Birth"
                    type="date"
                    {...register('dateOfBirth', { required: 'Date of birth is required' })}
                    error={errors.dateOfBirth?.message}
                    icon={Calendar}
                    required
                  />
                </div>
              </div>

              {/* Class Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <BookOpen className="mr-2" size={20} />
                  Class Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Class <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('class', { required: 'Class is required' })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select Class</option>
                      {classes.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                    {errors.class && (
                      <p className="mt-1 text-sm text-red-600">{errors.class.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Section <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('section', { required: 'Section is required' })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select Section</option>
                      {sections.map(sec => (
                        <option key={sec} value={sec}>Section {sec}</option>
                      ))}
                    </select>
                    {errors.section && (
                      <p className="mt-1 text-sm text-red-600">{errors.section.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Phone className="mr-2" size={20} />
                  Contact Information (Optional)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Father's Name"
                    placeholder="Enter father's name"
                    {...register('fatherName')}
                    icon={User}
                  />

                  <Input
                    label="Mother's Name"
                    placeholder="Enter mother's name"
                    {...register('motherName')}
                    icon={User}
                  />

                  <Input
                    label="Contact Number"
                    type="tel"
                    placeholder="Enter contact number"
                    {...register('contactNumber')}
                    icon={Phone}
                  />

                  <Input
                    label="Address"
                    placeholder="Enter address"
                    {...register('address')}
                    icon={MapPin}
                  />
                </div>
              </div>

              {/* Photo Capture */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Camera className="mr-2" size={20} />
                  Student Photo & Face Registration
                </h3>

                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Capture clear front-facing photo for facial recognition.
                    Ensure good lighting and no obstructions.
                  </p>

                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Photo Preview */}
                    <div className="flex-1">
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 h-64 flex flex-col items-center justify-center">
                        {previewImage ? (
                          <div className="relative">
                            <img
                              src={previewImage}
                              alt="Student preview"
                              className="w-48 h-48 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewImage(null)
                                setFaceEncoding(null)
                                setCapturedFaces([])
                              }}
                              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                            >
                              <XCircle size={20} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Camera className="text-gray-400 mb-2" size={48} />
                            <p className="text-gray-500 text-sm text-center">
                              No photo captured
                            </p>
                          </>
                        )}
                      </div>

                      {capturedFaces.length > 0 && (
                        <div className="mt-2 text-sm text-green-600 flex items-center">
                          <CheckCircle className="mr-1" size={16} />
                          {capturedFaces.length} face(s) detected
                        </div>
                      )}
                    </div>

                    {/* Capture Options */}
                    <div className="space-y-3">
                      <Button
                        type="button"
                        variant="primary"
                        icon={Camera}
                        onClick={() => setIsCameraOpen(true)}
                        fullWidth
                      >
                        Open Camera
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        icon={Upload}
                        onClick={() => fileInputRef.current.click()}
                        fullWidth
                      >
                        Upload Photo
                      </Button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />

                      <div className="text-xs text-gray-500">
                        <p>• Use front camera in good light</p>
                        <p>• Keep face centered and visible</p>
                        <p>• Remove glasses if possible</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="submit"
                  variant="primary"
                  loading={isSubmitting}
                  disabled={!previewImage}
                  icon={UserPlus}
                  className="flex-1"
                >
                  {isSubmitting ? 'Registering...' : 'Register Student'}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleQuickRegistration}
                  icon={Users}
                >
                  Quick Registration
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => reset()}
                >
                  Clear Form
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>

        {/* Right Column - Instructions & Stats */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Instructions Card */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📋 Registration Guidelines
            </h3>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <CheckCircle className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
                <span>Ensure all mandatory fields are filled</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
                <span>Capture clear front-facing photo with good lighting</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
                <span>Face should cover at least 60% of the frame</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
                <span>Verify information before submission</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
                <span>Contact admin for bulk registration</span>
              </li>
            </ul>
          </Card>

          {/* Stats Card */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📊 Registration Stats
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Today's Registrations</span>
                <span className="font-semibold">5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">This Month</span>
                <span className="font-semibold">42</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Students</span>
                <span className="font-semibold">256</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Face Registered</span>
                <span className="font-semibold text-green-600">98%</span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              ⚡ Quick Actions
            </h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  // Download sample CSV template
                  const template = 'Roll Number,First Name,Last Name,Gender,Date of Birth,Parent Name,Parent Phone,Parent Email,Address\n1001,Sample,Student,male,2015-01-15,Parent Name,9876543210,parent@email.com,123 Street';
                  const blob = new Blob([template], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'student_upload_template.csv';
                  a.click();
                  window.URL.revokeObjectURL(url);
                  toast.success('📥 Template downloaded! Fill it and email to admin for bulk import.');
                }}
              >
                Bulk Upload Students
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => window.location.href = '/students'}
              >
                View All Students
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => window.location.href = '/attendance'}
              >
                Take Attendance
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Camera Modal */}
      <Modal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        title="Capture Student Photo"
        subtitle="Position face within frame and click capture"
        size="xl"
      >
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setIsCameraOpen(false)}
          mode="photo"
          showPreview={true}
          purpose="registration"  // Only detect face, no matching
        />
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={registrationComplete}
        onClose={() => setRegistrationComplete(false)}
        title="🎉 Registration Successful!"
        size="sm"
      >
        <div className="text-center py-6">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-500" size={40} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Student Registered Successfully
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The student has been added to the system and face has been registered for attendance.
          </p>
          <div className="flex space-x-3">
            <Button
              variant="primary"
              onClick={() => {
                setRegistrationComplete(false)
                reset()
              }}
              fullWidth
            >
              Register Another Student
            </Button>
            <Button
              variant="secondary"
              onClick={() => setRegistrationComplete(false)}
              fullWidth
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default StudentRegistration