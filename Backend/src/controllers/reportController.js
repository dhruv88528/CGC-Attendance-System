const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const School = require('../models/School');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const mongoose = require('mongoose');
const moment = require('moment');

// @desc    Generate daily attendance report
// @route   POST /api/reports/daily
// @access  Private
const generateDailyReport = async (req, res) => {
  try {
    const { date, classId, format = 'json' } = req.body;
    const schoolId = req.user.school;

    const reportDate = date ? new Date(date) : new Date();
    reportDate.setHours(0, 0, 0, 0);

    // Build query
    const matchQuery = {
      school: schoolId,
      date: reportDate,
    };

    if (classId) {
      matchQuery.class = classId;
    }

    // Get attendance data
    const attendanceData = await Attendance.aggregate([
      {
        $match: matchQuery,
      },
      {
        $lookup: {
          from: 'students',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo',
        },
      },
      {
        $unwind: '$studentInfo',
      },
      {
        $lookup: {
          from: 'classes',
          localField: 'class',
          foreignField: '_id',
          as: 'classInfo',
        },
      },
      {
        $unwind: '$classInfo',
      },
      {
        $project: {
          date: 1,
          status: 1,
          markedAt: 1,
          recognitionMethod: 1,
          'studentInfo.rollNumber': 1,
          'studentInfo.firstName': 1,
          'studentInfo.lastName': 1,
          'studentInfo.gender': 1,
          'classInfo.name': 1,
          'classInfo.grade': 1,
          'classInfo.section': 1,
        },
      },
      {
        $sort: { 'classInfo.grade': 1, 'classInfo.section': 1, 'studentInfo.rollNumber': 1 },
      },
    ]);

    // Calculate summary
    const summary = {
      total: attendanceData.length,
      present: attendanceData.filter(a => a.status === 'present').length,
      absent: attendanceData.filter(a => a.status === 'absent').length,
      late: attendanceData.filter(a => a.status === 'late').length,
      leave: attendanceData.filter(a => a.status === 'leave').length,
    };

    summary.presentPercentage = summary.total > 0 
      ? ((summary.present + summary.late) / summary.total * 100).toFixed(2) 
      : 0;

    // Get school info
    const school = await School.findById(schoolId).select('name code address');

    const reportData = {
      school,
      date: reportDate,
      summary,
      attendance: attendanceData,
      generatedAt: new Date(),
      generatedBy: req.user.name,
    };

    if (format === 'json') {
      return res.status(200).json({
        success: true,
        data: reportData,
      });
    } else if (format === 'excel') {
      return await generateExcelReport(res, reportData, 'daily');
    } else if (format === 'pdf') {
      return await generatePDFReport(res, reportData, 'daily');
    }
  } catch (error) {
    console.error('Generate daily report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating report',
    });
  }
};

