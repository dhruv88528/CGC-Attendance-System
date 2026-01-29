const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const reportController = require('../controllers/reportController');
const { validate } = require('../middleware/validationMiddleware');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// Report validation
const dailyReportValidation = [
  body('date').optional().isISO8601().withMessage('Valid date is required'),
  body('classId').optional().isMongoId().withMessage('Valid class ID is required'),
  body('format').optional().isIn(['json', 'excel', 'pdf']).withMessage('Format must be json, excel, or pdf'),
];

const monthlyReportValidation = [
  body('month').optional().isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Year must be between 2000 and 2100'),
  body('classId').optional().isMongoId().withMessage('Valid class ID is required'),
  body('format').optional().isIn(['json', 'excel', 'pdf']).withMessage('Format must be json, excel, or pdf'),
];

const midDayMealReportValidation = [
  body('date').optional().isISO8601().withMessage('Valid date is required'),
  body('classId').optional().isMongoId().withMessage('Valid class ID is required'),
  body('format').optional().isIn(['json', 'excel', 'pdf']).withMessage('Format must be json, excel, or pdf'),
];

// Report routes
router.post('/daily', authorize('teacher', 'admin'), validate(dailyReportValidation), reportController.generateDailyReport);
router.post('/monthly', authorize('teacher', 'admin'), validate(monthlyReportValidation), reportController.generateMonthlyReport);
router.post('/government/mid-day-meal', authorize('teacher', 'admin'), validate(midDayMealReportValidation), reportController.generateMidDayMealReport);
router.get('/statistics', reportController.getReportStatistics);

// Frontend compatible routes
router.get('/daily', authorize('teacher', 'admin'), reportController.generateDailyReport);
router.get('/monthly', authorize('teacher', 'admin'), reportController.generateMonthlyReport);
router.get('/student/:studentId', authorize('teacher', 'admin'), reportController.generateStudentReport);
router.post('/export', authorize('teacher', 'admin'), reportController.exportReport);

module.exports = router;