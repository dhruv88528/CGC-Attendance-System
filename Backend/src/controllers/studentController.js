const Student = require('../models/Student');
const Class = require('../models/Class');
const School = require('../models/School');
const FaceEncoding = require('../models/FaceEncoding');
const mongoose = require('mongoose');

// @desc    Get all students with filters
// @route   GET /api/v1/students
// @access  Private
const getStudents = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const { page = 1, limit = 50, class: classId, section, search, isActive = true } = req.query;

    const searchCriteria = {
      isActive: isActive === 'true' || isActive === true,
    };

    // Always filter by user's school (required for data isolation)
    if (!schoolId) {
      return res.status(403).json({
        success: false,
        message: 'No school assigned. Please contact administrator.',
      });
    }
    searchCriteria.school = schoolId;

    if (classId) {
      searchCriteria.class = classId;
    }

    if (section) {
      searchCriteria.section = section;
    }

    if (search) {
      searchCriteria.$or = [
        { rollNumber: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { parentName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const students = await Student.find(searchCriteria)
      .populate('class', 'name grade section')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ rollNumber: 1 });

    const total = await Student.countDocuments(searchCriteria);

    res.status(200).json({
      success: true,
      data: {
        students,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching students',
    });
  }
};



// @desc    Register new student
// @route   POST /api/students
// @access  Private/Teacher
const registerStudent = async (req, res) => {
  try {
    const {
      rollNumber,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      parentName,
      parentPhone,
      address,
      aadhaarNumber,
      classId,
      midDayMealEligible,
      faceImage,     // Base64 image string
      faceEncoding,  // 512-D encoding array from FaceNet AI service
    } = req.body;

    // Get school from logged-in user (required for data isolation)
    const schoolId = req.user.school;

    if (!schoolId) {
      return res.status(403).json({
        success: false,
        message: 'No school assigned. Please set up your school first.',
      });
    }

    // Check if roll number already exists in the school
    const existingStudent = await Student.findOne({
      rollNumber,
      school: schoolId,
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student with this roll number already exists',
      });
    }

    // Find the class - must belong to user's school
    const studentClass = await Class.findOne({
      _id: classId,
      school: schoolId,
    });

    if (!studentClass) {
      return res.status(404).json({
        success: false,
        message: 'Class not found or not in your school',
      });
    }

    // Create student with face data
    const student = await Student.create({
      rollNumber,
      firstName,
      lastName,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender: gender || 'Male',
      parentName: parentName || '',
      parentPhone: parentPhone || '',
      address: address || '',
      aadhaarNumber,
      class: classId,
      school: schoolId,
      midDayMealEligible: midDayMealEligible !== undefined ? midDayMealEligible : true,
      faceImage: faceImage || null,        // Base64 image for viewing
      faceEncoding: faceEncoding || null,  // 512-D vector for FaceNet matching
      faceRegistered: !!faceEncoding,      // True if encoding exists
      lastFaceUpdate: faceEncoding ? new Date() : null,
    });

    // Update class student count
    studentClass.studentCount = (studentClass.studentCount || 0) + 1;
    await studentClass.save();

    // Update school total students
    if (schoolId) {
      await School.findByIdAndUpdate(schoolId, {
        $inc: { totalStudents: 1 },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: student,
    });
  } catch (error) {
    console.error('Register student error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(400).json({
        success: false,
        message: `A student with this ${field} already exists`,
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

    // Handle cast errors (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Invalid ${error.path}: ${error.value}`,
      });
    }

    // Generic server error with more details in development
    res.status(500).json({
      success: false,
      message: 'Server error registering student',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Get all students in a class
// @route   GET /api/students/class/:classId
// @access  Private
const getStudentsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const schoolId = req.user.school;

    // Verify class belongs to school
    const studentClass = await Class.findOne({
      _id: classId,
      school: schoolId,
    });

    if (!studentClass) {
      return res.status(404).json({
        success: false,
        message: 'Class not found or not authorized',
      });
    }

    const students = await Student.find({
      class: classId,
      isActive: true,
    })
      .populate('class', 'name grade section')
      .sort({ rollNumber: 1 });

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error('Get students by class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching students',
    });
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private
const getStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const schoolId = req.user.school;

    const student = await Student.findOne({
      _id: id,
      school: schoolId,
    })
      .populate('class', 'name grade section')
      .populate('school', 'name code');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Get attendance summary
    const attendanceSummary = await mongoose.connection.collection('attendances').aggregate([
      {
        $match: {
          student: student._id,
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]).toArray();

    const studentData = student.toObject();
    studentData.attendanceSummary = attendanceSummary;

    res.status(200).json({
      success: true,
      data: studentData,
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching student',
    });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private/Teacher
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const schoolId = req.user.school;

    // Find student
    let student = await Student.findOne({
      _id: id,
      school: schoolId,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Handle class change
    if (req.body.classId && req.body.classId !== student.class.toString()) {
      const newClass = await Class.findOne({
        _id: req.body.classId,
        school: schoolId,
      });

      if (!newClass) {
        return res.status(404).json({
          success: false,
          message: 'New class not found',
        });
      }

      // Update old class student count
      await Class.findByIdAndUpdate(student.class, {
        $inc: { studentCount: -1 },
      });

      // Update new class student count
      newClass.studentCount += 1;
      await newClass.save();

      student.class = newClass._id;
    }

    // Update other fields
    Object.keys(req.body).forEach((key) => {
      if (key !== 'classId' && student[key] !== undefined) {
        if (key === 'dateOfBirth') {
          student[key] = new Date(req.body[key]);
        } else {
          student[key] = req.body[key];
        }
      }
    });

    await student.save();

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: student,
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating student',
    });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private/Admin
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const schoolId = req.user.school;

    const student = await Student.findOne({
      _id: id,
      school: schoolId,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Soft delete
    student.isActive = false;
    await student.save();

    // Update class student count
    await Class.findByIdAndUpdate(student.class, {
      $inc: { studentCount: -1 },
    });

    // Update school total students
    await School.findByIdAndUpdate(schoolId, {
      $inc: { totalStudents: -1 },
    });

    // Delete face encoding if exists
    await FaceEncoding.deleteOne({ student: student._id });

    res.status(200).json({
      success: true,
      message: 'Student deactivated successfully',
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deactivating student',
    });
  }
};

// @desc    Bulk register students
// @route   POST /api/students/bulk
// @access  Private/Teacher
const bulkRegisterStudents = async (req, res) => {
  try {
    const { students, classId } = req.body;
    const schoolId = req.user.school;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid students data',
      });
    }

    // Verify class
    const studentClass = await Class.findOne({
      _id: classId,
      school: schoolId,
    });

    if (!studentClass) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    const results = {
      success: [],
      failed: [],
    };

    // Process each student
    for (const studentData of students) {
      try {
        // Check if student already exists
        const existing = await Student.findOne({
          rollNumber: studentData.rollNumber,
          school: schoolId,
        });

        if (existing) {
          results.failed.push({
            rollNumber: studentData.rollNumber,
            reason: 'Roll number already exists',
          });
          continue;
        }

        // Create student
        const student = await Student.create({
          ...studentData,
          class: classId,
          school: schoolId,
          dateOfBirth: new Date(studentData.dateOfBirth),
        });

        results.success.push(student);

      } catch (error) {
        results.failed.push({
          rollNumber: studentData.rollNumber,
          reason: error.message,
        });
      }
    }

    // Update class and school counts
    const newStudentCount = results.success.length;
    if (newStudentCount > 0) {
      studentClass.studentCount += newStudentCount;
      await studentClass.save();

      await School.findByIdAndUpdate(schoolId, {
        $inc: { totalStudents: newStudentCount },
      });
    }

    res.status(200).json({
      success: true,
      message: `Bulk registration completed. Success: ${results.success.length}, Failed: ${results.failed.length}`,
      data: results,
    });
  } catch (error) {
    console.error('Bulk register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk registration',
    });
  }
};

