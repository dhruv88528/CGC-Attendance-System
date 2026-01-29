import React from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  className = '',
  rounded = 'lg',
  animation = 'hover-lift',
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center font-medium transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-primary-600 to-blue-600 text-white 
      hover:from-primary-700 hover:to-blue-700 
      active:from-primary-800 active:to-blue-800
      shadow-lg hover:shadow-xl
    `,
    secondary: `
      bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 
      border-2 border-gray-200 dark:border-gray-700
      hover:bg-gray-50 dark:hover:bg-gray-700
      hover:border-gray-300 dark:hover:border-gray-600
      shadow-md hover:shadow-lg
    `,
    outline: `
      bg-transparent text-primary-600 dark:text-primary-400
      border-2 border-primary-500 dark:border-primary-400
      hover:bg-primary-50 dark:hover:bg-primary-900/20
    `,
    ghost: `
      bg-transparent text-gray-700 dark:text-gray-300
      hover:bg-gray-100 dark:hover:bg-gray-800
    `,
    danger: `
      bg-gradient-to-r from-red-600 to-rose-600 text-white
      hover:from-red-700 hover:to-rose-700
      active:from-red-800 active:to-rose-800
      shadow-lg hover:shadow-xl
    `,
    success: `
      bg-gradient-to-r from-green-600 to-emerald-600 text-white
      hover:from-green-700 hover:to-emerald-700
      active:from-green-800 active:to-emerald-800
      shadow-lg hover:shadow-xl
    `,
    warning: `
      bg-gradient-to-r from-yellow-600 to-amber-600 text-white
      hover:from-yellow-700 hover:to-amber-700
      active:from-yellow-800 active:to-amber-800
      shadow-lg hover:shadow-xl
    `
  }

  const sizeClasses = {
    xs: 'text-xs px-2.5 py-1.5 rounded',
    sm: 'text-sm px-3 py-2 rounded',
    md: 'text-base px-4 py-2.5 rounded-lg',
    lg: 'text-lg px-6 py-3 rounded-lg',
    xl: 'text-xl px-8 py-4 rounded-xl'
  }

  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-full'
  }

  const animationClasses = {
    'hover-lift': 'hover:-translate-y-0.5',
    'hover-scale': 'hover:scale-105',
    'hover-glow': 'hover:shadow-glow',
    none: ''
  }

  const buttonClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${roundedClasses[rounded]}
    ${animationClasses[animation]}
    ${className}
  `

  const renderIcon = () => {
    if (loading) {
      return (
        <div className={`flex items-center ${iconPosition === 'right' ? 'ml-2' : 'mr-2'}`}>
          <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        </div>
      )
    }

    if (icon) {
      const IconComponent = icon
      return (
        <span className={iconPosition === 'right' ? 'ml-2' : 'mr-2'}>
          <IconComponent size={size === 'xs' || size === 'sm' ? 14 : 18} />
        </span>
      )
    }

    return null
  }

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={buttonClasses}
      {...props}
    >
      {iconPosition === 'left' && renderIcon()}
      {children}
      {iconPosition === 'right' && renderIcon()}
    </motion.button>
  )
}

// Icon Button Component
export const IconButton = ({
  icon,
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  label,
  ...props
}) => {
  const sizeClasses = {
    xs: 'p-1.5',
    sm: 'p-2',
    md: 'p-2.5',
    lg: 'p-3',
    xl: 'p-4'
  }

  const iconSize = {
    xs: 16,
    sm: 18,
    md: 20,
    lg: 24,
    xl: 28
  }

  const variantClasses = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600',
    secondary: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
    outline: 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
    ghost: 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
    danger: 'bg-red-500 text-white hover:bg-red-600'
  }

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.1 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.9 } : {}}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center rounded-lg
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      aria-label={label}
      {...props}
    >
      {loading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 size={iconSize[size]} />
        </motion.div>
      ) : (
        icon && <icon.type size={iconSize[size]} />
      )}
    </motion.button>
  )
}

// Button Group Component
export const ButtonGroup = ({ children, className = '', orientation = 'horizontal' }) => {
  return (
    <div className={`
      flex ${orientation === 'vertical' ? 'flex-col' : 'flex-row'}
      ${orientation === 'vertical' ? 'space-y-2' : 'space-x-2'}
      ${className}
    `}>
      {React.Children.map(children, (child, index) => {
        if (index === 0) {
          return React.cloneElement(child, {
            className: `${child.props.className || ''} ${orientation === 'horizontal' ? 'rounded-r-none' : 'rounded-b-none'
              }`
          })
        }

        if (index === React.Children.count(children) - 1) {
          return React.cloneElement(child, {
            className: `${child.props.className || ''} ${orientation === 'horizontal' ? 'rounded-l-none' : 'rounded-t-none'
              }`
          })
        }

        return React.cloneElement(child, {
          className: `${child.props.className || ''} ${orientation === 'horizontal' ? 'rounded-none' : 'rounded-none'
            }`
        })
      })}
    </div>
  )
}

export default Button