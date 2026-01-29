const School = require('../models/School');
const Class = require('../models/Class');
const User = require('../models/User');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');

// @desc    Create school
// @route   POST /api/schools
// @access  Private/Admin
const createSchool = async (req, res) => {
  try {
    const {
      name,
      code,
      address,
      contact,
      academicYear,
      settings,
    } = req.body;

    // Check if school code already exists
    const existingSchool = await School.findOne({ code });
    if (existingSchool) {
      return res.status(400).json({
        success: false,
        message: 'School with this code already exists',
      });
    }

    const school = await School.create({
      name,
      code: code.toUpperCase(),
      address,
      contact,
      academicYear,
      settings,
    });

    // Create admin user for the school
    const adminUser = await User.create({
      name: contact.principalName || 'School Admin',
      email: `${code.toLowerCase()}.admin@school.edu`,
      password: 'admin123',
      role: 'admin',
      phone: contact.phone,
      school: school._id,
    });

    res.status(201).json({
      success: true,
      message: 'School created successfully',
      data: {
        school,
        adminCredentials: {
          email: adminUser.email,
          password: 'admin123', // Should be changed on first login
        },
      },
    });
  } catch (error) {
    console.error('Create school error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating school',
    });
  }
};

// @desc    Get all schools (returns only user's school for data isolation)
// @route   GET /api/schools
// @access  Private/Admin
const getSchools = async (req, res) => {
  try {
    // For data isolation, only return user's own school
    if (!req.user.school) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    const school = await School.findById(req.user.school)
      .select('-__v');

    if (!school) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      count: 1,
      data: [school],
    });
  } catch (error) {
    console.error('Get schools error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching schools',
    });
  }
};

// @desc    Get single school
// @route   GET /api/schools/:id
// @access  Private
const getSchool = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    // Check if user belongs to this school
    if (req.user.role !== 'admin' && req.user.school.toString() !== school._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this school',
      });
    }

    res.status(200).json({
      success: true,
      data: school,
    });
  } catch (error) {
    console.error('Get school error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching school',
    });
  }
};

// @desc    Update school
// @route   PUT /api/schools/:id
// @access  Private/Admin
const updateSchool = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    // Check if user belongs to this school
    if (req.user.role !== 'admin' && req.user.school.toString() !== school._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this school',
      });
    }

    // Update school
    Object.keys(req.body).forEach((key) => {
      if (key === 'code') {
        school[key] = req.body[key].toUpperCase();
      } else {
        school[key] = req.body[key];
      }
    });

    await school.save();

    res.status(200).json({
      success: true,
      message: 'School updated successfully',
      data: school,
    });
  } catch (error) {
    console.error('Update school error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating school',
    });
  }
};

// @desc    Delete school
// @route   DELETE /api/schools/:id
// @access  Private/Admin
const deleteSchool = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    // Soft delete - mark as inactive
    school.isActive = false;
    await school.save();

    res.status(200).json({
      success: true,
      message: 'School deactivated successfully',
    });
  } catch (error) {
    console.error('Delete school error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deactivating school',
    });
  }
};

// @desc    Get school dashboard stats
// @route   GET /api/schools/:id/dashboard
// @access  Private
const getSchoolDashboard = async (req, res) => {
  try {
    const schoolId = req.params.id;

    // Check authorization
    if (req.user.role !== 'admin' && req.user.school.toString() !== schoolId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this school dashboard',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get school details
    const school = await School.findById(schoolId);

    // Get today's attendance stats
    const todayAttendance = await Attendance.aggregate([
      {
        $match: {
          school: schoolId,
          date: { $gte: today },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get class-wise stats
    const classStats = await Class.aggregate([
      {
        $match: { school: schoolId, isActive: true },
      },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: 'class',
          as: 'students',
        },
      },
      {
        $project: {
          name: 1,
          grade: 1,
          section: 1,
          studentCount: { $size: '$students' },
        },
      },
    ]);

    // Get teacher count
    const teacherCount = await User.countDocuments({
      school: schoolId,
      role: 'teacher',
      isActive: true,
    });

    // Get student count with face registration
    const studentStats = await Student.aggregate([
      {
        $match: { school: schoolId, isActive: true },
      },
      {
        $group: {
          _id: '$faceRegistered',
          count: { $sum: 1 },
        },
      },
    ]);

    const dashboardData = {
      schoolInfo: {
        name: school.name,
        code: school.code,
        totalStudents: school.totalStudents,
        totalTeachers: school.totalTeachers,
      },
      todayAttendance: {
        present: todayAttendance.find((a) => a._id === 'present')?.count || 0,
        absent: todayAttendance.find((a) => a._id === 'absent')?.count || 0,
        late: todayAttendance.find((a) => a._id === 'late')?.count || 0,
        total: todayAttendance.reduce((sum, a) => sum + a.count, 0),
      },
      classes: classStats,
      teachers: teacherCount,
      faceRegistration: {
        registered: studentStats.find((s) => s._id === true)?.count || 0,
        pending: studentStats.find((s) => s._id === false)?.count || 0,
        total: school.totalStudents,
      },
    };

    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard data',
    });
  }
};

// @desc    Create class in school
// @route   POST /api/schools/:id/classes
// @access  Private/Admin
const createClass = async (req, res) => {
  try {
    const schoolId = req.params.id;
    const { name, grade, section, teacher, subjects, schedule } = req.body;

    // Check authorization
    if (req.user.role !== 'admin' && req.user.school.toString() !== schoolId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create classes in this school',
      });
    }

    // Check if class already exists
    const existingClass = await Class.findOne({
      school: schoolId,
      grade,
      section,
      academicYear: req.body.academicYear,
    });

    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: 'Class with this grade and section already exists',
      });
    }

    const newClass = await Class.create({
      name,
      grade,
      section: section.toUpperCase(),
      school: schoolId,
      teacher,
      academicYear: req.body.academicYear,
      subjects,
      schedule,
    });

    // Update school student count if needed
    await School.findByIdAndUpdate(schoolId, {
      $inc: { totalClasses: 1 },
    });

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: newClass,
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating class',
    });
  }
};

// @desc    Get school profile
// @route   GET /api/school/profile
// @access  Private
const getSchoolProfile = async (req, res) => {
  try {
    // User must have a school assigned
    if (!req.user.school) {
      return res.status(404).json({
        success: false,
        message: 'No school found. Please set up your school first.',
      });
    }

    const school = await School.findById(req.user.school);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found. Please contact support.',
      });
    }

    res.status(200).json({
      success: true,
      data: school,
    });
  } catch (error) {
    console.error('Get school profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching school profile',
    });
  }
};

// @desc    Update school profile
// @route   PUT /api/school/profile
// @access  Private/Admin
const updateSchoolProfile = async (req, res) => {
  try {
    // User must have a school assigned
    if (!req.user.school) {
      return res.status(404).json({
        success: false,
        message: 'No school found. Please set up your school first.',
      });
    }

    const school = await School.findById(req.user.school);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    // Update school
    Object.keys(req.body).forEach((key) => {
      if (key === 'code') {
        school[key] = req.body[key].toUpperCase();
      } else {
        school[key] = req.body[key];
      }
    });

    await school.save();

    res.status(200).json({
      success: true,
      message: 'School profile updated successfully',
      data: school,
    });
  } catch (error) {
    console.error('Update school profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating school profile',
    });
  }
};

module.exports = {
  createSchool,
  getSchools,
  getSchool,
  updateSchool,
  deleteSchool,
  getSchoolDashboard,
  createClass,
  getSchoolProfile,
  updateSchoolProfile,
};