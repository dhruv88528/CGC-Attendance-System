const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const attendanceController = require('../controllers/attendanceController');
const { validate } = require('../middleware/validationMiddleware');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// Attendance validation
const captureAttendanceValidation = [
  body('classId').notEmpty().withMessage('Class ID is required'),
  body('imageData').notEmpty().withMessage('Image data is required'),
  body('mode').optional().isIn(['online', 'offline']).withMessage('Mode must be online or offline'),
];

const dailyAttendanceValidation = [
  query('date').optional().isISO8601().withMessage('Valid date is required'),
  query('classId').notEmpty().withMessage('Class ID is required'),
];

const monthlyAttendanceValidation = [
  query('month').notEmpty().withMessage('Month is required'),
  query('year').notEmpty().withMessage('Year is required'),
  query('classId').notEmpty().withMessage('Class ID is required'),
];

// Frontend-compatible attendance routes
router.post('/capture', authorize('teacher', 'admin'), validate(captureAttendanceValidation), attendanceController.recognizeAndMarkAttendance);
router.get('/daily', validate(dailyAttendanceValidation), attendanceController.getClassAttendance);
router.get('/monthly', validate(monthlyAttendanceValidation), attendanceController.getAttendanceSummary);
router.put('/:id', authorize('teacher', 'admin'), attendanceController.updateAttendance);
router.get('/student/:studentId', attendanceController.getStudentAttendanceHistory);
router.post('/sync', attendanceController.syncOfflineAttendance);

module.exports = router;