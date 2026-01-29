const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Class = require('../models/Class');
const School = require('../models/School');
const FaceEncoding = require('../models/FaceEncoding');
const { default: axios } = require('axios');
const mongoose = require('mongoose');
const { sendBulkAttendanceNotifications } = require('../services/firebaseService');

// @desc    Mark attendance for a class
// @route   POST /api/attendance/mark
// @access  Private/Teacher
const markAttendance = async (req, res) => {
  try {
    const { classId, date, attendanceData, recognitionResults, mode } = req.body;
    const markedBy = req.user?._id;
    const schoolId = req.user?.school;

    console.log('\n═══════════════════════════════════════════════════');
    console.log('📝 ATTENDANCE SUBMISSION RECEIVED');
    console.log('═══════════════════════════════════════════════════');
    console.log('Class ID:', classId);
    console.log('Date:', date);
    console.log('Mode:', mode);
    console.log('Total students in data:', attendanceData?.length);

    if (attendanceData && attendanceData.length > 0) {
      console.log('Student IDs being submitted:', attendanceData.map(a => ({
        id: a.studentId,
        type: typeof a.studentId,
        name: a.studentName,
        status: a.status
      })));
    }

    if (!attendanceData || !Array.isArray(attendanceData)) {
      return res.status(400).json({
        success: false,
        message: 'Attendance data is required',
      });
    }

    // Validate class - make school check optional for demo
    let studentClass = await Class.findById(classId);

    if (!studentClass) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    console.log('\n📚 Class Info:', {
      classId,
      className: studentClass.name,
      section: studentClass.section
    });

    // DEBUG: Log all students in this class
    const allClassStudents = await Student.find({ class: classId }).select('_id firstName lastName rollNumber');
    console.log('📖 All students in class:', allClassStudents.map(s => ({
      id: s._id.toString(),
      name: `${s.firstName} ${s.lastName}`,
      roll: s.rollNumber
    })));

    // Use class school if user school not available
    const effectiveSchoolId = schoolId || studentClass.school;

    // Parse date properly - avoid timezone issues
    let attendanceDate;
    if (date) {
      // If date is string like "2025-12-19", parse as local date
      const dateParts = date.split('-');
      if (dateParts.length === 3) {
        attendanceDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      } else {
        attendanceDate = new Date(date);
      }
    } else {
      attendanceDate = new Date();
    }
    attendanceDate.setHours(12, 0, 0, 0); // Set to noon to avoid date shift

    const results = {
      success: 0,
      failed: 0,
      details: [],
    };

    // Process each student attendance
    for (const item of attendanceData) {
      try {
        const { studentId, status, checkInTime, remarks, confidenceScore } = item;

        console.log(`\n[${attendanceData.indexOf(item) + 1}/${attendanceData.length}] Processing: ${item.studentName} (ID: ${studentId}, Status: ${status})`);

        // Validate studentId exists
        if (!studentId) {
          console.error('❌ No studentId provided for:', item.studentName);
          results.failed++;
          results.details.push({
            studentId: null,
            status: 'failed',
            reason: 'No student ID provided',
          });
          continue;
        }

        // Convert to string if it's an object
        let studentIdStr = studentId;
        if (typeof studentId === 'object') {
          studentIdStr = studentId.toString();
          console.log('  📝 Converted ObjectId to string:', studentIdStr);
        } else {
          studentIdStr = String(studentId);
        }

        console.log('  🔍 Looking up student with ID:', studentIdStr, '(type:', typeof studentIdStr + ')');

        // Try to verify student
        let student;
        try {
          // First try: Direct findById
          console.log('  → Attempt 1: Student.findById()');
          student = await Student.findById(studentIdStr);

          if (student) {
            console.log('  ✅ Found via findById!');
          } else {
            console.log('  ❌ Not found via findById, trying findOne...');

            // Second try: findOne with _id
            console.log('  → Attempt 2: Student.findOne({ _id })');
            student = await Student.findOne({ _id: studentIdStr });

            if (student) {
              console.log('  ✅ Found via findOne!');
            } else {
              console.log('  ❌ Not found via findOne either');

              // Third try: Maybe it's just a string ID that needs conversion
              if (mongoose.Types.ObjectId.isValid(studentIdStr)) {
                console.log('  → Attempt 3: Testing with direct ObjectId conversion');
                try {
                  const objId = new mongoose.Types.ObjectId(studentIdStr);
                  student = await Student.findOne({ _id: objId });
                  if (student) {
                    console.log('  ✅ Found via ObjectId conversion!');
                  }
                } catch (e) {
                  console.log('  ❌ ObjectId conversion failed:', e.message);
                }
              } else {
                console.log('  ❌ Invalid ObjectId format:', studentIdStr);
              }
            }
          }
        } catch (findError) {
          console.error(`  ❌ Error looking up student:`, findError.message);
          results.failed++;
          results.details.push({
            studentId: studentIdStr,
            status: 'failed',
            reason: 'Database lookup error: ' + findError.message,
          });
          continue;
        }

        if (!student) {
          console.error(`  ❌ FINAL: Student still not found with ID: ${studentIdStr}`);
          console.error('  💾 Available students in class:', allClassStudents.map(s => s._id.toString()));

          results.failed++;
          results.details.push({
            studentId: studentIdStr,
            status: 'failed',
            reason: 'Student not found in database',
          });
          continue;
        }

        console.log(`  ✅ SUCCESS: Student found: ${student.firstName} ${student.lastName}`);

        // Get date string for lookup
        const dateStr = date || new Date().toISOString().split('T')[0];

        // Create date range for fallback lookup
        const startOfDay = new Date(attendanceDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(attendanceDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Check for existing attendance - try dateString first, then date range for old records
        let existingAttendance = await Attendance.findOne({
          student: studentIdStr,
          dateString: dateStr,
        });

        // Fallback: check for old records without dateString (using date range)
        if (!existingAttendance) {
          existingAttendance = await Attendance.findOne({
            student: studentIdStr,
            dateString: { $in: [null, undefined] },
            date: { $gte: startOfDay, $lte: endOfDay },
          });

          if (existingAttendance) {
            console.log(`  📝 Found OLD record without dateString, will update it`);
          }
        }

        if (existingAttendance) {
          // Update existing attendance
          console.log(`  ↻ Updating existing attendance for ${student.firstName}`);
          existingAttendance.status = status;
          existingAttendance.markedBy = markedBy;
          existingAttendance.markedAt = new Date();
          existingAttendance.recognitionMethod = mode || 'manual';
          existingAttendance.confidenceScore = confidenceScore;
          existingAttendance.checkInTime = checkInTime ? new Date(checkInTime) : undefined;
          existingAttendance.remarks = remarks;
          existingAttendance.dateString = dateStr; // Update old records with dateString!

          await existingAttendance.save();
        } else {
          // Create new attendance record
          console.log(`  ✨ Creating new attendance for ${student.firstName}`);

          await Attendance.create({
            student: studentIdStr, // Use converted string ID
            class: classId,
            school: effectiveSchoolId,
            date: attendanceDate,
            dateString: dateStr, // Store date as string for unique constraint
            status,
            markedBy,
            recognitionMethod: mode || 'manual',
            confidenceScore,
            checkInTime: checkInTime ? new Date(checkInTime) : undefined,
            remarks,
            syncStatus: 'synced',
          });
        }

        // Update student attendance stats
        await updateStudentAttendanceStats(studentIdStr); // Use converted string ID

        results.success++;
        results.details.push({
          studentId: studentIdStr,
          studentName: `${student.firstName} ${student.lastName || ''}`.trim(),
          rollNumber: student.rollNumber,
          status: 'success',
          attendanceStatus: status,
        });

      } catch (error) {
        console.error(`Error marking attendance for student ${item.studentId}:`, error);
        results.failed++;
        results.details.push({
          studentId: item.studentId,
          status: 'failed',
          reason: error.message,
        });
      }
    }

    // Process recognition results for face registration updates
    if (recognitionResults && Array.isArray(recognitionResults)) {
      await processRecognitionResults(recognitionResults, schoolId);
    }

    // Send FCM notifications to parents
    try {
      const notificationRecords = [];
      const className = studentClass ? `${studentClass.grade || studentClass.name}-${studentClass.section || ''}` : 'Class';
      const currentTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      const currentDate = new Date().toLocaleDateString('en-IN');

      for (const detail of results.details) {
        if (detail.status === 'success') {
          // Get student with parent contact
          const student = await Student.findById(detail.studentId).select('parentPhone firstName lastName');

          if (student && student.parentPhone) {
            notificationRecords.push({
              parentToken: student.parentPhone, // This would be FCM token if registered
              studentName: `${student.firstName} ${student.lastName || ''}`.trim(),
              status: detail.attendanceStatus,
              className: className,
              time: currentTime,
              date: currentDate
            });
          }
        }
      }

      // Send bulk notifications (async, don't wait)
      if (notificationRecords.length > 0) {
        sendBulkAttendanceNotifications(notificationRecords)
          .then(result => console.log(`📱 Sent ${result.sent} attendance notifications`))
          .catch(err => console.error('Notification error:', err));
      }
    } catch (notifError) {
      console.error('Error sending notifications:', notifError);
      // Don't fail the request if notifications fail
    }

    res.status(200).json({
      success: true,
      message: `Attendance marked successfully. Success: ${results.success}, Failed: ${results.failed}`,
      data: results,
    });

    console.log(`\n✅ ATTENDANCE SUBMISSION COMPLETE:`, {
      classId,
      date,
      totalStudents: attendanceData.length,
      successCount: results.success,
      failedCount: results.failed,
      successStudents: results.details.filter(d => d.status === 'success').map(d => `${d.studentName}(${d.attendanceStatus})`),
      failedStudents: results.details.filter(d => d.status === 'failed').map(d => `${d.studentId}(${d.reason})`)
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error marking attendance',
    });
  }
};

// @desc    Process recognition results and update face registration
const processRecognitionResults = async (results, schoolId) => {
  for (const result of results) {
    if (result.studentId && result.confidenceScore > 0.7) {
      await Student.findByIdAndUpdate(result.studentId, {
        faceRegistered: true,
        lastFaceUpdate: new Date(),
      });
    }
  }
};

// @desc    Update student attendance statistics
const updateStudentAttendanceStats = async (studentId) => {
  const stats = await Attendance.aggregate([
    {
      $match: {
        student: new mongoose.Types.ObjectId(studentId),
        status: { $in: ['present', 'absent', 'late'] },
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  let totalPresent = 0;
  let totalAbsent = 0;
  let totalRecords = 0;

  stats.forEach((stat) => {
    if (stat._id === 'present' || stat._id === 'late') {
      totalPresent += stat.count;
    } else if (stat._id === 'absent') {
      totalAbsent += stat.count;
    }
    totalRecords += stat.count;
  });

  const attendancePercentage = totalRecords > 0
    ? Math.round((totalPresent / totalRecords) * 100)
    : 0;

  await Student.findByIdAndUpdate(studentId, {
    'attendanceStats.totalPresent': totalPresent,
    'attendanceStats.totalAbsent': totalAbsent,
    'attendanceStats.attendancePercentage': attendancePercentage,
  });
};

// @desc    Get attendance for a class on specific date
// @route   GET /api/attendance/class/:classId/date/:date OR GET /api/attendance/daily
// @access  Private
const getClassAttendance = async (req, res) => {
  try {
    // Support both params and query
    const classId = req.params.classId || req.query.classId;
    const date = req.params.date || req.query.date || new Date().toISOString().split('T')[0];
    const schoolId = req.user?.school;

    // Parse date properly - avoid timezone issues
    let attendanceDate;
    const dateParts = date.split('-');
    if (dateParts.length === 3) {
      attendanceDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    } else {
      attendanceDate = new Date(date);
    }
    attendanceDate.setHours(12, 0, 0, 0);

    // Build query for attendance - search for date range to avoid timezone issues
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    const attendanceQuery = {
      date: { $gte: startOfDay, $lte: endOfDay },
    };

    // If classId provided, filter by class
    if (classId) {
      // Verify class belongs to school
      const studentClass = await Class.findOne({
        _id: classId,
        ...(schoolId ? { school: schoolId } : {}),
      });

      if (!studentClass) {
        return res.status(404).json({
          success: false,
          message: 'Class not found or not authorized',
        });
      }
      attendanceQuery.class = classId;
    } else if (schoolId) {
      // Filter by school if no classId
      attendanceQuery.school = schoolId;
    }

    // Get attendance records for the date
    const attendanceRecords = await Attendance.find(attendanceQuery)
      .populate('student', 'firstName lastName rollNumber')
      .populate('class', 'name grade section');

    // If no records, return empty array with success
    if (!attendanceRecords || attendanceRecords.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No attendance records found for this date',
      });
    }

    // Format response
    const attendanceData = attendanceRecords.map((record) => ({
      _id: record._id,
      student: record.student,
      class: record.class,
      date: record.date,
      status: record.status,
      confidence: record.confidenceScore,
      recognizedBy: record.recognitionMethod,
      createdAt: record.createdAt || record.markedAt,
      markedBy: record.markedBy,
      remarks: record.remarks,
    }));

    res.status(200).json({
      success: true,
      data: attendanceData,
    });
  } catch (error) {
    console.error('Get class attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching attendance',
    });
  }
};

// @desc    Get attendance history for a student
// @route   GET /api/attendance/student/:studentId
// @access  Private
const getStudentAttendanceHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate, limit = 30 } = req.query;
    const schoolId = req.user.school;

    // Verify student belongs to school
    const student = await Student.findOne({
      _id: studentId,
      school: schoolId,
      isActive: true,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or not authorized',
      });
    }

    const query = {
      student: studentId,
    };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const attendance = await Attendance.find(query)
      .populate('class', 'name grade section')
      .populate('markedBy', 'name')
      .sort({ date: -1 })
      .limit(parseInt(limit));

    const summary = await Attendance.aggregate([
      {
        $match: {
          student: new mongoose.Types.ObjectId(studentId),
          status: { $in: ['present', 'absent', 'late', 'leave'] },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalDays = summary.reduce((total, item) => total + item.count, 0);
    const presentDays = summary
      .filter((item) => item._id === 'present' || item._id === 'late')
      .reduce((total, item) => total + item.count, 0);

    const attendancePercentage = totalDays > 0
      ? Math.round((presentDays / totalDays) * 100)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: student._id,
          rollNumber: student.rollNumber,
          name: `${student.firstName} ${student.lastName || ''}`.trim(),
          class: student.class,
        },
        summary: {
          totalDays,
          presentDays,
          attendancePercentage,
          breakdown: summary,
        },
        history: attendance,
      },
    });
  } catch (error) {
    console.error('Get student attendance history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching attendance history',
    });
  }
};

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
// @access  Private/Teacher
const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks, checkInTime } = req.body;

    const attendance = await Attendance.findById(id)
      .populate('student', 'class school');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    // Verify the user has permission to update this attendance
    if (req.user.role !== 'admin') {
      const student = await Student.findById(attendance.student._id);
      if (student.school.toString() !== req.user.school.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this attendance',
        });
      }
    }

    // Update attendance
    attendance.status = status || attendance.status;
    attendance.remarks = remarks !== undefined ? remarks : attendance.remarks;
    attendance.markedBy = req.user._id;
    attendance.markedAt = new Date();

    if (checkInTime) {
      attendance.checkInTime = new Date(checkInTime);

      // Calculate late minutes if check-in time is after start time
      const school = await School.findById(attendance.school);
      if (school && school.settings.attendanceStartTime) {
        const [startHour, startMinute] = school.settings.attendanceStartTime.split(':').map(Number);
        const checkIn = attendance.checkInTime;
        const startTime = new Date(checkIn);
        startTime.setHours(startHour, startMinute, 0, 0);

        if (checkIn > startTime) {
          const lateMs = checkIn - startTime;
          attendance.lateMinutes = Math.round(lateMs / (1000 * 60));
          if (attendance.lateMinutes > school.settings.lateThreshold) {
            attendance.status = 'late';
          }
        }
      }
    }

    await attendance.save();

    // Update student stats
    await updateStudentAttendanceStats(attendance.student._id);

    res.status(200).json({
      success: true,
      message: 'Attendance updated successfully',
      data: attendance,
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating attendance',
    });
  }
};

