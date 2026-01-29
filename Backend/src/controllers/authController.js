const User = require('../models/User');
const School = require('../models/School');
const { generateToken } = require('../utils/jwt');

// @desc    Register new school with admin
// @route   POST /api/auth/register-school
// @access  Public
const registerSchool = async (req, res) => {
  try {
    const {
      // School info
      schoolName,
      schoolCode,
      city,
      state,
      phone: schoolPhone,
      email: schoolEmail,
      principalName,
      // Admin info
      adminName,
      adminEmail,
      adminPassword,
      adminPhone
    } = req.body;

    // Validate required fields
    if (!schoolName || !schoolCode || !adminEmail || !adminPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide school name, code, admin email and password',
      });
    }

    // Check if school code already exists
    const existingSchool = await School.findOne({ code: schoolCode.toUpperCase() });
    if (existingSchool) {
      return res.status(400).json({
        success: false,
        message: 'School with this code already exists',
      });
    }

    // Check if admin email already exists
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Create school
    const currentYear = new Date().getFullYear();
    const school = await School.create({
      name: schoolName,
      code: schoolCode.toUpperCase(),
      address: {
        city: city || '',
        state: state || '',
      },
      contact: {
        phone: schoolPhone || '',
        email: schoolEmail || adminEmail,
        principalName: principalName || adminName,
      },
      academicYear: `${currentYear}-${currentYear + 1}`,
    });

    // Create admin user for this school
    const admin = await User.create({
      name: adminName || 'School Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      phone: adminPhone || '',
      school: school._id,
    });

    // Generate token
    const token = generateToken(admin._id);

    res.status(201).json({
      success: true,
      message: 'School registered successfully! You can now login.',
      data: {
        token,
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          school: {
            _id: school._id,
            name: school.name,
            code: school.code,
          },
        },
      },
    });
  } catch (error) {
    console.error('School registration error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `A ${field === 'code' ? 'school with this code' : field} already exists`,
      });
    }

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages,
      });
    }

    // Generic server error with more details in development
    res.status(500).json({
      success: false,
      message: 'Server error during school registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Register user (teacher) to existing school
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, schoolCode } = req.body;

    // Check if school exists
    const school = await School.findOne({ code: schoolCode });
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'teacher',
      phone,
      school: school._id,
    });

    // Update school teacher count
    school.totalTeachers += 1;
    await school.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          school: user.school,
        },
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password, schoolCode } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password').populate('school', 'name code');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated',
      });
    }

    // For teachers, validate school code
    if (user.role === 'teacher' && user.school) {
      if (!schoolCode) {
        return res.status(400).json({
          success: false,
          message: 'School code is required for teacher login',
        });
      }

      // Check if school code matches
      if (user.school.code !== schoolCode.toUpperCase()) {
        return res.status(401).json({
          success: false,
          message: 'Invalid school code for this account',
        });
      }
    }

    // Check password
    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          school: user.school,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('school', 'name code address');

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    // Update basic info
    if (name) user.name = name;
    if (phone) user.phone = phone;

    // Update password if provided
    if (currentPassword && newPassword) {
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }
      user.password = newPassword;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we just send a success response
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // In a real implementation, this would send a password reset email
    // For now, we'll return a mock response
    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing password reset',
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // In a real implementation, this would reset the user's password
    // For now, we'll return a mock response
    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error resetting password',
    });
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Private
const refreshToken = async (req, res) => {
  try {
    // Generate new token
    const token = generateToken(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        token,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error refreshing token',
    });
  }
};

module.exports = {
  registerSchool,
  register,
  login,
  getMe,
  updateProfile,
  logout,
  forgotPassword,
  resetPassword,
  refreshToken,
};