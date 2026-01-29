const User = require('../models/User');
const School = require('../models/School');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { generateToken } = require('../utils/jwt');

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getUsers = asyncHandler(async (req, res) => {
  // Build filter - if user has a school, filter by school
  const filter = {};
  if (req.user.school) {
    filter.school = req.user.school;
  }

  const users = await User.find(filter)
    .select('-password')
    .populate('school', 'name code');

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

/**
 * @desc    Create new user (teacher)
 * @route   POST /api/users
 * @access  Private/Admin
 */
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role, subjects, assignedClasses, qualification, specialization } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Get school from logged-in user (required for data isolation)
  let schoolId = req.user.school;

  if (!schoolId) {
    return res.status(400).json({
      success: false,
      message: 'School is required. Please login with proper credentials.'
    });
  }

  // Create user with teacher-specific fields
  const user = await User.create({
    name,
    email,
    password: password || 'teacher123', // Default password
    phone,
    role: role || 'teacher',
    school: schoolId,
    subjects: subjects || [],
    assignedClasses: assignedClasses || [],
    qualification: qualification || '',
    specialization: specialization || ''
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      school: user.school,
      subjects: user.subjects,
      assignedClasses: user.assignedClasses,
      qualification: user.qualification,
      specialization: user.specialization
    }
  });
});

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('school', 'name code');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if user belongs to the same school (unless admin)
  if (req.user.role !== 'admin' && user.school.toString() !== req.user.school.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this user'
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
const updateUser = asyncHandler(async (req, res) => {
  const { name, email, phone, role, isActive, subjects, assignedClasses, qualification, specialization } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if user belongs to the same school (unless admin)
  if (req.user.role !== 'admin' && user.school.toString() !== req.user.school.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this user'
    });
  }

  // Check if email is being changed and if it already exists
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }
  }

  // Update user fields
  user.name = name || user.name;
  user.email = email || user.email;
  user.phone = phone || user.phone;

  // Update teacher-specific fields
  if (subjects !== undefined) user.subjects = subjects;
  if (assignedClasses !== undefined) user.assignedClasses = assignedClasses;
  if (qualification !== undefined) user.qualification = qualification;
  if (specialization !== undefined) user.specialization = specialization;

  // Only admin can change role and active status
  if (req.user.role === 'admin') {
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      school: user.school,
      subjects: user.subjects,
      assignedClasses: user.assignedClasses,
      qualification: user.qualification,
      specialization: user.specialization
    }
  });
});

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Prevent users from deleting themselves
  if (user._id.toString() === req.user.id.toString()) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete your own account'
    });
  }

  // Check if user belongs to the same school (unless admin)
  if (req.user.role !== 'admin' && user.school.toString() !== req.user.school.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this user'
    });
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getCurrentUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .select('-password')
    .populate('school', 'name code address');

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * @desc    Update current user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateCurrentUserProfile = asyncHandler(async (req, res) => {
  const { name, email, phone, currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  // Update basic info
  if (name) user.name = name;
  if (phone) user.phone = phone;

  // Update email (check if it already exists)
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }
    user.email = email;
  }

  // Update password if provided
  if (currentPassword && newPassword) {
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    user.password = newPassword;
  }

  await user.save();

  // Generate new token
  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        school: user.school
      }
    }
  });
});

module.exports = {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  getCurrentUserProfile,
  updateCurrentUserProfile
};