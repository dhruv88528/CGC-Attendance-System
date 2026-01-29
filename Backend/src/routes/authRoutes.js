const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { validate } = require('../middleware/validationMiddleware');
const { protect } = require('../middleware/authMiddleware');

// Validation rules
const registerValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('schoolCode').notEmpty().withMessage('School code is required'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

const updateProfileValidation = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty'),
  body('currentPassword').optional().notEmpty().withMessage('Current password is required when changing password'),
  body('newPassword').optional().isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Please include a valid email'),
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const registerSchoolValidation = [
  body('schoolName').notEmpty().withMessage('School name is required'),
  body('schoolCode').notEmpty().withMessage('School code is required'),
  body('adminEmail').isEmail().withMessage('Please include a valid admin email'),
  body('adminPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

// Public routes
router.post('/register-school', validate(registerSchoolValidation), authController.registerSchool);
router.post('/register', validate(registerValidation), authController.register);
router.post('/login', validate(loginValidation), authController.login);
router.post('/forgot-password', validate(forgotPasswordValidation), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordValidation), authController.resetPassword);

// Protected routes
router.get('/me', protect, authController.getMe);
router.put('/update-profile', protect, validate(updateProfileValidation), authController.updateProfile);
router.post('/logout', protect, authController.logout);
router.post('/refresh-token', protect, authController.refreshToken);

module.exports = router;