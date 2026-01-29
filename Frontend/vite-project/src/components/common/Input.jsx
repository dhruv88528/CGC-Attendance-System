import React, { useState, forwardRef } from 'react'
import { motion } from 'framer-motion'
import {
  Eye,
  EyeOff,
  Search,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Lock,
  X,
  Check,
  AlertCircle
} from 'lucide-react'

const Input = forwardRef(({
  label,
  error,
  helperText,
  icon,
  type = 'text',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  required = false,
  success = false,
  prefix,
  suffix,
  className = '',
  containerClassName = '',
  labelClassName = '',
  inputClassName = '',
  errorClassName = '',
  onClear,
  showClear = false,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const sizeClasses = {
    sm: {
      input: 'px-3 py-1.5 text-sm',
      label: 'text-sm mb-1',
      icon: 'w-4 h-4',
      clear: 'w-4 h-4'
    },
    md: {
      input: 'px-4 py-2.5 text-base',
      label: 'text-sm mb-1.5',
      icon: 'w-5 h-5',
      clear: 'w-5 h-5'
    },
    lg: {
      input: 'px-5 py-3 text-lg',
      label: 'text-base mb-2',
      icon: 'w-6 h-6',
      clear: 'w-6 h-6'
    }
  }

  const currentSize = sizeClasses[size]

  const getIcon = () => {
    if (icon) return icon

    switch (type) {
      case 'email':
        return Mail
      case 'password':
        return Lock
      case 'tel':
        return Phone
      case 'search':
        return Search
      case 'date':
        return Calendar
      case 'time':
        return Clock
      case 'text':
      default:
        return null
    }
  }

  const IconComponent = getIcon()

  const inputType = type === 'password' && showPassword ? 'text' : type

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
      {/* Label */}
      {label && (
        <label className={`block font-medium text-gray-700 dark:text-gray-300 ${currentSize.label} ${labelClassName}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Prefix */}
        {prefix && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            {prefix}
          </div>
        )}

        {/* Icon */}
        {IconComponent && (
          <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${error ? 'text-red-500' : success ? 'text-green-500' : 'text-gray-400'
            }`}>
            <IconComponent className={currentSize.icon} />
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          type={inputType}
          disabled={disabled || loading}
          className={`
            w-full bg-white dark:bg-gray-800 border-2 rounded-xl
            focus:outline-none focus:ring-2 focus:ring-offset-0
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${currentSize.input}
            ${IconComponent || prefix ? 'pl-10' : 'pl-4'}
            ${suffix || showClear || type === 'password' ? 'pr-10' : 'pr-4'}
            ${error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : success
                ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                : isFocused
                  ? 'border-primary-500 focus:border-primary-500 focus:ring-primary-500/20'
                  : 'border-gray-300 dark:border-gray-600 focus:border-primary-500'
            }
            ${inputClassName}
          `}
          onFocus={(e) => {
            setIsFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
          {...props}
        />

        {/* Password Toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className={currentSize.icon} />
            ) : (
              <Eye className={currentSize.icon} />
            )}
          </button>
        )}

        {/* Clear Button */}
        {showClear && props.value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            tabIndex={-1}
          >
            <X className={currentSize.clear} />
          </button>
        )}

        {/* Success Indicator */}
        {success && !error && !showClear && type !== 'password' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
            <Check className={currentSize.icon} />
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full"
            />
          </div>
        )}

        {/* Suffix */}
        {suffix && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            {suffix}
          </div>
        )}
      </div>

      {/* Error/Helper Text */}
      {(error || helperText) && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-1.5 flex items-center space-x-1 ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
            } ${currentSize.label} ${errorClassName}`}
        >
          {error && <AlertCircle size={14} className="flex-shrink-0" />}
          <span>{error || helperText}</span>
        </motion.div>
      )}
    </div>
  )
})

Input.displayName = 'Input'

// TextArea Component
export const TextArea = forwardRef(({
  label,
  error,
  helperText,
  rows = 4,
  size = 'md',
  fullWidth = false,
  disabled = false,
  required = false,
  className = '',
  containerClassName = '',
  labelClassName = '',
  textareaClassName = '',
  ...props
}, ref) => {
  const sizeClasses = {
    sm: {
      textarea: 'px-3 py-1.5 text-sm',
      label: 'text-sm mb-1'
    },
    md: {
      textarea: 'px-4 py-2.5 text-base',
      label: 'text-sm mb-1.5'
    },
    lg: {
      textarea: 'px-5 py-3 text-lg',
      label: 'text-base mb-2'
    }
  }

  const currentSize = sizeClasses[size]

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
      {label && (
        <label className={`block font-medium text-gray-700 dark:text-gray-300 ${currentSize.label} ${labelClassName}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        rows={rows}
        disabled={disabled}
        className={`
          w-full bg-white dark:bg-gray-800 border-2 rounded-xl
          focus:outline-none focus:ring-2 focus:ring-offset-0
          transition-all duration-200 resize-none
          disabled:opacity-50 disabled:cursor-not-allowed
          ${currentSize.textarea}
          ${error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
            : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500/20'
          }
          ${textareaClassName}
        `}
        {...props}
      />

      {(error || helperText) && (
        <p className={`mt-1.5 ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'} ${currentSize.label}`}>
          {error || helperText}
        </p>
      )}
    </div>
  )
})

TextArea.displayName = 'TextArea'

// Select Component
export const Select = forwardRef(({
  label,
  error,
  helperText,
  options = [],
  size = 'md',
  fullWidth = false,
  disabled = false,
  required = false,
  placeholder = 'Select an option',
  className = '',
  containerClassName = '',
  labelClassName = '',
  selectClassName = '',
  ...props
}, ref) => {
  const sizeClasses = {
    sm: {
      select: 'px-3 py-1.5 text-sm',
      label: 'text-sm mb-1'
    },
    md: {
      select: 'px-4 py-2.5 text-base',
      label: 'text-sm mb-1.5'
    },
    lg: {
      select: 'px-5 py-3 text-lg',
      label: 'text-base mb-2'
    }
  }

  const currentSize = sizeClasses[size]

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
      {label && (
        <label className={`block font-medium text-gray-700 dark:text-gray-300 ${currentSize.label} ${labelClassName}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <select
        ref={ref}
        disabled={disabled}
        className={`
          w-full bg-white dark:bg-gray-800 border-2 rounded-xl
          focus:outline-none focus:ring-2 focus:ring-offset-0
          transition-all duration-200 appearance-none
          disabled:opacity-50 disabled:cursor-not-allowed
          ${currentSize.select}
          ${error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
            : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500/20'
          }
          ${selectClassName}
        `}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>

      {(error || helperText) && (
        <p className={`mt-1.5 ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'} ${currentSize.label}`}>
          {error || helperText}
        </p>
      )}
    </div>
  )
})

Select.displayName = 'Select'

// Checkbox Component
export const Checkbox = forwardRef(({
  label,
  error,
  helperText,
  size = 'md',
  disabled = false,
  required = false,
  className = '',
  containerClassName = '',
  labelClassName = '',
  checkboxClassName = '',
  ...props
}, ref) => {
  const sizeClasses = {
    sm: {
      checkbox: 'w-4 h-4',
      label: 'text-sm'
    },
    md: {
      checkbox: 'w-5 h-5',
      label: 'text-base'
    },
    lg: {
      checkbox: 'w-6 h-6',
      label: 'text-lg'
    }
  }

  const currentSize = sizeClasses[size]

  return (
    <div className={`${containerClassName}`}>
      <label className={`inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <input
          ref={ref}
          type="checkbox"
          disabled={disabled}
          className={`
            rounded border-2 border-gray-300 dark:border-gray-600
            text-primary-600 focus:ring-primary-500 focus:ring-offset-0
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${currentSize.checkbox}
            ${checkboxClassName}
          `}
          {...props}
        />

        {label && (
          <span className={`ml-2 font-medium text-gray-700 dark:text-gray-300 ${currentSize.label} ${labelClassName}`}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </span>
        )}
      </label>

      {(error || helperText) && (
        <p className={`mt-1.5 ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'} text-sm`}>
          {error || helperText}
        </p>
      )}
    </div>
  )
})

