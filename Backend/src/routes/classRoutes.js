const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const classController = require('../controllers/classController');
const { validate } = require('../middleware/validationMiddleware');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// Class validation
const createClassValidation = [
  body('name').optional().notEmpty().withMessage('Class name cannot be empty'),
  body('grade').isInt({ min: 1, max: 12 }).withMessage('Grade must be between 1 and 12'),
  body('section').notEmpty().withMessage('Section is required'),
  body('academicYear').optional().notEmpty().withMessage('Academic year cannot be empty'),
];

const updateClassValidation = [
  body('name').optional().notEmpty().withMessage('Class name cannot be empty'),
  body('grade').optional().isInt({ min: 1, max: 12 }).withMessage('Grade must be between 1 and 12'),
  body('section').optional().notEmpty().withMessage('Section cannot be empty'),
];

// Class routes
router.get('/', classController.getClasses);
router.post('/', authorize('admin', 'teacher'), validate(createClassValidation), classController.createClass);
router.get('/:id', classController.getClass);
router.put('/:id', authorize('admin', 'teacher'), validate(updateClassValidation), classController.updateClass);
router.delete('/:id', authorize('admin'), classController.deleteClass);

module.exports = router;