import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const Modal = ({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
  preventScroll = true,
  className = '',
  overlayClassName = '',
  contentClassName = '',
  overlayBlur = true
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (preventScroll && isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, preventScroll])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  }

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  }

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: 20,
      transition: {
        duration: 0.2
      }
    }
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className={`fixed inset-0 z-50 overflow-y-auto ${overlayClassName}`}
          onClick={handleOverlayClick}
        >
          {/* Overlay */}
          <div className={`fixed inset-0 ${
            overlayBlur ? 'backdrop-blur-sm' : ''
          } bg-black/50`} />
          
          {/* Modal Container */}
          <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`relative w-full ${sizeClasses[size]} ${className}`}
            >
              {/* Modal Content */}
              <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden ${contentClassName}`}>
                {/* Header */}
                {(title || showCloseButton) && (
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
                    <div className="flex items-center justify-between">
                      <div>
                        {title && (
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {title}
                          </h3>
                        )}
                        {subtitle && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {subtitle}
                          </p>
                        )}
                      </div>
                      
                      {showCloseButton && (
                        <motion.button
                          whileHover={{ scale: 1.1, rotate: 90 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={onClose}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          aria-label="Close modal"
                        >
                          <X size={20} className="text-gray-500 dark:text-gray-400" />
                        </motion.button>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Body */}
                <div className="px-6 py-4">
                  {children}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Confirmation Modal
export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning",
  isLoading = false,
  ...props
}) => {
  const variantConfig = {
    warning: {
      icon: "⚠️",
      confirmColor: "bg-yellow-500 hover:bg-yellow-600",
      iconColor: "text-yellow-500"
    },
    danger: {
      icon: "🗑️",
      confirmColor: "bg-red-500 hover:bg-red-600",
      iconColor: "text-red-500"
    },
    success: {
      icon: "✅",
      confirmColor: "bg-green-500 hover:bg-green-600",
      iconColor: "text-green-500"
    },
    info: {
      icon: "ℹ️",
      confirmColor: "bg-blue-500 hover:bg-blue-600",
      iconColor: "text-blue-500"
    }
  }

  const config = variantConfig[variant]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      {...props}
    >
      <div className="text-center py-4">
        <div className={`text-4xl mb-4 ${config.iconColor}`}>
          {config.icon}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>
        
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 ${config.confirmColor} text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// Alert Modal
export const AlertModal = ({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  actionText = "Okay",
  ...props
}) => {
  const typeConfig = {
    success: {
      icon: "✅",
      color: "text-green-500",
      bg: "bg-green-100 dark:bg-green-900/30"
    },
    error: {
      icon: "❌",
      color: "text-red-500",
      bg: "bg-red-100 dark:bg-red-900/30"
    },
    warning: {
      icon: "⚠️",
      color: "text-yellow-500",
      bg: "bg-yellow-100 dark:bg-yellow-900/30"
    },
    info: {
      icon: "ℹ️",
      color: "text-blue-500",
      bg: "bg-blue-100 dark:bg-blue-900/30"
    }
  }

  const config = typeConfig[type]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      {...props}
    >
      <div className="text-center py-6">
        <div className={`w-16 h-16 ${config.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <span className="text-2xl">{config.icon}</span>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>
        
        <button
          onClick={onClose}
          className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          {actionText}
        </button>
      </div>
    </Modal>
  )
}

export default Modal