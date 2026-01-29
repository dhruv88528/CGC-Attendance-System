const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const studentController = require('../controllers/studentController');
const { validate } = require('../middleware/validationMiddleware');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// Student validation - very lenient, only classId required
const registerStudentValidation = [
  body('classId').notEmpty().withMessage('Class ID is required'),
];

const updateStudentValidation = [
  body('rollNumber').optional().notEmpty().withMessage('Roll number cannot be empty'),
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('dateOfBirth').optional().isISO8601().withMessage('Valid date of birth is required'),
  body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
];

const bulkRegisterValidation = [
  body('students').isArray().withMessage('Students must be an array'),
  body('students.*.rollNumber').notEmpty().withMessage('Roll number is required for all students'),
  body('students.*.firstName').notEmpty().withMessage('First name is required for all students'),
  body('students.*.dateOfBirth').isISO8601().withMessage('Valid date of birth is required for all students'),
  body('students.*.gender').isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('students.*.parentName').notEmpty().withMessage('Parent name is required for all students'),
  body('students.*.parentPhone').notEmpty().withMessage('Parent phone is required for all students'),
  body('classId').notEmpty().withMessage('Class ID is required'),
];

// Student routes
router.get('/', studentController.getStudents);
router.post('/', authorize('teacher', 'admin'), validate(registerStudentValidation), studentController.registerStudent);
router.post('/bulk', authorize('teacher', 'admin'), validate(bulkRegisterValidation), studentController.bulkRegisterStudents);
router.get('/class/:classId', studentController.getStudentsByClass);
router.get('/search', studentController.searchStudents);
router.get('/unregistered-faces', studentController.getStudentsWithoutFaceRegistration);
router.get('/:id', studentController.getStudent);
router.put('/:id', authorize('teacher', 'admin'), validate(updateStudentValidation), studentController.updateStudent);
router.delete('/:id', authorize('admin'), studentController.deleteStudent);
router.post('/:id/face', authorize('teacher', 'admin'), studentController.registerStudentFace);

module.exports = router;