// @desc    Generate monthly attendance report
// @route   POST /api/reports/monthly
// @access  Private
const generateMonthlyReport = async (req, res) => {
  try {
    const { month, year, classId, format = 'json' } = req.body;
    const schoolId = req.user.school;

    const reportMonth = month || new Date().getMonth() + 1;
    const reportYear = year || new Date().getFullYear();

    const startDate = new Date(reportYear, reportMonth - 1, 1);
    const endDate = new Date(reportYear, reportMonth, 0);
    endDate.setHours(23, 59, 59, 999);

    // Build query
    const matchQuery = {
      school: schoolId,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    if (classId) {
      matchQuery.class = classId;
    }

    // Get attendance data grouped by student
    const monthlyData = await Attendance.aggregate([
      {
        $match: matchQuery,
      },
      {
        $lookup: {
          from: 'students',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo',
        },
      },
      {
        $unwind: '$studentInfo',
      },
      {
        $group: {
          _id: {
            studentId: '$student',
            rollNumber: '$studentInfo.rollNumber',
            name: {
              $concat: ['$studentInfo.firstName', ' ', { $ifNull: ['$studentInfo.lastName', ''] }],
            },
            class: '$class',
          },
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: {
              $cond: [
                { $in: ['$status', ['present', 'late']] },
                1,
                0,
              ],
            },
          },
          absentDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'absent'] }, 1, 0],
            },
          },
          lateDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'late'] }, 1, 0],
            },
          },
          leaveDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'leave'] }, 1, 0],
            },
          },
          attendance: {
            $push: {
              date: '$date',
              status: '$status',
            },
          },
        },
      },
      {
        $lookup: {
          from: 'classes',
          localField: '_id.class',
          foreignField: '_id',
          as: 'classInfo',
        },
      },
      {
        $unwind: '$classInfo',
      },
      {
        $project: {
          studentId: '$_id.studentId',
          rollNumber: '$_id.rollNumber',
          studentName: '$_id.name',
          className: '$classInfo.name',
          grade: '$classInfo.grade',
          section: '$classInfo.section',
          totalDays: 1,
          presentDays: 1,
          absentDays: 1,
          lateDays: 1,
          leaveDays: 1,
          attendancePercentage: {
            $multiply: [
              { $divide: ['$presentDays', '$totalDays'] },
              100,
            ],
          },
          attendance: 1,
        },
      },
      {
        $sort: { grade: 1, section: 1, rollNumber: 1 },
      },
    ]);

    // Calculate overall summary
    const overallSummary = monthlyData.reduce(
      (acc, student) => {
        acc.totalStudents++;
        acc.totalDays += student.totalDays;
        acc.totalPresent += student.presentDays;
        acc.totalAbsent += student.absentDays;
        acc.totalLate += student.lateDays;
        acc.totalLeave += student.leaveDays;
        return acc;
      },
      {
        totalStudents: 0,
        totalDays: 0,
        totalPresent: 0,
        totalAbsent: 0,
        totalLate: 0,
        totalLeave: 0,
      }
    );

    overallSummary.attendancePercentage = overallSummary.totalDays > 0
      ? (overallSummary.totalPresent / overallSummary.totalDays * 100).toFixed(2)
      : 0;

    // Get school info
    const school = await School.findById(schoolId).select('name code address');

    const reportData = {
      school,
      month: reportMonth,
      year: reportYear,
      startDate,
      endDate,
      overallSummary,
      studentData: monthlyData,
      generatedAt: new Date(),
      generatedBy: req.user.name,
    };

    if (format === 'json') {
      return res.status(200).json({
        success: true,
        data: reportData,
      });
    } else if (format === 'excel') {
      return await generateExcelReport(res, reportData, 'monthly');
    } else if (format === 'pdf') {
      return await generatePDFReport(res, reportData, 'monthly');
    }
  } catch (error) {
    console.error('Generate monthly report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating monthly report',
    });
  }
};

// @desc    Generate government scheme report (Mid-Day Meal)
// @route   POST /api/reports/government/mid-day-meal
// @access  Private
const generateMidDayMealReport = async (req, res) => {
  try {
    const { date, classId, format = 'json' } = req.body;
    const schoolId = req.user.school;

    const reportDate = date ? new Date(date) : new Date();
    reportDate.setHours(0, 0, 0, 0);

    // Get attendance for the day with mid-day meal eligibility
    const attendanceData = await Attendance.aggregate([
      {
        $match: {
          school: schoolId,
          date: reportDate,
          status: { $in: ['present', 'late'] },
        },
      },
      {
        $lookup: {
          from: 'students',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo',
        },
      },
      {
        $unwind: '$studentInfo',
      },
      {
        $match: {
          'studentInfo.midDayMealEligible': true,
        },
      },
      {
        $lookup: {
          from: 'classes',
          localField: 'class',
          foreignField: '_id',
          as: 'classInfo',
        },
      },
      {
        $unwind: '$classInfo',
      },
      {
        $project: {
          date: 1,
          'studentInfo.rollNumber': 1,
          'studentInfo.firstName': 1,
          'studentInfo.lastName': 1,
          'studentInfo.gender': 1,
          'studentInfo.dateOfBirth': 1,
          'studentInfo.aadhaarNumber': 1,
          'classInfo.name': 1,
          'classInfo.grade': 1,
          'classInfo.section': 1,
          midDayMealServed: 1,
        },
      },
      {
        $sort: { 'classInfo.grade': 1, 'classInfo.section': 1, 'studentInfo.rollNumber': 1 },
      },
    ]);

    // Calculate summary
    const summary = {
      totalEligible: attendanceData.length,
      totalServed: attendanceData.filter(a => a.midDayMealServed).length,
      totalNotServed: attendanceData.filter(a => !a.midDayMealServed).length,
      boys: attendanceData.filter(a => a.studentInfo.gender === 'Male').length,
      girls: attendanceData.filter(a => a.studentInfo.gender === 'Female').length,
    };

    // Get school info
    const school = await School.findById(schoolId).select('name code address principalName');

    const reportData = {
      reportType: 'Mid-Day Meal Report',
      school,
      date: reportDate,
      summary,
      attendance: attendanceData,
      generatedAt: new Date(),
      generatedBy: req.user.name,
      remarks: 'Generated by Automated Attendance System',
    };

    // Update attendance records with mid-day meal served status
    await Attendance.updateMany(
      {
        school: schoolId,
        date: reportDate,
        status: { $in: ['present', 'late'] },
        'student': { $in: attendanceData.map(a => a.studentInfo._id) },
      },
      {
        $set: { midDayMealServed: true },
      }
    );

    if (format === 'json') {
      return res.status(200).json({
        success: true,
        data: reportData,
      });
    } else if (format === 'excel') {
      return await generateExcelReport(res, reportData, 'mid-day-meal');
    } else if (format === 'pdf') {
      return await generatePDFReport(res, reportData, 'mid-day-meal');
    }
  } catch (error) {
    console.error('Generate mid-day meal report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating mid-day meal report',
    });
  }
};

