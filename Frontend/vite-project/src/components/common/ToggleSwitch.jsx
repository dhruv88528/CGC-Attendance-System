import React from 'react'
import { motion } from 'framer-motion'

const ToggleSwitch = ({
    checked = false,
    onChange,
    label,
    description,
    size = 'md',
    disabled = false,
    color = 'primary',
    className = '',
    labelPosition = 'right',
    ...props
}) => {
    const sizes = {
        sm: {
            track: 'w-8 h-4',
            thumb: 'w-3 h-3',
            translate: 'translate-x-4',
            label: 'text-sm'
        },
        md: {
            track: 'w-11 h-6',
            thumb: 'w-5 h-5',
            translate: 'translate-x-5',
            label: 'text-base'
        },
        lg: {
            track: 'w-14 h-7',
            thumb: 'w-6 h-6',
            translate: 'translate-x-7',
            label: 'text-lg'
        }
    }

    const colors = {
        primary: 'bg-primary-500',
        green: 'bg-green-500',
        blue: 'bg-blue-500',
        purple: 'bg-purple-500',
        red: 'bg-red-500'
    }

    const currentSize = sizes[size]
    const activeColor = colors[color] || colors.primary

    const handleToggle = () => {
        if (!disabled && onChange) {
            onChange(!checked)
        }
    }

    const toggle = (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={handleToggle}
            className={`
        relative inline-flex flex-shrink-0 cursor-pointer rounded-full
        border-2 border-transparent transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${currentSize.track}
        ${checked ? activeColor : 'bg-gray-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
            {...props}
        >
            <motion.span
                className={`
          pointer-events-none inline-block rounded-full bg-white shadow-lg
          ring-0 transition-transform duration-200 ease-in-out
          ${currentSize.thumb}
        `}
                initial={false}
                animate={{
                    x: checked ? (size === 'sm' ? 16 : size === 'lg' ? 28 : 20) : 0
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
        </button>
    )

    if (!label) {
        return toggle
    }

    return (
        <div className={`flex items-center ${labelPosition === 'left' ? 'flex-row-reverse' : ''} ${className}`}>
            {toggle}
            <div className={`${labelPosition === 'left' ? 'mr-3' : 'ml-3'}`}>
                <span className={`font-medium text-gray-900 ${currentSize.label} ${disabled ? 'opacity-50' : ''}`}>
                    {label}
                </span>
                {description && (
                    <p className="text-sm text-gray-500 mt-0.5">
                        {description}
                    </p>
                )}
            </div>
        </div>
    )
}

export default ToggleSwitch