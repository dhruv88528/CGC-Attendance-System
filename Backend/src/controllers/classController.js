const Class = require('../models/Class');
const School = require('../models/School');
const Student = require('../models/Student');
const { asyncHandler } = require('../middleware/errorMiddleware');

/**
 * @desc    Get all classes
 * @route   GET /api/v1/classes
 * @access  Private
 */
const getClasses = asyncHandler(async (req, res) => {
  // Always filter by user's school for data isolation
  if (!req.user.school) {
    return res.status(403).json({
      success: false,
      message: 'No school assigned. Please contact administrator.'
    });
  }

  const filter = { school: req.user.school };

  const classes = await Class.find(filter)
    .populate('teacher', 'name')
    .populate('school', 'name code')
    .sort({ grade: 1, section: 1 });

  res.status(200).json({
    success: true,
    count: classes.length,
    data: classes
  });
});

/**
 * @desc    Get class by ID
 * @route   GET /api/v1/classes/:id
 * @access  Private
 */
const getClass = asyncHandler(async (req, res) => {
  const classObj = await Class.findById(req.params.id)
    .populate('teacher', 'name')
    .populate('school', 'name code address');

  if (!classObj) {
    return res.status(404).json({
      success: false,
      message: 'Class not found'
    });
  }

  // Check if user has access to this class
  if (req.user.role === 'teacher' && classObj.school.toString() !== req.user.school.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this class'
    });
  }

  res.status(200).json({
    success: true,
    data: classObj
  });
});

/**
 * @desc    Create class
 * @route   POST /api/v1/classes
 * @access  Private/Admin/Teacher
 */
const createClass = asyncHandler(async (req, res) => {
  const { name, grade, section, subjects, schedule } = req.body;

  // User must have a school assigned (data isolation)
  if (!req.user.school) {
    return res.status(403).json({
      success: false,
      message: 'No school assigned. Please set up your school first.'
    });
  }
  const schoolId = req.user.school;

  // Generate academic year if not provided
  const currentYear = new Date().getFullYear();
  const academicYear = req.body.academicYear || `${currentYear}-${currentYear + 1}`;

  // Check if class with same NAME already exists in this grade/section
  // This allows multiple subjects (Math, English, Science) in same grade/section
  const className = name || `Class ${grade}`;
  const existingClass = await Class.findOne({
    name: className,
    grade,
    section,
    academicYear,
    school: schoolId
  });

  if (existingClass) {
    return res.status(400).json({
      success: false,
      message: `Class "${className}" already exists for Grade ${grade}, Section ${section}`
    });
  }

  const classObj = await Class.create({
    name: name || `Class ${grade}`,
    grade,
    section,
    academicYear,
    school: schoolId,
    teacher: req.body.teacher || null,
    subjects: subjects || [],
    schedule: schedule || {}
  });

  // Populate references
  await classObj.populate('teacher', 'name');
  await classObj.populate('school', 'name code');

  res.status(201).json({
    success: true,
    message: 'Class created successfully',
    data: classObj
  });
});

/**
 * @desc    Update class
 * @route   PUT /api/v1/classes/:id
 * @access  Private/Admin/Teacher
 */
const updateClass = asyncHandler(async (req, res) => {
  let classObj = await Class.findById(req.params.id);

  if (!classObj) {
    return res.status(404).json({
      success: false,
      message: 'Class not found'
    });
  }

  // Check if user has access to this class
  if (req.user.role === 'teacher' && classObj.school.toString() !== req.user.school.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this class'
    });
  }

  const { name, grade, section, academicYear, teacher, subjects, schedule, isActive } = req.body;

  // Check if updating to a combination that already exists
  if (name || grade || section || academicYear) {
    const newName = name || classObj.name;
    const newGrade = grade || classObj.grade;
    const newSection = section || classObj.section;
    const newAcademicYear = academicYear || classObj.academicYear;

    const existingClass = await Class.findOne({
      name: newName,
      grade: newGrade,
      section: newSection,
      academicYear: newAcademicYear,
      school: classObj.school,
      _id: { $ne: classObj._id }
    });

    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: `Class "${newName}" already exists for Grade ${newGrade}, Section ${newSection}`
      });
    }
  }

  // Update fields
  classObj.name = name || classObj.name;
  classObj.grade = grade || classObj.grade;
  classObj.section = section || classObj.section;
  classObj.academicYear = academicYear || classObj.academicYear;
  classObj.teacher = teacher || classObj.teacher;
  classObj.subjects = subjects || classObj.subjects;
  classObj.schedule = schedule || classObj.schedule;

  if (req.user.role === 'admin' && isActive !== undefined) {
    classObj.isActive = isActive;
  }

  await classObj.save();

  // Populate references
  await classObj.populate('teacher', 'name');
  await classObj.populate('school', 'name code');

  res.status(200).json({
    success: true,
    message: 'Class updated successfully',
    data: classObj
  });
});

/**
 * @desc    Delete class
 * @route   DELETE /api/v1/classes/:id
 * @access  Private/Admin
 */
const deleteClass = asyncHandler(async (req, res) => {
  const classObj = await Class.findById(req.params.id);

  if (!classObj) {
    return res.status(404).json({
      success: false,
      message: 'Class not found'
    });
  }

  // Check if user has access to this class
  if (req.user.role === 'teacher' && classObj.school.toString() !== req.user.school.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this class'
    });
  }

  // Check if class has students
  const studentCount = await Student.countDocuments({ class: classObj._id });

  if (studentCount > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete class with students. Please reassign students first.'
    });
  }

  await classObj.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Class deleted successfully'
  });
});

module.exports = {
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass
};