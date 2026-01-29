const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const aiController = require('../controllers/aiController');
const { validate } = require('../middleware/validationMiddleware');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// AI validation
const aiValidation = [
  body('image').notEmpty().withMessage('Image data is required'),
];

// AI service routes
router.post('/detect', authorize('teacher', 'admin'), validate(aiValidation), aiController.detectFaces);
router.post('/recognize', authorize('teacher', 'admin'), validate(aiValidation), aiController.recognizeFaces);
router.post('/encode', authorize('teacher', 'admin'), validate(aiValidation), aiController.encodeFace);

module.exports = router;