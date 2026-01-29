const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Student = require('../models/Student');
const Class = require('../models/Class');
const School = require('../models/School');

/**
 * Handle validation errors
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 * @returns 
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * Validate user registration
 */
const validateUserRegistration = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .custom(async (email) => {
      const user = await User.findOne({ email });
      if (user) {
        throw new Error('Email already in use');
      }
    }),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('role')
    .optional()
    .isIn(['admin', 'teacher'])
    .withMessage('Role must be either admin or teacher'),
  handleValidationErrors
];

/**
 * Validate student registration
 */
const validateStudentRegistration = [
  body('rollNumber')
    .notEmpty()
    .withMessage('Roll number is required')
    .custom(async (rollNumber, { req }) => {
      const student = await Student.findOne({
        rollNumber,
        school: req.user.school
      });
      if (student) {
        throw new Error('Roll number already exists in this school');
      }
    }),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').optional(),
  body('dateOfBirth')
    .notEmpty()
    .withMessage('Date of birth is required')
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  body('gender')
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),
  body('parentName').notEmpty().withMessage('Parent/Guardian name is required'),
  body('parentPhone')
    .notEmpty()
    .withMessage('Parent phone number is required')
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('classId')
    .notEmpty()
    .withMessage('Class ID is required')
    .custom(async (classId, { req }) => {
      const classExists = await Class.findOne({
        _id: classId,
        school: req.user.school
      });
      if (!classExists) {
        throw new Error('Class not found in your school');
      }
    }),
  handleValidationErrors
];

/**
 * Validate class creation
 */
const validateClassCreation = [
  body('name').notEmpty().withMessage('Class name is required'),
  body('grade')
    .notEmpty()
    .withMessage('Grade is required')
    .isNumeric()
    .withMessage('Grade must be a number'),
  body('section')
    .notEmpty()
    .withMessage('Section is required')
    .isLength({ max: 5 })
    .withMessage('Section must be less than 5 characters'),
  body('academicYear')
    .optional()
    .isLength({ min: 4, max: 9 })
    .withMessage('Academic year must be in format YYYY-YYYY'),
  handleValidationErrors
];

/**
 * Validate attendance marking
 */
const validateAttendanceMarking = [
  body('classId').notEmpty().withMessage('Class ID is required'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('attendanceData')
    .isArray()
    .withMessage('Attendance data must be an array'),
  body('attendanceData.*.studentId')
    .notEmpty()
    .withMessage('Student ID is required'),
  body('attendanceData.*.status')
    .isIn(['present', 'absent', 'late', 'leave'])
    .withMessage('Invalid attendance status'),
  handleValidationErrors
];

/**
 * Validate school creation
 */
const validateSchoolCreation = [
  body('name').notEmpty().withMessage('School name is required'),
  body('code')
    .notEmpty()
    .withMessage('School code is required')
    .custom(async (code) => {
      const school = await School.findOne({ code });
      if (school) {
        throw new Error('School code already exists');
      }
    }),
  body('address').notEmpty().withMessage('Address is required'),
  body('district').notEmpty().withMessage('District is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('pincode')
    .notEmpty()
    .withMessage('Pincode is required')
    .isPostalCode('IN')
    .withMessage('Please provide a valid Indian pincode'),
  body('contactPerson').notEmpty().withMessage('Contact person is required'),
  body('contactPhone')
    .notEmpty()
    .withMessage('Contact phone is required')
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('contactEmail')
    .notEmpty()
    .withMessage('Contact email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateStudentRegistration,
  validateClassCreation,
  validateAttendanceMarking,
  validateSchoolCreation
};