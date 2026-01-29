import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const Card = ({
  children,
  className = '',
  hoverable = true,
  clickable = false,
  onClick,
  href,
  padding = true,
  shadow = 'md',
  border = true,
  gradient = false,
  glass = false,
  ...props
}) => {
  const baseClasses = `
    rounded-2xl transition-all duration-300
    ${border ? 'border border-gray-200 dark:border-gray-700' : ''}
    ${padding ? 'p-6' : ''}
    ${shadow === 'sm' ? 'shadow-sm' : ''}
    ${shadow === 'md' ? 'shadow-md' : ''}
    ${shadow === 'lg' ? 'shadow-lg' : ''}
    ${shadow === 'xl' ? 'shadow-xl' : ''}
    ${shadow === '2xl' ? 'shadow-2xl' : ''}
    ${glass ? 'glass-effect' : 'bg-white dark:bg-gray-800'}
    ${gradient ? 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900' : ''}
    ${hoverable ? 'hover:shadow-xl hover:-translate-y-1' : ''}
    ${clickable ? 'cursor-pointer active:scale-[0.98]' : ''}
  `

  const content = (
    <motion.div
      className={`${baseClasses} ${className}`}
      whileHover={hoverable ? { y: -4 } : {}}
      whileTap={clickable ? { scale: 0.98 } : {}}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  )

  if (href) {
    return (
      <Link to={href} className="block">
        {content}
      </Link>
    )
  }

  return content
}

// Card Header Component
export const CardHeader = ({
  title,
  subtitle,
  action,
  icon,
  className = '',
  titleSize = 'lg',
  align = 'start'
}) => {
  const titleSizes = {
    sm: 'text-lg font-semibold',
    md: 'text-xl font-semibold',
    lg: 'text-2xl font-bold',
    xl: 'text-3xl font-bold'
  }

  const alignClasses = {
    start: 'text-left',
    center: 'text-center',
    end: 'text-right'
  }

  return (
    <div className={`flex items-center justify-between mb-4 ${alignClasses[align]} ${className}`}>
      <div className="flex items-center space-x-3">
        {icon && (
          <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
            {icon}
          </div>
        )}
        <div>
          <h3 className={`${titleSizes[titleSize]} text-gray-900 dark:text-white`}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// Card Content Component
export const CardContent = ({ children, className = '', padding = true }) => {
  return (
    <div className={`${padding ? 'py-4' : ''} ${className}`}>
      {children}
    </div>
  )
}

// Card Footer Component
export const CardFooter = ({ children, className = '', border = true }) => {
  return (
    <div className={`
      mt-6 pt-6 
      ${border ? 'border-t border-gray-200 dark:border-gray-700' : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}

// Stat Card Component
export const StatCard = ({
  title,
  value,
  change,
  icon,
  color = 'primary',
  loading = false,
  format = 'number',
  ...props
}) => {
  const colorConfig = {
    primary: {
      bg: 'bg-primary-500',
      text: 'text-primary-600 dark:text-primary-400',
      light: 'bg-primary-100 dark:bg-primary-900/30'
    },
    green: {
      bg: 'bg-green-500',
      text: 'text-green-600 dark:text-green-400',
      light: 'bg-green-100 dark:bg-green-900/30'
    },
    red: {
      bg: 'bg-red-500',
      text: 'text-red-600 dark:text-red-400',
      light: 'bg-red-100 dark:bg-red-900/30'
    },
    yellow: {
      bg: 'bg-yellow-500',
      text: 'text-yellow-600 dark:text-yellow-400',
      light: 'bg-yellow-100 dark:bg-yellow-900/30'
    },
    purple: {
      bg: 'bg-purple-500',
      text: 'text-purple-600 dark:text-purple-400',
      light: 'bg-purple-100 dark:bg-purple-900/30'
    }
  }

  const config = colorConfig[color] || colorConfig.primary

  const formatValue = (val) => {
    if (format === 'percentage') return `${val}%`
    if (format === 'currency') return `₹${parseInt(val).toLocaleString()}`
    if (format === 'compact') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`
      if (val >= 1000) return `${(val / 1000).toFixed(1)}K`
      return val.toString()
    }
    return val.toLocaleString()
  }

  return (
    <Card hoverable {...props}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded loading-shimmer" />
          ) : (
            <p className={`text-3xl font-bold ${config.text}`}>
              {formatValue(value)}
            </p>
          )}
          
          {change !== undefined && (
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${
                change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
              </span>
              <span className="text-sm text-gray-500 ml-2">from last month</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className={`p-3 rounded-xl ${config.light}`}>
            <div className={`w-12 h-12 rounded-lg ${config.bg} flex items-center justify-center`}>
              {typeof icon === 'string' ? (
                <span className="text-white text-xl">{icon}</span>
              ) : (
                <div className="text-white">{icon}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

// Metric Card Component
export const MetricCard = ({
  icon,
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  loading = false,
  ...props
}) => {
  return (
    <Card hoverable {...props}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-4">
            {icon && (
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                {icon}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {title}
              </p>
              {loading ? (
                <div className="h-8 w-20 mt-2 bg-gray-200 dark:bg-gray-700 rounded loading-shimmer" />
              ) : (
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {value}
                </p>
              )}
            </div>
          </div>
          
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
          
          {trend !== undefined && (
            <div className="mt-4 flex items-center">
              <div className={`px-2 py-1 rounded text-xs font-semibold ${
                trend >= 0 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {trend >= 0 ? '↗' : '↘'} {Math.abs(trend)}%
              </div>
              {trendLabel && (
                <span className="text-xs text-gray-500 ml-2">
                  {trendLabel}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

// Info Card Component
export const InfoCard = ({
  icon,
  title,
  description,
  action,
  variant = 'default',
  ...props
}) => {
  const variants = {
    default: 'border-gray-200 dark:border-gray-700',
    primary: 'border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10',
    success: 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10',
    warning: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10',
    error: 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
  }

  return (
    <Card className={variants[variant]} {...props}>
      <div className="flex items-start space-x-4">
        {icon && (
          <div className="flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
            {title}
          </h4>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </Card>
  )
}

export default Card