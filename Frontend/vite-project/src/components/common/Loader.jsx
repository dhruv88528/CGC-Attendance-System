import React from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

const Loader = ({ 
  type = 'spinner',
  size = 'medium',
  color = 'primary',
  text = 'Loading...',
  fullScreen = false,
  overlay = false
}) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16',
    xlarge: 'w-24 h-24'
  }

  const colorClasses = {
    primary: 'text-primary-600 dark:text-primary-400',
    white: 'text-white',
    gray: 'text-gray-600 dark:text-gray-400',
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400'
  }

  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        ease: "linear",
        repeat: Infinity
      }
    }
  }

  const dotsVariants = {
    initial: { scale: 0.5, opacity: 0.5 },
    animate: (i) => ({
      scale: [0.5, 1, 0.5],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        delay: i * 0.2
      }
    })
  }

  const pulseVariants = {
    initial: { scale: 0.8, opacity: 0.7 },
    animate: {
      scale: [0.8, 1.2, 0.8],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  const renderLoader = () => {
    switch (type) {
      case 'dots':
        return (
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`w-3 h-3 rounded-full bg-current ${colorClasses[color]}`}
                variants={dotsVariants}
                initial="initial"
                animate="animate"
                custom={i}
              />
            ))}
          </div>
        )

      case 'pulse':
        return (
          <motion.div
            className={`rounded-full ${sizeClasses[size]} bg-current ${colorClasses[color]}`}
            variants={pulseVariants}
            initial="initial"
            animate="animate"
          />
        )

      case 'progress':
        return (
          <div className="w-48">
            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-current"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </div>
          </div>
        )

      case 'bounce':
        return (
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`w-3 h-3 rounded-full bg-current ${colorClasses[color]}`}
                animate={{
                  y: [0, -15, 0]
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        )

      case 'spinner':
      default:
        return (
          <motion.div
            variants={spinnerVariants}
            animate="animate"
            className="relative"
          >
            <Loader2 className={`${sizeClasses[size]} ${colorClasses[color]}`} />
          </motion.div>
        )
    }
  }

  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      {renderLoader()}
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-sm font-medium ${colorClasses[color]}`}
        >
          {text}
        </motion.p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          {content}
        </motion.div>
      </div>
    )
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          {content}
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {content}
    </motion.div>
  )
}

// Loading overlay with backdrop
export const LoadingOverlay = ({ isLoading, children, text }) => {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-10 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex items-center justify-center rounded-xl"
        >
          <Loader type="spinner" size="medium" text={text} />
        </motion.div>
      )}
    </div>
  )
}

// Page loader for route transitions
export const PageLoader = () => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-950"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 10, -10, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="mb-8"
      >
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-school-purple flex items-center justify-center shadow-2xl">
          <span className="text-white text-4xl">🎓</span>
        </div>
      </motion.div>
      
      <Loader type="dots" size="large" color="primary" text="Loading Smart Attendance..." />
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8 text-sm text-gray-600 dark:text-gray-400"
      >
        Optimizing for your device...
      </motion.p>
    </motion.div>
  )
}

// Skeleton loader for content
export const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  const CardSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 loading-shimmer" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded loading-shimmer" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded loading-shimmer w-2/3" />
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded loading-shimmer" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded loading-shimmer" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded loading-shimmer w-1/2" />
      </div>
    </div>
  )

  const TableSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded loading-shimmer w-1/4" />
      </div>
      <div className="p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 loading-shimmer" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded loading-shimmer" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded loading-shimmer w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const ListSkeleton = () => (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 loading-shimmer" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded loading-shimmer" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded loading-shimmer w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )

  const renderSkeleton = () => {
    switch (type) {
      case 'table':
        return <TableSkeleton />
      case 'list':
        return <ListSkeleton />
      case 'card':
      default:
        return <CardSkeleton />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          {renderSkeleton()}
        </motion.div>
      ))}
    </motion.div>
  )
}

export default Loader