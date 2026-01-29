import { useState, useRef, useCallback } from 'react'
import { CAMERA_MODES } from '../constants'
import toast from 'react-hot-toast'

export const useCamera = (options = {}) => {
  const {
    mode = CAMERA_MODES.PHOTO,
    facingMode = 'user',
    quality = 1.0,          // Maximum quality for best clarity
    maxWidth = 1920,        // Full HD width
    maxHeight = 1080,       // Full HD height
    constraints = {}
  } = options

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [isActive, setIsActive] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState(null)
  const [permission, setPermission] = useState(null)
  const [faces, setFaces] = useState([])
  const [capturedImages, setCapturedImages] = useState([])
  const [recordingTime, setRecordingTime] = useState(0)
  const recordingInterval = useRef(null)

  // Request camera permission
  const requestPermission = useCallback(async () => {
    try {
      setError(null)

      const videoConstraints = {
        video: {
          facingMode,
          width: { ideal: maxWidth },
          height: { ideal: maxHeight },
          ...options.constraints?.video
        },
        audio: false
      }

      console.log('Requesting camera with constraints:', videoConstraints)
      const stream = await navigator.mediaDevices.getUserMedia(videoConstraints)
      console.log('Got stream:', stream)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // Wait for video to be ready and play
        try {
          await videoRef.current.play()
          console.log('Video playing successfully')
        } catch (playError) {
          console.error('Video play error:', playError)
          // Try again with muted (required for autoplay in some browsers)
          videoRef.current.muted = true
          await videoRef.current.play()
        }
      }

      streamRef.current = stream
      setIsActive(true)
      setPermission('granted')

      return { success: true, stream }
    } catch (err) {
      console.error('Camera error:', err)
      setError(err.message)
      setPermission('denied')

      if (err.name === 'NotAllowedError') {
        toast.error('Camera permission denied. Please enable camera access.')
      } else if (err.name === 'NotFoundError') {
        toast.error('No camera found. Please connect a camera.')
      } else if (err.name === 'NotReadableError') {
        toast.error('Camera is being used by another application.')
      } else {
        toast.error('Failed to access camera: ' + err.message)
      }

      return { success: false, error: err }
    }
  }, [facingMode, maxWidth, maxHeight, options.constraints])

  // Start camera
  const startCamera = useCallback(async () => {
    if (isActive) return

    const result = await requestPermission()
    return result
  }, [isActive, requestPermission])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
      })
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsActive(false)
    setIsRecording(false)
    setFaces([])

    // Clear recording interval
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current)
      recordingInterval.current = null
    }
  }, [])

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !isActive) {
      toast.error('Camera is not active')
      return null
    }

    try {
      const video = videoRef.current
      const canvas = canvasRef.current || document.createElement('canvas')

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const context = canvas.getContext('2d')
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert to blob with quality
      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            const imageUrl = URL.createObjectURL(blob)
            const imageData = {
              blob,
              url: imageUrl,
              timestamp: Date.now(),
              width: canvas.width,
              height: canvas.height
            }

            setCapturedImages(prev => [...prev, imageData])
            toast.success('Photo captured!')

            resolve(imageData)
          },
          'image/jpeg',
          quality
        )
      })
    } catch (err) {
      setError(err.message)
      toast.error('Failed to capture photo')
      return null
    }
  }, [isActive, quality])

  // Start recording video
  const startRecording = useCallback(async () => {
    if (!isActive) {
      await startCamera()
    }

    if (isRecording) return

    try {
      const stream = streamRef.current
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      })

      const chunks = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const videoUrl = URL.createObjectURL(blob)

        const videoData = {
          blob,
          url: videoUrl,
          timestamp: Date.now(),
          duration: recordingTime
        }

        setCapturedImages(prev => [...prev, videoData])
        toast.success('Recording saved!')
      }

      mediaRecorder.start(1000) // Collect data every second

      // Start recording timer
      let seconds = 0
      recordingInterval.current = setInterval(() => {
        seconds++
        setRecordingTime(seconds)
      }, 1000)

      setIsRecording(true)

      return mediaRecorder
    } catch (err) {
      setError(err.message)
      toast.error('Failed to start recording')
      return null
    }
  }, [isActive, isRecording, startCamera, recordingTime])

  // Stop recording
  const stopRecording = useCallback((mediaRecorder) => {
    if (!isRecording || !mediaRecorder) return

    mediaRecorder.stop()
    setIsRecording(false)

    if (recordingInterval.current) {
      clearInterval(recordingInterval.current)
      recordingInterval.current = null
    }

    setRecordingTime(0)
  }, [isRecording])

  // Detect faces in image
  const detectFaces = useCallback(async (imageData) => {
    try {
      // This would typically call your AI service
      // For now, we'll simulate detection

      // Create form data
      const formData = new FormData()
      formData.append('image', imageData.blob)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Mock face detection results
      const mockFaces = [
        {
          id: 1,
          x: 100,
          y: 100,
          width: 150,
          height: 150,
          confidence: 0.95,
          studentId: 'STU001'
        },
        {
          id: 2,
          x: 300,
          y: 150,
          width: 140,
          height: 140,
          confidence: 0.87,
          studentId: 'STU002'
        }
      ]

      setFaces(mockFaces)
      return mockFaces
    } catch (err) {
      setError(err.message)
      toast.error('Face detection failed')
      return []
    }
  }, [])

  // Process video frames for face detection
  const processVideoFrame = useCallback(async () => {
    if (!isActive || !videoRef.current) return []

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const context = canvas.getContext('2d')
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        const faces = await detectFaces({ blob })
        resolve(faces)
      }, 'image/jpeg', 0.5)
    })
  }, [isActive, detectFaces])

  // Switch camera
  const switchCamera = useCallback(async () => {
    stopCamera()

    const newFacingMode = facingMode === 'user' ? 'environment' : 'user'

    const constraints = {
      video: {
        facingMode: newFacingMode,
        width: { ideal: maxWidth },
        height: { ideal: maxHeight }
      }
    }

    return requestPermission(constraints)
  }, [facingMode, stopCamera, maxWidth, maxHeight, requestPermission])

  // Clear captured images
  const clearCapturedImages = useCallback(() => {
    capturedImages.forEach(img => {
      URL.revokeObjectURL(img.url)
    })
    setCapturedImages([])
    setFaces([])
  }, [capturedImages])

  // Get camera devices
  const getCameraDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      return videoDevices
    } catch (err) {
      setError(err.message)
      return []
    }
  }, [])

  // Set specific camera device
  const setCameraDevice = useCallback(async (deviceId) => {
    stopCamera()

    const constraints = {
      video: {
        deviceId: { exact: deviceId },
        width: { ideal: maxWidth },
        height: { ideal: maxHeight }
      }
    }

    return requestPermission(constraints)
  }, [stopCamera, maxWidth, maxHeight, requestPermission])

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    stopCamera()
    clearCapturedImages()
  }, [stopCamera, clearCapturedImages])

  return {
    // Refs
    videoRef,
    canvasRef,
    streamRef,

    // State
    isActive,
    isRecording,
    error,
    permission,
    faces,
    capturedImages,
    recordingTime,

    // Methods
    startCamera,
    stopCamera,
    capturePhoto,
    startRecording,
    stopRecording,
    detectFaces,
    processVideoFrame,
    switchCamera,
    clearCapturedImages,
    getCameraDevices,
    setCameraDevice,
    requestPermission,
    cleanup
  }
}