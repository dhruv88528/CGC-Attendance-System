const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const moment = require('moment');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const School = require('../models/School');

/**
 * Report generation service
 */
class ReportService {
  /**
   * Generate attendance report in Excel format
   * @param {Object} options 
   * @returns {Promise<Buffer>}
   */
  async generateExcelAttendanceReport(options) {
    const { classId, startDate, endDate, schoolId } = options;

    // Get class information
    const classInfo = await Class.findById(classId);
    if (!classInfo || classInfo.school.toString() !== schoolId.toString()) {
      throw new Error('Class not found or not authorized');
    }

    // Get students in class
    const students = await Student.find({
      class: classId,
      isActive: true
    }).sort({ rollNumber: 1 });

    // Get attendance records
    const attendanceRecords = await Attendance.find({
      class: classId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ date: 1 });

    // Group attendance by date
    const attendanceByDate = {};
    attendanceRecords.forEach(record => {
      const dateStr = moment(record.date).format('YYYY-MM-DD');
      if (!attendanceByDate[dateStr]) {
        attendanceByDate[dateStr] = {};
      }
      attendanceByDate[dateStr][record.student.toString()] = record;
    });

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Report');

    // Define columns
    const columns = [
      { header: 'Roll No', key: 'rollNumber', width: 10 },
      { header: 'Student Name', key: 'name', width: 25 }
    ];

    // Add date columns
    const dates = Object.keys(attendanceByDate).sort();
    dates.forEach(date => {
      columns.push({
        header: moment(date).format('DD/MM'),
        key: `date_${date}`,
        width: 8
      });
    });

    // Add summary columns
    columns.push(
      { header: 'Total Present', key: 'totalPresent', width: 15 },
      { header: 'Total Absent', key: 'totalAbsent', width: 15 },
      { header: 'Attendance %', key: 'percentage', width: 15 }
    );

    worksheet.columns = columns;

    // Add data rows
    students.forEach((student, index) => {
      const row = {
        rollNumber: student.rollNumber,
        name: `${student.firstName} ${student.lastName || ''}`.trim()
      };

      let presentCount = 0;
      let totalCount = dates.length;

      dates.forEach(date => {
        const record = attendanceByDate[date][student._id.toString()];
        if (record) {
          row[`date_${date}`] = record.status.charAt(0).toUpperCase();
          if (record.status === 'present' || record.status === 'late') {
            presentCount++;
          }
        } else {
          row[`date_${date}`] = 'A';
        }
      });

      row.totalPresent = presentCount;
      row.totalAbsent = totalCount - presentCount;
      row.percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

      worksheet.addRow(row);
    });

    // Add header styling
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCCCCC' }
      };
    });

    // Add report metadata
    worksheet.HeaderFooter.firstHeader = `Attendance Report - ${classInfo.name} (${moment(startDate).format('DD/MM/YYYY')} to ${moment(endDate).format('DD/MM/YYYY')})`;

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  /**
   * Generate attendance report in PDF format
   * @param {Object} options 
   * @returns {Promise<Buffer>}
   */
  async generatePDFAttendanceReport(options) {
    const { classId, startDate, endDate, schoolId } = options;

    // Get class information
    const classInfo = await Class.findById(classId);
    if (!classInfo || classInfo.school.toString() !== schoolId.toString()) {
      throw new Error('Class not found or not authorized');
    }

    // Get students in class
    const students = await Student.find({
      class: classId,
      isActive: true
    }).sort({ rollNumber: 1 });

    // Get attendance records
    const attendanceRecords = await Attendance.find({
      class: classId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ date: 1 });

    // Group attendance by date
    const attendanceByDate = {};
    attendanceRecords.forEach(record => {
      const dateStr = moment(record.date).format('YYYY-MM-DD');
      if (!attendanceByDate[dateStr]) {
        attendanceByDate[dateStr] = {};
      }
      attendanceByDate[dateStr][record.student.toString()] = record;
    });

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {});

    // Add title
    doc.fontSize(18).text('Attendance Report', { align: 'center' });
    doc.moveDown();

    // Add class information
    doc.fontSize(12)
      .text(`Class: ${classInfo.name}`)
      .text(`Period: ${moment(startDate).format('DD/MM/YYYY')} to ${moment(endDate).format('DD/MM/YYYY')}`)
      .moveDown();

    // Create table
    const dates = Object.keys(attendanceByDate).sort();
    const cellWidth = 25;
    const cellHeight = 20;
    const startX = 50;
    const startY = doc.y;

    // Draw table header
    doc.rect(startX, startY, cellWidth * 2, cellHeight).stroke();
    doc.rect(startX + cellWidth * 2, startY, cellWidth * dates.length, cellHeight).stroke();
    doc.rect(startX + cellWidth * (2 + dates.length), startY, cellWidth * 3, cellHeight).stroke();

    doc.fontSize(10)
      .text('Roll No', startX + 5, startY + 7)
      .text('Name', startX + cellWidth + 5, startY + 7);

    let headerX = startX + cellWidth * 2 + 5;
    dates.forEach(date => {
      doc.text(moment(date).format('DD/MM'), headerX, startY + 7);
      headerX += cellWidth;
    });

    doc.text('Present', startX + cellWidth * (2 + dates.length) + 5, startY + 7)
      .text('Absent', startX + cellWidth * (3 + dates.length) + 5, startY + 7)
      .text('%', startX + cellWidth * (4 + dates.length) + 5, startY + 7);

    // Draw student rows
    let currentY = startY + cellHeight;
    students.forEach((student, index) => {
      const rowY = currentY + (index * cellHeight);

      // Draw row borders
      doc.rect(startX, rowY, cellWidth * 2, cellHeight).stroke();
      doc.rect(startX + cellWidth * 2, rowY, cellWidth * dates.length, cellHeight).stroke();
      doc.rect(startX + cellWidth * (2 + dates.length), rowY, cellWidth * 3, cellHeight).stroke();

      // Add student data
      doc.text(student.rollNumber, startX + 5, rowY + 7)
        .text(`${student.firstName} ${student.lastName || ''}`.trim(), startX + cellWidth + 5, rowY + 7);

      let presentCount = 0;
      let dateX = startX + cellWidth * 2 + 5;
      dates.forEach(date => {
        const record = attendanceByDate[date][student._id.toString()];
        let status = 'A';
        if (record) {
          status = record.status.charAt(0).toUpperCase();
          if (record.status === 'present' || record.status === 'late') {
            presentCount++;
          }
        }
        doc.text(status, dateX, rowY + 7);
        dateX += cellWidth;
      });

      const totalCount = dates.length;
      const absentCount = totalCount - presentCount;
      const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

      doc.text(presentCount.toString(), startX + cellWidth * (2 + dates.length) + 5, rowY + 7)
        .text(absentCount.toString(), startX + cellWidth * (3 + dates.length) + 5, rowY + 7)
        .text(percentage.toString() + '%', startX + cellWidth * (4 + dates.length) + 5, rowY + 7);
    });

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
    });
  }

  /**
   * Generate student history report
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  async generateStudentHistoryReport(options) {
    const { studentId, startDate, endDate, schoolId } = options;

    // Get student information
    const student = await Student.findById(studentId);
    if (!student || student.school.toString() !== schoolId.toString()) {
      throw new Error('Student not found or not authorized');
    }

    // Get attendance history
    const attendanceHistory = await Attendance.find({
      student: studentId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ date: -1 });

    // Calculate statistics
    const totalDays = attendanceHistory.length;
    const presentDays = attendanceHistory.filter(a => 
      a.status === 'present' || a.status === 'late'
    ).length;
    
    const absentDays = totalDays - presentDays;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    return {
      student: {
        id: student._id,
        rollNumber: student.rollNumber,
        name: `${student.firstName} ${student.lastName || ''}`.trim(),
        class: student.class
      },
      period: {
        startDate,
        endDate
      },
      statistics: {
        totalDays,
        presentDays,
        absentDays,
        attendancePercentage
      },
      history: attendanceHistory.map(record => ({
        date: record.date,
        status: record.status,
        markedAt: record.markedAt,
        remarks: record.remarks
      }))
    };
  }

  /**
   * Generate monthly summary report
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  async generateMonthlySummaryReport(options) {
    const { month, year, schoolId } = options;

    // Get all classes in school
    const classes = await Class.find({ school: schoolId, isActive: true });

    const classReports = [];

    for (const classInfo of classes) {
      // Get students in class
      const students = await Student.find({
        class: classInfo._id,
        isActive: true
      });

      // Get attendance for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of month

      const attendanceRecords = await Attendance.find({
        class: classInfo._id,
        date: {
          $gte: startDate,
          $lte: endDate
        }
      });

      // Calculate class statistics
      const totalStudents = students.length;
      const totalDaysInMonth = endDate.getDate();
      
      // Group by student
      const studentStats = {};
      students.forEach(student => {
        studentStats[student._id.toString()] = {
          present: 0,
          absent: 0
        };
      });

      attendanceRecords.forEach(record => {
        const studentId = record.student.toString();
        if (studentStats[studentId]) {
          if (record.status === 'present' || record.status === 'late') {
            studentStats[studentId].present++;
          } else if (record.status === 'absent') {
            studentStats[studentId].absent++;
          }
        }
      });

      // Calculate averages
      let totalPresent = 0;
      let totalAbsent = 0;
      
      Object.values(studentStats).forEach(stats => {
        totalPresent += stats.present;
        totalAbsent += stats.absent;
      });

      const avgAttendance = totalStudents > 0 ? 
        Math.round(((totalPresent / totalStudents) / totalDaysInMonth) * 100) : 0;

      classReports.push({
        class: {
          id: classInfo._id,
          name: classInfo.name,
          grade: classInfo.grade,
          section: classInfo.section
        },
        statistics: {
          totalStudents,
          averageAttendance: avgAttendance,
          totalPresent,
          totalAbsent
        }
      });
    }

    return {
      month,
      year,
      classes: classReports
    };
  }
}

module.exports = new ReportService();