// @desc    Process face recognition and mark attendance
// @route   POST /api/attendance/recognize
// @access  Private/Teacher
const recognizeAndMarkAttendance = async (req, res) => {
  try {
    const { classId, imageData, mode = 'online' } = req.body;
    const schoolId = req.user.school;

    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: 'Image data is required',
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


    // Get all students in class with their face encodings
    const students = await Student.find({
      class: classId,
      isActive: true,
      faceRegistered: true,
      faceEncoding: { $ne: null },
    }).select('_id firstName lastName rollNumber faceEncoding');

    console.log(`[Recognition] Found ${students.length} students with faceEncoding in class ${classId}`);

    // Also check how many students have null encoding
    const allStudentsInClass = await Student.find({ class: classId, isActive: true }).select('_id firstName faceRegistered faceEncoding');
    console.log(`[Recognition] Total students in class: ${allStudentsInClass.length}`);
    allStudentsInClass.forEach(s => {
      console.log(`[Recognition] Student ${s.firstName}: faceRegistered=${s.faceRegistered}, hasEncoding=${!!(s.faceEncoding && s.faceEncoding.length > 0)}, encodingLength=${s.faceEncoding?.length || 0}`);
    });

    if (students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No students with registered faces found in this class',
      });
    }

    // Prepare student data for AI service (with faceEncoding for matching)
    const studentData = {};
    students.forEach(student => {
      studentData[student._id.toString()] = {
        encoding: student.faceEncoding,
        name: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber,
      };
      console.log(`[Recognition] Sending student ${student.firstName} to AI, encoding length: ${student.faceEncoding?.length || 0}`);
    });


    let recognitionResults = [];
    let errors = [];

    if (mode === 'online' && process.env.AI_SERVICE_URL) {
      // Online mode - send to AI service for strict human face recognition
      try {
        const response = await axios.post(
          `${process.env.AI_SERVICE_URL}/api/recognize-attendance`,
          {
            capturedImage: imageData,
            students: studentData,
            schoolId,
            classId,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 60000, // 60 second timeout for face processing
          }
        );

        if (response.data.success) {
          recognitionResults = response.data.recognized || [];
          errors = response.data.errors || [];
        } else {
          errors = response.data.errors || ['Recognition failed'];
        }
      } catch (error) {
        console.error('AI service error:', error.message);
        return res.status(503).json({
          success: false,
          message: 'Face recognition service unavailable',
          error: error.message,
        });
      }
    } else {
      // Offline mode - basic recognition
      return await processOfflineRecognition(req, res);
    }

    // Process recognition results - only mark if human face matched
    const attendanceData = [];
    const presentStudents = new Set();

    for (const result of recognitionResults) {
      // Only accept if confidence is above 60% (strict matching)
      if (result.confidence >= 60 && result.studentId) {
        attendanceData.push({
          studentId: result.studentId,
          status: 'present',
          confidenceScore: result.confidence / 100,
        });
        presentStudents.add(result.studentId.toString());
      }
    }

    // Mark absent for students not recognized
    for (const student of students) {
      if (!presentStudents.has(student._id.toString())) {
        attendanceData.push({
          studentId: student._id,
          status: 'absent',
          confidenceScore: 0,
        });
      }
    }

    // Only mark if we have valid attendance data
    if (attendanceData.length > 0) {
      await markAttendanceHelper({
        classId,
        date: new Date(),
        attendanceData,
        recognitionResults,
        mode,
        markedBy: req.user._id,
        schoolId,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Attendance processed via face recognition',
      data: {
        recognized: presentStudents.size,
        total: students.length,
        recognitions: recognitionResults,
        errors: errors,
      },
    });
  } catch (error) {
    console.error('Recognize and mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing face recognition',
    });
  }
};

