import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCamera } from '../../hooks/useCamera'
import { CAMERA_MODES, RECOGNITION_MODES } from '../../constants'
import {
  Camera,
  Video,
  Scan,
  User,
  Users,
  CheckCircle,
  XCircle,
  RefreshCw,
  Maximize2,
  Minimize2,
  Settings,
  Zap,
  ZapOff,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

const CameraCapture = ({
  onCapture,
  onClose,
  mode = CAMERA_MODES.PHOTO,
  recognitionMode = RECOGNITION_MODES.ONLINE,
  showPreview = true,
  maxFaces = 10,
  className = '',
  autoCapture = false,
  captureInterval = 2000,
  purpose = 'registration'  // 'registration' or 'attendance'
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [detectedFaces, setDetectedFaces] = useState([])
  const [recognitionResults, setRecognitionResults] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [faceValidationError, setFaceValidationError] = useState(null)
  const [cameraSettings, setCameraSettings] = useState({
    facingMode: 'user',
    quality: 1.0,  // Maximum quality for best clarity
    flash: false,
    grid: false,   // Grid off by default for cleaner view
    countdown: 0   // No countdown for instant capture
  })

  const videoContainerRef = useRef(null)
  const captureIntervalRef = useRef(null)

  const {
    videoRef,
    canvasRef,
    isActive,
    isRecording,
    capturedImages,
    error,
    permission,
    startCamera,
    stopCamera,
    capturePhoto,
    startRecording,
    stopRecording,
    switchCamera,
    clearCapturedImages,
    getCameraDevices,
    setCameraDevice
  } = useCamera({
    mode,
    facingMode: cameraSettings.facingMode,
    quality: cameraSettings.quality
  })

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      await startCamera()
    }

    initCamera()

    return () => {
      stopCamera()
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current)
      }
    }
  }, [])

  // Auto capture for scan mode
  useEffect(() => {
    if (mode === CAMERA_MODES.SCAN && autoCapture && isActive) {
      captureIntervalRef.current = setInterval(async () => {
        const image = await capturePhoto()
        if (image) {
          processImage(image)
        }
      }, captureInterval)
    }

    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current)
      }
    }
  }, [mode, autoCapture, isActive, captureInterval])

  // Convert blob to base64
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // Process captured image for face detection
  const processImage = async (imageData) => {
    setIsProcessing(true)
    setFaceValidationError(null)

    try {
      // Import API
      const { apiMethods } = await import('../../utils/api')

      // Convert blob to base64 if needed
      let base64Image
      if (imageData.blob) {
        base64Image = await blobToBase64(imageData.blob)
      } else if (typeof imageData === 'string') {
        base64Image = imageData
      } else if (imageData.url && imageData.url.startsWith('data:')) {
        base64Image = imageData.url
      } else {
        throw new Error('Invalid image format')
      }

      console.log('Sending image to AI service, length:', base64Image.length)

      // Call AI service to detect face
      const detectResponse = await apiMethods.detectFaces(base64Image)

      if (!detectResponse.success) {
        // Face detection failed - show error
        setFaceValidationError(detectResponse.message || 'No human face detected')
        toast.error(detectResponse.message || 'Human face required - please face the camera directly')
        setDetectedFaces([])
        return
      }

      // Face detected successfully
      if (detectResponse.faces === 0) {
        setFaceValidationError('No face detected - please position your face in the camera')
        toast.error('No face detected - please position your face in the camera')
        return
      }

      // For REGISTRATION: Just detect face, get encoding, no matching
      if (purpose === 'registration') {
        // Get face encoding for storage
        const encodeResponse = await apiMethods.encodeFace(base64Image)

        if (!encodeResponse.success) {
          setFaceValidationError(encodeResponse.error || 'Failed to process face')
          toast.error(encodeResponse.error || 'Failed to process face - please try again')
          return
        }

        // Success! Return image and encoding (no matching done)
        const faceData = {
          id: 1,
          confidence: 0.99,
          status: 'detected',
          encoding: encodeResponse.encoding  // 512-D FaceNet encoding
        }

        setDetectedFaces([faceData])

        if (onCapture) {
          onCapture({
            image: { url: base64Image },  // Use base64 as the image URL
            encoding: encodeResponse.encoding,  // 512-D encoding for DB storage
            faces: [faceData],
            mode: recognitionMode,
            timestamp: Date.now(),
            purpose: 'registration'
          })

          toast.success('Face captured successfully! Ready for registration.')
        }
      }
      // For ATTENDANCE: Detect and verify/match face
      else if (purpose === 'attendance') {
        // This will be handled differently - matching against stored encodings
        // The actual matching happens in the backend
        const faceData = [{
          id: 1,
          confidence: detectResponse.confidence || 0.95,
          status: 'detected'
        }]

        setDetectedFaces(faceData)

        if (onCapture) {
          onCapture({
            image: { url: base64Image },
            faces: faceData,
            mode: recognitionMode,
            timestamp: Date.now(),
            purpose: 'attendance'
          })
        }
      }

    } catch (error) {
      console.error('Processing error:', error)
      const errorMessage = error?.message || 'Face detection failed'
      setFaceValidationError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }


  const handleCapture = async () => {
    if (!isActive) {
      toast.error('Camera not ready')
      return
    }

    if (mode === CAMERA_MODES.VIDEO && !isRecording) {
      startRecording()
      return
    }

    if (mode === CAMERA_MODES.VIDEO && isRecording) {
      stopRecording()
      return
    }

    // Handle photo capture
    if (cameraSettings.countdown > 0) {
      startCountdown()
    } else {
      captureAndProcess()
    }
  }

  const captureAndProcess = async () => {
    const image = await capturePhoto()
    if (image) {
      processImage(image)
    }
  }

  const startCountdown = () => {
    let count = cameraSettings.countdown

    const countdownInterval = setInterval(() => {
      if (count > 0) {
        toast(`${count}...`, { icon: '⏱️', duration: 1000 })
        count--
      } else {
        clearInterval(countdownInterval)
        captureAndProcess()
      }
    }, 1000)
  }

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return

    if (!isFullscreen) {
      if (videoContainerRef.current.requestFullscreen) {
        videoContainerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }

    setIsFullscreen(!isFullscreen)
  }

  const handleFaceSelect = (face) => {
    setRecognitionResults(prev => {
      const exists = prev.find(f => f.id === face.id)
      if (exists) {
        return prev.filter(f => f.id !== face.id)
      } else {
        return [...prev, face]
      }
    })
  }

  const toggleFlash = () => {
    setCameraSettings(prev => ({
      ...prev,
      flash: !prev.flash
    }))
    toast(cameraSettings.flash ? 'Flash off' : 'Flash on', { icon: '⚡' })
  }

  const toggleGrid = () => {
    setCameraSettings(prev => ({
      ...prev,
      grid: !prev.grid
    }))
  }

  const handleModeChange = (newMode) => {
    if (newMode === mode) return

    if (newMode === CAMERA_MODES.VIDEO) {
      toast('Switching to video mode', { icon: '🎥' })
    } else if (newMode === CAMERA_MODES.SCAN) {
      toast('Switching to scan mode', { icon: '🔍' })
    } else {
      toast('Switching to photo mode', { icon: '📸' })
    }

    // Update mode logic would go here
  }

  const getCameraModeIcon = () => {
    switch (mode) {
      case CAMERA_MODES.VIDEO:
        return <Video size={20} />
      case CAMERA_MODES.SCAN:
        return <Scan size={20} />
      default:
        return <Camera size={20} />
    }
  }

  const getRecognitionModeIcon = () => {
    switch (recognitionMode) {
      case RECOGNITION_MODES.OFFLINE:
        return <ZapOff size={20} />
      case RECOGNITION_MODES.HYBRID:
        return <RefreshCw size={20} />
      default:
        return <Zap size={20} />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`relative rounded-2xl overflow-hidden bg-gray-900 ${className}`}
      ref={videoContainerRef}
    >
      {/* Camera View - aspect-[3/4] on mobile, aspect-video on md+ */}
      <div className="relative aspect-[3/4] sm:aspect-[4/3] md:aspect-video bg-black max-h-[60vh] md:max-h-none">
        {/* Video Feed - ALWAYS rendered so ref is available */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${!isActive ? 'opacity-0' : 'opacity-100'}`}
        />

        {/* Loading/Error Overlay */}
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Camera size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-400">
                {permission === 'denied'
                  ? 'Camera permission denied'
                  : 'Initializing camera...'
                }
              </p>
              {permission === 'denied' && (
                <button
                  onClick={startCamera}
                  className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Grant Permission
                </button>
              )}
            </div>
          </div>
        )}

        {/* Active Camera Content */}
        {isActive && (
          <>

            {/* Camera Grid */}
            {cameraSettings.grid && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="grid grid-cols-3 grid-rows-3 h-full">
                  {[...Array(9)].map((_, i) => (
                    <div
                      key={i}
                      className="border border-white/20"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Face Detection Overlay */}
            <div className="absolute inset-0">
              {detectedFaces.map((face) => (
                <motion.div
                  key={face.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`absolute border-2 rounded-lg cursor-pointer ${face.status === 'recognized'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-yellow-500 bg-yellow-500/10'
                    }`}
                  style={{
                    left: `${face.x}px`,
                    top: `${face.y}px`,
                    width: `${face.width}px`,
                    height: `${face.height}px`
                  }}
                  onClick={() => handleFaceSelect(face)}
                >
                  {/* Face Label */}
                  <div className={`absolute -top-6 left-0 px-2 py-1 rounded-md text-xs font-semibold ${face.status === 'recognized'
                    ? 'bg-green-500 text-white'
                    : 'bg-yellow-500 text-white'
                    }`}>
                    {face.status === 'recognized' ? face.name : 'Unknown'}
                  </div>

                  {/* Confidence Indicator */}
                  <div className="absolute -bottom-6 left-0 text-xs">
                    {Math.round(face.confidence * 100)}%
                  </div>

                  {/* Selection Indicator */}
                  {recognitionResults.find(f => f.id === face.id) && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle size={14} className="text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* Flash Effect */}
        {cameraSettings.flash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-white"
          />
        )}

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full border-4 border-primary-500 border-t-transparent animate-spin mx-auto mb-4" />
              <p className="text-white">Detecting face with FaceNet AI...</p>
            </div>
          </div>
        )}

        {/* Face Validation Error Overlay */}
        {faceValidationError && !isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-red-900/80 flex items-center justify-center"
          >
            <div className="text-center p-6 max-w-sm">
              <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-white" />
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">Face Detection Failed</h3>
              <p className="text-red-200 mb-4">{faceValidationError}</p>
              <button
                onClick={() => setFaceValidationError(null)}
                className="px-6 py-2 bg-white text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}

        {/* Success Overlay for Registration */}
        {detectedFaces.length > 0 && detectedFaces[0].status === 'detected' && purpose === 'registration' && !isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-green-900/80 flex items-center justify-center"
          >
            <div className="text-center p-6 max-w-sm">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-white" />
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">Face Captured Successfully!</h3>
              <p className="text-green-200 mb-4">Human face detected and FaceNet encoding generated (512-D)</p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-white text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors"
              >
                Continue Registration
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Camera Controls - Simplified: Switch Camera, Capture, Close */}
      <div className="p-4 bg-gradient-to-t from-black/90 to-transparent">
        <div className="flex items-center justify-between">
          {/* Left - Switch Camera */}
          <button
            onClick={switchCamera}
            className="p-3 sm:p-4 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            aria-label="Switch camera (Front/Rear)"
          >
            <RefreshCw size={22} />
          </button>

          {/* Center - Capture Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCapture}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center shadow-2xl border-4 border-white/50"
            aria-label="Capture photo"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors flex items-center justify-center">
              <Camera size={24} className="text-white" />
            </div>
          </motion.button>

          {/* Right - Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-3 sm:p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              aria-label="Close camera"
            >
              <XCircle size={22} />
            </button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 left-4 right-4 bg-gray-800/90 backdrop-blur-lg rounded-xl p-4"
          >
            <h4 className="text-white font-semibold mb-3">Camera Settings</h4>

            <div className="space-y-4">
              {/* Facing Mode */}
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Camera</label>
                <select
                  value={cameraSettings.facingMode}
                  onChange={(e) => setCameraSettings(prev => ({
                    ...prev,
                    facingMode: e.target.value
                  }))}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2"
                >
                  <option value="user">Front Camera</option>
                  <option value="environment">Rear Camera</option>
                </select>
              </div>

              {/* Quality */}
              <div>
                <label className="text-sm text-gray-300 mb-1 block">
                  Quality: {cameraSettings.quality * 100}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={cameraSettings.quality}
                  onChange={(e) => setCameraSettings(prev => ({
                    ...prev,
                    quality: parseFloat(e.target.value)
                  }))}
                  className="w-full"
                />
              </div>

              {/* Countdown */}
              <div>
                <label className="text-sm text-gray-300 mb-1 block">
                  Countdown: {cameraSettings.countdown}s
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={cameraSettings.countdown}
                  onChange={(e) => setCameraSettings(prev => ({
                    ...prev,
                    countdown: parseInt(e.target.value)
                  }))}
                  className="w-full"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Panel */}
      {showPreview && capturedImages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 right-4 bg-gray-800/90 backdrop-blur-lg rounded-xl p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white text-sm font-semibold">Preview</h4>
            <button
              onClick={clearCapturedImages}
              className="text-xs text-gray-400 hover:text-white"
            >
              Clear
            </button>
          </div>

          <div className="flex space-x-2 overflow-x-auto max-w-xs">
            {capturedImages.map((img, index) => (
              <div
                key={index}
                className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0"
              >
                <img
                  src={img.url}
                  alt={`Capture ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recognition Results */}
      {recognitionResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-4 bg-gray-800/90 backdrop-blur-lg rounded-xl p-3 max-w-xs"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white text-sm font-semibold flex items-center">
              <Users size={16} className="mr-2" />
              Recognized: {recognitionResults.length}
            </h4>
            <button
              onClick={() => setRecognitionResults([])}
              className="text-xs text-gray-400 hover:text-white"
            >
              Clear
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recognitionResults.map((student) => (
              <div
                key={student.id}
                className="flex items-center space-x-2 p-2 bg-gray-700/50 rounded-lg"
              >
                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
                  <User size={14} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{student.name}</p>
                  <p className="text-xs text-gray-400">ID: {student.studentId}</p>
                </div>
                <div className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                  {Math.round(student.confidence * 100)}%
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Canvas for image capture (hidden) */}
      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  )
}

export default CameraCapture