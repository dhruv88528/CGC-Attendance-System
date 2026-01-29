const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const schoolController = require('../controllers/schoolController');
const { validate } = require('../middleware/validationMiddleware');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// School validation
const createSchoolValidation = [
  body('name').notEmpty().withMessage('School name is required'),
  body('code').notEmpty().withMessage('School code is required'),
  body('academicYear').notEmpty().withMessage('Academic year is required'),
  body('contact.phone').notEmpty().withMessage('Contact phone is required'),
  body('contact.email').optional().isEmail().withMessage('Please include a valid email'),
];

const updateSchoolValidation = [
  body('name').optional().notEmpty().withMessage('School name cannot be empty'),
  body('code').optional().notEmpty().withMessage('School code cannot be empty'),
  body('contact.email').optional().isEmail().withMessage('Please include a valid email'),
];

// Class validation
const createClassValidation = [
  body('name').notEmpty().withMessage('Class name is required'),
  body('grade').isInt({ min: 1, max: 12 }).withMessage('Grade must be between 1 and 12'),
  body('section').notEmpty().withMessage('Section is required'),
  body('academicYear').notEmpty().withMessage('Academic year is required'),
];

// School routes
router.post('/', authorize('admin'), validate(createSchoolValidation), schoolController.createSchool);
router.get('/', authorize('admin'), schoolController.getSchools);
router.get('/:id', schoolController.getSchool);
router.put('/:id', validate(updateSchoolValidation), schoolController.updateSchool);
router.delete('/:id', authorize('admin'), schoolController.deleteSchool);
router.get('/:id/dashboard', schoolController.getSchoolDashboard);

// Class routes (nested under school)
router.post('/:id/classes', validate(createClassValidation), schoolController.createClass);

module.exports = router;