// Helper: Generate Excel Report
const generateExcelReport = async (res, reportData, reportType) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    // Add headers based on report type
    switch (reportType) {
      case 'daily':
        worksheet.columns = [
          { header: 'Roll No', key: 'rollNumber', width: 10 },
          { header: 'Student Name', key: 'studentName', width: 25 },
          { header: 'Class', key: 'className', width: 15 },
          { header: 'Gender', key: 'gender', width: 10 },
          { header: 'Status', key: 'status', width: 10 },
          { header: 'Marked At', key: 'markedAt', width: 20 },
          { header: 'Method', key: 'method', width: 15 },
        ];
        break;

      case 'monthly':
        worksheet.columns = [
          { header: 'Roll No', key: 'rollNumber', width: 10 },
          { header: 'Student Name', key: 'studentName', width: 25 },
          { header: 'Class', key: 'className', width: 15 },
          { header: 'Total Days', key: 'totalDays', width: 12 },
          { header: 'Present', key: 'presentDays', width: 10 },
          { header: 'Absent', key: 'absentDays', width: 10 },
          { header: 'Late', key: 'lateDays', width: 10 },
          { header: 'Leave', key: 'leaveDays', width: 10 },
          { header: 'Percentage', key: 'percentage', width: 15 },
        ];
        break;

      case 'mid-day-meal':
        worksheet.columns = [
          { header: 'Roll No', key: 'rollNumber', width: 10 },
          { header: 'Student Name', key: 'studentName', width: 25 },
          { header: 'Class', key: 'className', width: 15 },
          { header: 'Gender', key: 'gender', width: 10 },
          { header: 'Date of Birth', key: 'dob', width: 15 },
          { header: 'Aadhaar', key: 'aadhaar', width: 20 },
          { header: 'Meal Served', key: 'mealServed', width: 15 },
        ];
        break;
    }

    // Add school info as first rows
    worksheet.addRow(['School:', reportData.school.name]);
    worksheet.addRow(['School Code:', reportData.school.code]);
    worksheet.addRow(['Report Date:', moment(reportData.date).format('DD/MM/YYYY')]);
    worksheet.addRow(['Generated By:', reportData.generatedBy]);
    worksheet.addRow(['Generated At:', moment(reportData.generatedAt).format('DD/MM/YYYY HH:mm')]);
    worksheet.addRow([]); // Empty row

    // Add data rows
    if (reportData.attendance) {
      reportData.attendance.forEach((record) => {
        worksheet.addRow(transformRecordForExcel(record, reportType));
      });
    } else if (reportData.studentData) {
      reportData.studentData.forEach((student) => {
        worksheet.addRow({
          rollNumber: student.rollNumber,
          studentName: student.studentName,
          className: `${student.grade}-${student.section}`,
          totalDays: student.totalDays,
          presentDays: student.presentDays,
          absentDays: student.absentDays,
          lateDays: student.lateDays,
          leaveDays: student.leaveDays,
          percentage: `${student.attendancePercentage.toFixed(2)}%`,
        });
      });
    }

    // Set response headers
    const filename = `attendance_report_${reportType}_${moment().format('YYYYMMDD_HHmmss')}.xlsx`;
    
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating Excel report',
    });
  }
};

// Helper: Transform record for Excel
const transformRecordForExcel = (record, reportType) => {
  switch (reportType) {
    case 'daily':
      return {
        rollNumber: record.studentInfo?.rollNumber || record.rollNumber,
        studentName: `${record.studentInfo?.firstName || ''} ${record.studentInfo?.lastName || ''}`.trim(),
        className: record.classInfo ? `${record.classInfo.grade}-${record.classInfo.section}` : '',
        gender: record.studentInfo?.gender || '',
        status: record.status,
        markedAt: moment(record.markedAt).format('DD/MM/YYYY HH:mm'),
        method: record.recognitionMethod,
      };

    case 'mid-day-meal':
      return {
        rollNumber: record.studentInfo.rollNumber,
        studentName: `${record.studentInfo.firstName} ${record.studentInfo.lastName || ''}`.trim(),
        className: `${record.classInfo.grade}-${record.classInfo.section}`,
        gender: record.studentInfo.gender,
        dob: moment(record.studentInfo.dateOfBirth).format('DD/MM/YYYY'),
        aadhaar: record.studentInfo.aadhaarNumber || 'Not Available',
        mealServed: record.midDayMealServed ? 'Yes' : 'No',
      };

    default:
      return {};
  }
};

