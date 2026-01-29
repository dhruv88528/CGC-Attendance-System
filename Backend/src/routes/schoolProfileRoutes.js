const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const schoolController = require('../controllers/schoolController');
const { validate } = require('../middleware/validationMiddleware');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// School profile validation
const updateSchoolProfileValidation = [
  body('name').optional().notEmpty().withMessage('School name cannot be empty'),
  body('contact.email').optional().isEmail().withMessage('Please include a valid email'),
  body('settings.attendanceStartTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format'),
  body('settings.attendanceEndTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format'),
];

// School profile routes
router.get('/profile', schoolController.getSchoolProfile);
router.put('/profile', validate(updateSchoolProfileValidation), schoolController.updateSchoolProfile);

module.exports = router;