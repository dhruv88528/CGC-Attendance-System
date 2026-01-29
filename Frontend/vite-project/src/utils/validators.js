
import validator from 'validator'

// Email validation
export const validateEmail = (email) => {
  if (!email) return 'Email is required'
  if (!validator.isEmail(email)) return 'Please enter a valid email address'
  return null
}

// Password validation
export const validatePassword = (password) => {
  if (!password) return 'Password is required'
  if (password.length < 6) return 'Password must be at least 6 characters long'
  return null
}

// Name validation
export const validateName = (name, field = 'Name') => {
  if (!name) return `${field} is required`
  if (name.length < 2) return `${field} must be at least 2 characters long`
  if (!validator.isAlpha(name.replace(/\s/g, ''))) return `${field} can only contain letters`
  return null
}

// Phone number validation
export const validatePhone = (phone) => {
  if (!phone) return null // Phone is optional
  if (!validator.isMobilePhone(phone, 'en-IN')) return 'Please enter a valid Indian phone number'
  return null
}

// Date validation
export const validateDate = (date, field = 'Date') => {
  if (!date) return `${field} is required`
  if (!validator.isDate(date)) return `Please enter a valid ${field.toLowerCase()}`
  return null
}

// Student ID validation
export const validateStudentId = (id) => {
  if (!id) return 'Student ID is required'
  if (!validator.isAlphanumeric(id)) return 'Student ID can only contain letters and numbers'
  if (id.length < 3) return 'Student ID must be at least 3 characters long'
  return null
}

// Roll number validation
export const validateRollNumber = (rollNo) => {
  if (!rollNo) return 'Roll number is required'
  if (!validator.isNumeric(rollNo.toString())) return 'Roll number must be a number'
  if (parseInt(rollNo) <= 0) return 'Roll number must be positive'
  return null
}

// Class validation
export const validateClass = (className) => {
  if (!className) return 'Class is required'
  return null
}

// Section validation
export const validateSection = (section) => {
  if (!section) return 'Section is required'
  return null
}

// Address validation
export const validateAddress = (address) => {
  if (!address) return null // Address is optional
  if (address.length < 10) return 'Address is too short'
  return null
}

// Image validation
export const validateImage = (file) => {
  if (!file) return null // Image is optional
  
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB
  
  if (!validTypes.includes(file.type)) {
    return 'Please upload a valid image (JPEG, PNG, WebP)'
  }
  
  if (file.size > maxSize) {
    return 'Image size must be less than 5MB'
  }
  
  return null
}

// Form validation helper
export const validateForm = (fields, values) => {
  const errors = {}
  
  fields.forEach(field => {
    let error = null
    
    switch (field.type) {
      case 'email':
        error = validateEmail(values[field.name])
        break
      case 'password':
        error = validatePassword(values[field.name])
        break
      case 'name':
        error = validateName(values[field.name], field.label)
        break
      case 'phone':
        error = validatePhone(values[field.name])
        break
      case 'date':
        error = validateDate(values[field.name], field.label)
        break
      case 'studentId':
        error = validateStudentId(values[field.name])
        break
      case 'rollNumber':
        error = validateRollNumber(values[field.name])
        break
      case 'class':
        error = validateClass(values[field.name])
        break
      case 'section':
        error = validateSection(values[field.name])
        break
      case 'address':
        error = validateAddress(values[field.name])
        break
      case 'image':
        error = validateImage(values[field.name])
        break
      default:
        if (field.required && !values[field.name]) {
          error = `${field.label} is required`
        }
    }
    
    if (error) {
      errors[field.name] = error
    }
  })
  
  return errors
}

// Validate attendance data
export const validateAttendanceData = (data) => {
  const errors = {}
  
  if (!data.classId) {
    errors.classId = 'Please select a class'
  }
  
  if (!data.date) {
    errors.date = 'Please select a date'
  }
  
  return errors
}

// Validate report parameters
export const validateReportParams = (params) => {
  const errors = {}
  
  if (!params.startDate) {
    errors.startDate = 'Start date is required'
  }
  
  if (!params.endDate) {
    errors.endDate = 'End date is required'
  }
  
  if (params.startDate && params.endDate) {
    const start = new Date(params.startDate)
    const end = new Date(params.endDate)
    
    if (start > end) {
      errors.dateRange = 'Start date must be before end date'
    }
    
    // Limit to 1 year max
    const oneYear = 365 * 24 * 60 * 60 * 1000
    if (end - start > oneYear) {
      errors.dateRange = 'Date range cannot exceed 1 year'
    }
  }
  
  return errors
}

// Sanitize input
export const sanitizeInput = (input) => {
  return validator.escape(input.trim())
}

// Validate file size
export const validateFileSize = (file, maxSizeMB = 5) => {
  const maxSize = maxSizeMB * 1024 * 1024
  if (file.size > maxSize) {
    return `File size must be less than ${maxSizeMB}MB`
  }
  return null
}

// Validate image dimensions
export const validateImageDimensions = (file, minWidth = 100, minHeight = 100) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      if (img.width < minWidth || img.height < minHeight) {
        resolve(`Image must be at least ${minWidth}x${minHeight} pixels`)
      } else {
        resolve(null)
      }
    }
    img.onerror = () => resolve('Unable to load image')
    img.src = URL.createObjectURL(file)
  })
}

// Export all validators
export default {
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  validateDate,
  validateStudentId,
  validateRollNumber,
  validateClass,
  validateSection,
  validateAddress,
  validateImage,
  validateForm,
  validateAttendanceData,
  validateReportParams,
  sanitizeInput,
  validateFileSize,
  validateImageDimensions
}