Checkbox.displayName = 'Checkbox'

// Radio Component
export const Radio = forwardRef(({
  label,
  error,
  helperText,
  size = 'md',
  disabled = false,
  required = false,
  className = '',
  containerClassName = '',
  labelClassName = '',
  radioClassName = '',
  ...props
}, ref) => {
  const sizeClasses = {
    sm: {
      radio: 'w-4 h-4',
      label: 'text-sm'
    },
    md: {
      radio: 'w-5 h-5',
      label: 'text-base'
    },
    lg: {
      radio: 'w-6 h-6',
      label: 'text-lg'
    }
  }

  const currentSize = sizeClasses[size]

  return (
    <div className={`${containerClassName}`}>
      <label className={`inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <input
          ref={ref}
          type="radio"
          disabled={disabled}
          className={`
            rounded-full border-2 border-gray-300 dark:border-gray-600
            text-primary-600 focus:ring-primary-500 focus:ring-offset-0
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${currentSize.radio}
            ${radioClassName}
          `}
          {...props}
        />

        {label && (
          <span className={`ml-2 font-medium text-gray-700 dark:text-gray-300 ${currentSize.label} ${labelClassName}`}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </span>
        )}
      </label>

      {(error || helperText) && (
        <p className={`mt-1.5 ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'} text-sm`}>
          {error || helperText}
        </p>
      )}
    </div>
  )
})

Radio.displayName = 'Radio'

export default Input