// Helper function for offline recognition
const processOfflineRecognition = async (req, res) => {
  // This would integrate with local face recognition
  // For now, return mock data
  return res.status(200).json({
    success: true,
    message: 'Offline recognition mode',
    data: {
      recognized: 0,
      total: 0,
      recognitions: [],
      mode: 'offline',
    },
  });
};

// Helper function to mark attendance
const markAttendanceHelper = async (data) => {
  const { classId, date, attendanceData, recognitionResults, mode, markedBy, schoolId } = data;

  // Get dateString in YYYY-MM-DD format
  const dateObj = new Date(date);
  const dateString = dateObj.toISOString().split('T')[0];

  // Create date range for finding old records
  const startOfDay = new Date(dateObj);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(dateObj);
  endOfDay.setHours(23, 59, 59, 999);

  for (const item of attendanceData) {
    const studentIdStr = item.studentId?.toString() || item.studentId;

    // First, try to find existing record
    let existingAttendance = await Attendance.findOne({
      student: studentIdStr,
      dateString: dateString,
    });

    // Fallback: check for old records without dateString
    if (!existingAttendance) {
      existingAttendance = await Attendance.findOne({
        student: studentIdStr,
        dateString: { $in: [null, undefined] },
        date: { $gte: startOfDay, $lte: endOfDay },
      });
    }

    if (existingAttendance) {
      // Update existing
      existingAttendance.status = item.status;
      existingAttendance.markedBy = markedBy;
      existingAttendance.markedAt = new Date();
      existingAttendance.recognitionMethod = mode === 'offline' ? 'offline_auto' : 'auto';
      existingAttendance.confidenceScore = item.confidenceScore;
      existingAttendance.syncStatus = mode === 'offline' ? 'pending' : 'synced';
      existingAttendance.dateString = dateString; // Update old records!
      await existingAttendance.save();
    } else {
      // Create new
      const attendance = new Attendance({
        student: studentIdStr,
        class: classId,
        school: schoolId,
        date: dateObj,
        dateString: dateString, // Include dateString!
        status: item.status,
        markedBy,
        recognitionMethod: mode === 'offline' ? 'offline_auto' : 'auto',
        confidenceScore: item.confidenceScore,
        syncStatus: mode === 'offline' ? 'pending' : 'synced',
      });

      if (mode === 'offline') {
        attendance.offlineId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      await attendance.save();
    }
  }

  // Update face registration status for recognized students
  if (recognitionResults && Array.isArray(recognitionResults)) {
    for (const result of recognitionResults) {
      if (result.confidenceScore > 0.7 && result.studentId) {
        await Student.findByIdAndUpdate(result.studentId, {
          faceRegistered: true,
          lastFaceUpdate: new Date(),
        });
      }
    }
  }
};

// @desc    Get attendance summary for date range (supports year/month for calendar)
// @route   GET /api/attendance/monthly
// @access  Private
const getAttendanceSummary = async (req, res) => {
  try {
    const { startDate, endDate, classId, year, month } = req.query;
    const schoolId = req.user?.school;

    const query = {};

    // Add school filter if available
    if (schoolId) {
      query.school = schoolId;
    }

    if (classId) {
      query.class = classId;
    }

    // Handle year/month parameters (for calendar view)
    if (year && month) {
      const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endOfMonth = new Date(parseInt(year), parseInt(month), 0);
      endOfMonth.setHours(23, 59, 59, 999);

      query.date = {
        $gte: startOfMonth,
        $lte: endOfMonth
      };
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    console.log('[Monthly Attendance] Query:', JSON.stringify(query));

    // Get individual attendance records for calendar view
    const attendanceRecords = await Attendance.find(query)
      .select('student date status dateString')
      .lean();

    console.log(`[Monthly Attendance] Found ${attendanceRecords.length} records`);

    // Also get summary
    const summary = await Attendance.aggregate([
      {
        $match: query,
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.date',
          attendance: {
            $push: {
              status: '$_id.status',
              count: '$count',
            },
          },
          total: { $sum: '$count' },
        },
      },
      {
        $sort: { _id: -1 },
      },
    ]);

    // Get class information if classId provided
    let classInfo = null;
    if (classId) {
      classInfo = await Class.findById(classId).select('name grade section');
    }

    res.status(200).json({
      success: true,
      data: {
        attendance: attendanceRecords, // Individual records for calendar
        summary,
        class: classInfo,
        dateRange: {
          startDate,
          endDate,
          year,
          month,
        },
      },
    });
  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching attendance summary',
    });
  }
};