// Helper: Generate PDF Report
const generatePDFReport = async (res, reportData, reportType) => {
  try {
    const doc = new PDFDocument({ margin: 50 });
    const filename = `attendance_report_${reportType}_${moment().format('YYYYMMDD_HHmmss')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Add header
    doc.fontSize(20).text('Attendance Report', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).text(`School: ${reportData.school.name}`, { align: 'left' });
    doc.text(`School Code: ${reportData.school.code}`, { align: 'left' });
    doc.text(`Report Date: ${moment(reportData.date).format('DD/MM/YYYY')}`, { align: 'left' });
    doc.text(`Generated By: ${reportData.generatedBy}`, { align: 'left' });
    doc.text(`Generated At: ${moment(reportData.generatedAt).format('DD/MM/YYYY HH:mm')}`, { align: 'left' });
    
    doc.moveDown();

    // Add summary
    if (reportData.summary) {
      doc.fontSize(14).text('Summary', { underline: true });
      doc.moveDown(0.5);
      
      Object.keys(reportData.summary).forEach((key) => {
        if (typeof reportData.summary[key] === 'number') {
          doc.text(`${key}: ${reportData.summary[key]}`, { align: 'left' });
        }
      });
      doc.moveDown();
    }

    // Add data table header
    const tableTop = doc.y;
    const headers = getPDFHeaders(reportType);
    const columnWidth = 500 / headers.length;

    headers.forEach((header, i) => {
      doc.text(header, 50 + (i * columnWidth), tableTop, { width: columnWidth, align: 'left' });
    });

    doc.moveDown();
    
    // Add data rows
    let yPos = doc.y;
    const data = reportData.attendance || reportData.studentData || [];

    data.forEach((row, index) => {
      if (yPos > 700) { // New page if near bottom
        doc.addPage();
        yPos = 50;
      }

      const rowData = transformRecordForPDF(row, reportType);
      headers.forEach((header, i) => {
        doc.text(rowData[i] || '', 50 + (i * columnWidth), yPos, { width: columnWidth, align: 'left' });
      });

      yPos += 20;
    });

    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating PDF report',
    });
  }
};

// Helper: Get PDF headers
const getPDFHeaders = (reportType) => {
  switch (reportType) {
    case 'daily':
      return ['Roll No', 'Name', 'Class', 'Gender', 'Status', 'Time'];
    case 'monthly':
      return ['Roll No', 'Name', 'Class', 'Present', 'Absent', 'Percentage'];
    case 'mid-day-meal':
      return ['Roll No', 'Name', 'Class', 'Gender', 'DOB', 'Meal Served'];
    default:
      return [];
  }
};

// Helper: Transform record for PDF
const transformRecordForPDF = (record, reportType) => {
  switch (reportType) {
    case 'daily':
      return [
        record.studentInfo?.rollNumber || '',
        `${record.studentInfo?.firstName || ''} ${record.studentInfo?.lastName || ''}`.trim(),
        record.classInfo ? `${record.classInfo.grade}-${record.classInfo.section}` : '',
        record.studentInfo?.gender || '',
        record.status,
        moment(record.markedAt).format('HH:mm'),
      ];

    case 'monthly':
      return [
        record.rollNumber,
        record.studentName,
        `${record.grade}-${record.section}`,
        record.presentDays.toString(),
        record.absentDays.toString(),
        `${record.attendancePercentage.toFixed(2)}%`,
      ];

    case 'mid-day-meal':
      return [
        record.studentInfo.rollNumber,
        `${record.studentInfo.firstName} ${record.studentInfo.lastName || ''}`.trim(),
        `${record.classInfo.grade}-${record.classInfo.section}`,
        record.studentInfo.gender,
        moment(record.studentInfo.dateOfBirth).format('DD/MM/YY'),
        record.midDayMealServed ? 'Yes' : 'No',
      ];

    default:
      return [];
  }
};

// @desc    Get report statistics
// @route   GET /api/reports/statistics
// @access  Private
const getReportStatistics = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's attendance
    const todayAttendance = await Attendance.aggregate([
      {
        $match: {
          school: schoolId,
          date: { $gte: new Date(today.setHours(0, 0, 0, 0)) },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // This month's statistics
    const monthStats = await Attendance.aggregate([
      {
        $match: {
          school: schoolId,
          date: { $gte: monthStart },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          present: {
            $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] },
          },
          total: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Class-wise statistics
    const classStats = await Class.aggregate([
      {
        $match: { school: schoolId, isActive: true },
      },
      {
        $lookup: {
          from: 'attendances',
          let: { classId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$class', '$$classId'] },
                    { $gte: ['$date', monthStart] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                present: {
                  $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] },
                },
                total: { $sum: 1 },
              },
            },
          ],
          as: 'attendance',
        },
      },
      {
        $project: {
          name: 1,
          grade: 1,
          section: 1,
          studentCount: 1,
          present: { $ifNull: [{ $arrayElemAt: ['$attendance.present', 0] }, 0] },
          total: { $ifNull: [{ $arrayElemAt: ['$attendance.total', 0] }, 0] },
          percentage: {
            $cond: [
              { $gt: [{ $ifNull: [{ $arrayElemAt: ['$attendance.total', 0] }, 0] }, 0] },
              {
                $multiply: [
                  {
                    $divide: [
                      { $ifNull: [{ $arrayElemAt: ['$attendance.present', 0] }, 0] },
                      { $ifNull: [{ $arrayElemAt: ['$attendance.total', 0] }, 0] },
                    ],
                  },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $sort: { grade: 1, section: 1 },
      },
    ]);

    // Student with best attendance
    const bestAttendance = await Attendance.aggregate([
      {
        $match: {
          school: schoolId,
          date: { $gte: monthStart },
        },
      },
      {
        $group: {
          _id: '$student',
          present: {
            $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] },
          },
          total: { $sum: 1 },
        },
      },
      {
        $match: { total: { $gte: 10 } }, // At least 10 days of attendance
      },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: '_id',
          as: 'studentInfo',
        },
      },
      {
        $unwind: '$studentInfo',
      },
      {
        $project: {
          studentId: '$_id',
          rollNumber: '$studentInfo.rollNumber',
          name: {
            $concat: ['$studentInfo.firstName', ' ', { $ifNull: ['$studentInfo.lastName', ''] }],
          },
          present: 1,
          total: 1,
          percentage: { $multiply: [{ $divide: ['$present', '$total'] }, 100] },
        },
      },
      {
        $sort: { percentage: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        today: todayAttendance,
        monthStats,
        classStats,
        bestAttendance,
      },
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics',
    });
  }
};

// @desc    Generate student report
// @route   GET /api/reports/student/:studentId
// @access  Private
const generateStudentReport = async (req, res) => {
  try {
    const { studentId } = req.params;
    const schoolId = req.user.school;

    // Verify student belongs to school
    const student = await Student.findOne({
      _id: studentId,
      school: schoolId,
    }).populate('class', 'name grade section');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Get attendance history
    const attendanceHistory = await Attendance.find({
      student: studentId,
    })
      .sort({ date: -1 })
      .limit(30);

    // Calculate statistics
    const totalDays = attendanceHistory.length;
    const presentDays = attendanceHistory.filter(a => 
      a.status === 'present' || a.status === 'late'
    ).length;
    
    const attendancePercentage = totalDays > 0 ? 
      Math.round((presentDays / totalDays) * 100) : 0;

    const reportData = {
      student: {
        id: student._id,
        rollNumber: student.rollNumber,
        name: `${student.firstName} ${student.lastName || ''}`.trim(),
        class: student.class,
      },
      statistics: {
        totalDays,
        presentDays,
        absentDays: totalDays - presentDays,
        attendancePercentage,
      },
      history: attendanceHistory,
      generatedAt: new Date(),
      generatedBy: req.user.name,
    };

    res.status(200).json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error('Generate student report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating student report',
    });
  }
};

// @desc    Export report
// @route   POST /api/reports/export
// @access  Private
const exportReport = async (req, res) => {
  try {
    const { format, data } = req.body;

    // In a real implementation, this would export the report in the specified format
    // For now, we'll return a mock response
    res.status(200).json({
      success: true,
      message: `Report exported successfully in ${format} format`,
      data: {
        exported: true,
        format,
      },
    });
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error exporting report',
    });
  }
};

module.exports = {
  generateDailyReport,
  generateMonthlyReport,
  generateMidDayMealReport,
  getReportStatistics,
  generateStudentReport,
  exportReport,
};