import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  X,
  Bell,
  AlertTriangle
} from 'lucide-react'

const Toast = ({ 
  message, 
  type = 'info', 
  duration = 5000,
  position = 'top-right',
  onClose,
  id,
  title
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (duration === 0) return

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          clearInterval(interval)
          handleClose()
          return 0
        }
        return prev - (100 / (duration / 50))
      })
    }, 50)

    return () => clearInterval(interval)
  }, [duration])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      if (onClose) onClose(id)
    }, 300)
  }

  const typeConfig = {
    success: {
      icon: CheckCircle,
      bg: 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-200',
      iconColor: 'text-green-500 dark:text-green-400',
      title: 'Success'
    },
    error: {
      icon: XCircle,
      bg: 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      iconColor: 'text-red-500 dark:text-red-400',
      title: 'Error'
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-800 dark:text-yellow-200',
      iconColor: 'text-yellow-500 dark:text-yellow-400',
      title: 'Warning'
    },
    info: {
      icon: Info,
      bg: 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      iconColor: 'text-blue-500 dark:text-blue-400',
      title: 'Information'
    },
    notification: {
      icon: Bell,
      bg: 'bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-800 dark:text-purple-200',
      iconColor: 'text-purple-500 dark:text-purple-400',
      title: 'Notification'
    }
  }

  const config = typeConfig[type] || typeConfig.info
  const Icon = config.icon

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  }

  const toastVariants = {
    hidden: {
      opacity: 0,
      x: position.includes('right') ? 100 : -100,
      y: position.includes('bottom') ? 100 : -100,
      scale: 0.8
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    },
    exit: {
      opacity: 0,
      x: position.includes('right') ? 100 : -100,
      scale: 0.8,
      transition: {
        duration: 0.2
      }
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={toastVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`fixed z-[9999] ${positionClasses[position]} max-w-md w-full`}
        >
          <div className={`rounded-2xl shadow-2xl border ${config.border} ${config.bg} overflow-hidden`}>
            {/* Progress bar */}
            {duration > 0 && (
              <div className="h-1 bg-gray-200 dark:bg-gray-700">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary-500 to-school-purple"
                  initial={{ width: '100%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.05 }}
                />
              </div>
            )}
            
            {/* Toast content */}
            <div className="p-4">
              <div className="flex items-start space-x-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className={`p-2 rounded-lg ${config.iconColor} bg-white dark:bg-gray-800 shadow-sm`}
                >
                  <Icon size={20} />
                </motion.div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-semibold ${config.text}`}>
                      {title || config.title}
                    </h4>
                    <button
                      onClick={handleClose}
                      className="p-1 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
                      aria-label="Close"
                    >
                      <X size={16} className={config.text} />
                    </button>
                  </div>
                  
                  <p className={`text-sm ${config.text}`}>
                    {message}
                  </p>
                  
                  {type === 'notification' && (
                    <div className="mt-2 flex space-x-2">
                      <button className="px-3 py-1 text-xs font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                        View Details
                      </button>
                      <button className="px-3 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Toast Container Component
export const ToastContainer = ({ toasts, position = 'top-right', removeToast }) => {
  return (
    <div className={`fixed z-[9998] ${positionClasses[position]}`}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            position={position}
            title={toast.title}
            onClose={removeToast}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

// Custom hook for toast
export const useToast = () => {
  const [toasts, setToasts] = useState([])

  const showToast = (message, options = {}) => {
    const id = Date.now().toString()
    const toast = {
      id,
      message,
      type: options.type || 'info',
      duration: options.duration || 5000,
      title: options.title
    }

    setToasts(prev => [...prev, toast])

    // Auto remove after duration
    if (toast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration + 300) // Add animation time
    }

    return id
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const success = (message, options) => showToast(message, { ...options, type: 'success' })
  const error = (message, options) => showToast(message, { ...options, type: 'error' })
  const warning = (message, options) => showToast(message, { ...options, type: 'warning' })
  const info = (message, options) => showToast(message, { ...options, type: 'info' })
  const notification = (message, options) => showToast(message, { ...options, type: 'notification' })

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info,
    notification,
    ToastContainer: ({ position }) => (
      <ToastContainer
        toasts={toasts}
        position={position}
        removeToast={removeToast}
      />
    )
  }
}

export default Toast