// @desc    Sync offline attendance
// @route   POST /api/attendance/sync
// @access  Private
const syncOfflineAttendance = async (req, res) => {
  try {
    // In a real implementation, this would sync offline attendance records
    // For now, we'll return a mock response
    res.status(200).json({
      success: true,
      message: 'Offline attendance synced successfully',
      data: {
        synced: 0,
        failed: 0,
      },
    });
  } catch (error) {
    console.error('Sync offline attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error syncing offline attendance',
    });
  }
};

// @desc    Delete today's attendance for a class (for testing)
// @route   DELETE /api/attendance/clear/:classId
// @access  Private/Teacher
const deleteTodayAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;

    // Parse date
    let targetDate;
    if (date) {
      const dateParts = date.split('-');
      if (dateParts.length === 3) {
        targetDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      } else {
        targetDate = new Date(date);
      }
    } else {
      targetDate = new Date();
    }
    targetDate.setHours(0, 0, 0, 0);

    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    // Delete attendance records for this class and date
    const result = await Attendance.deleteMany({
      class: classId,
      date: { $gte: targetDate, $lte: endDate }
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} attendance records`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  markAttendance,
  getClassAttendance,
  getStudentAttendanceHistory,
  updateAttendance,
  recognizeAndMarkAttendance,
  getAttendanceSummary,
  markAttendanceHelper,
  syncOfflineAttendance,
  deleteTodayAttendance,
};