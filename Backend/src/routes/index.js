const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const schoolRoutes = require('./schoolRoutes');
const schoolProfileRoutes = require('./schoolProfileRoutes');
const studentRoutes = require('./studentRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const reportRoutes = require('./reportRoutes');
const userRoutes = require('./userRoutes');
const classRoutes = require('./classRoutes');
const aiRoutes = require('./aiRoutes');
const notificationRoutes = require('./notificationRoutes');
const { protect } = require('../middleware/authMiddleware');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Attendance System API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API version prefix
const apiPrefix = '/api/v1';

// Mount routes
router.use(`${apiPrefix}/auth`, authRoutes);
router.use(`${apiPrefix}/schools`, schoolRoutes);
router.use(`${apiPrefix}/school`, schoolProfileRoutes);
router.use(`${apiPrefix}/students`, studentRoutes);
router.use(`${apiPrefix}/classes`, classRoutes);
router.use(`${apiPrefix}/attendance`, attendanceRoutes);
router.use(`${apiPrefix}/ai`, aiRoutes);
router.use(`${apiPrefix}/reports`, reportRoutes);
router.use(`${apiPrefix}/users`, userRoutes);
router.use(`${apiPrefix}/notifications`, notificationRoutes);

// 404 handler for API routes
router.use(`${apiPrefix}/*`, (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
  });
});

module.exports = router;