// @desc    Search students
// @route   GET /api/students/search
// @access  Private
const searchStudents = async (req, res) => {
  try {
    const { query, classId } = req.query;
    const schoolId = req.user.school;

    const searchCriteria = {
      school: schoolId,
      isActive: true,
    };

    if (classId) {
      searchCriteria.class = classId;
    }

    if (query) {
      searchCriteria.$or = [
        { rollNumber: { $regex: query, $options: 'i' } },
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { parentName: { $regex: query, $options: 'i' } },
        { parentPhone: { $regex: query, $options: 'i' } },
      ];
    }

    const students = await Student.find(searchCriteria)
      .populate('class', 'name grade section')
      .limit(50)
      .sort({ rollNumber: 1 });

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error('Search students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error searching students',
    });
  }
};

// @desc    Register student face
// @route   POST /api/students/:id/face
// @access  Private/Teacher
const registerStudentFace = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageData } = req.body;
    const schoolId = req.user.school;

    // Find student
    const student = await Student.findOne({
      _id: id,
      school: schoolId,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // In a real implementation, this would call the AI service to process the face
    // For now, we'll just mark the student as having face registered
    student.faceRegistered = true;
    student.lastFaceUpdate = new Date();
    await student.save();

    res.status(200).json({
      success: true,
      message: 'Student face registered successfully',
      data: student,
    });
  } catch (error) {
    console.error('Register student face error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error registering student face',
    });
  }
};

// @desc    Get students without face registration
// @route   GET /api/students/unregistered-faces
// @access  Private
const getStudentsWithoutFaceRegistration = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const { classId } = req.query;

    const searchCriteria = {
      school: schoolId,
      isActive: true,
      faceRegistered: false,
    };

    if (classId) {
      searchCriteria.class = classId;
    }

    const students = await Student.find(searchCriteria)
      .populate('class', 'name grade section')
      .sort({ rollNumber: 1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error('Get unregistered faces error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching unregistered students',
    });
  }
};

module.exports = {
  getStudents,
  registerStudent,
  getStudentsByClass,
  getStudent,
  updateStudent,
  deleteStudent,
  bulkRegisterStudents,
  searchStudents,
  getStudentsWithoutFaceRegistration,
  registerStudentFace,
};


