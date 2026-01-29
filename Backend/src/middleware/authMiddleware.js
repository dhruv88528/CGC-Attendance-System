const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // DEMO MODE: Allow demo tokens for development/testing
      if (token === 'demo_token_123') {
        // Create a mock user for demo mode
        req.user = {
          _id: 'demo_user_id',
          id: 'demo_user_id',
          name: 'Demo User',
          email: 'demo@school.com',
          role: 'admin',
          isActive: true,
          save: async () => { } // Mock save function
        };
        return next();
      }

      // Verify real JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      // Update last login
      req.user.lastLogin = new Date();
      await req.user.save();

      next();
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token, authorization denied',
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }

    next();
  };
};

module.exports = { protect, authorize };