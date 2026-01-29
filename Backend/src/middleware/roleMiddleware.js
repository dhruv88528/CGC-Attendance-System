/**
 * Role-based authorization middleware
 */

/**
 * Check if user has required roles
 * @param {...string} roles - Allowed roles
 * @returns {Function} Middleware function
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.'
      });
    }

    // Check if user role is in allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of these roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Check if user is admin
 * @returns {Function} Middleware function
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. User not authenticated.'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }

  next();
};

/**
 * Check if user is teacher or admin
 * @returns {Function} Middleware function
 */
const isTeacherOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. User not authenticated.'
    });
  }

  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Teacher or admin privileges required.'
    });
  }

  next();
};

/**
 * Check if user belongs to the same school
 * @param {string} schoolId - School ID to check against
 * @returns {Function} Middleware function
 */
const belongsToSchool = (schoolId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.'
      });
    }

    if (req.user.school.toString() !== schoolId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. User does not belong to this school.'
      });
    }

    next();
  };
};

module.exports = {
  authorizeRoles,
  isAdmin,
  isTeacherOrAdmin,
  belongsToSchool
};