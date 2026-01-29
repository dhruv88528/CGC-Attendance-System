const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const School = require('../models/School');
const mongoose = require('mongoose');

class OfflineSyncService {
  constructor() {
    this.syncInterval = parseInt(process.env.SYNC_INTERVAL) || 300000; // 5 minutes
    this.maxRetries = 3;
    this.batchSize = 50;
  }

  // @desc    Initialize offline sync service
  initialize() {
    if (process.env.OFFLINE_MODE_ENABLED === 'true') {
      console.log('Offline sync service initialized');
      
      // Start periodic sync
      setInterval(() => {
        this.syncPendingRecords();
      }, this.syncInterval);
    }
  }

  // @desc    Sync pending offline records
  async syncPendingRecords() {
    try {
      console.log('Starting offline records sync...');

      const pendingRecords = await Attendance.find({
        syncStatus: 'pending',
      }).limit(this.batchSize);

      if (pendingRecords.length === 0) {
        console.log('No pending records to sync');
        return;
      }

      console.log(`Syncing ${pendingRecords.length} pending records`);

      const results = {
        synced: 0,
        failed: 0,
        details: [],
      };

      for (const record of pendingRecords) {
        try {
          // Validate record before sync
          const isValid = await this.validateRecord(record);
          if (!isValid) {
            record.syncStatus = 'failed';
            record.remarks = 'Validation failed during sync';
            await record.save();
            
            results.failed++;
            results.details.push({
              recordId: record._id,
              status: 'failed',
              reason: 'Validation failed',
            });
            continue;
          }

          // Remove offlineId for server storage
          const offlineId = record.offlineId;
          record.offlineId = undefined;
          record.syncStatus = 'synced';
          record.syncedAt = new Date();

          await record.save();

          // Update student attendance stats
          await this.updateStudentStats(record.student);

          results.synced++;
          results.details.push({
            recordId: record._id,
            offlineId,
            status: 'synced',
            syncedAt: record.syncedAt,
          });

        } catch (error) {
          console.error(`Error syncing record ${record._id}:`, error);
          
          // Increment retry count
          record.retryCount = (record.retryCount || 0) + 1;
          
          if (record.retryCount >= this.maxRetries) {
            record.syncStatus = 'failed';
            record.remarks = `Sync failed after ${this.maxRetries} retries`;
          }
          
          await record.save();
          
          results.failed++;
          results.details.push({
            recordId: record._id,
            status: 'failed',
            reason: error.message,
          });
        }
      }

      console.log(`Sync completed: ${results.synced} synced, ${results.failed} failed`);

      // Send sync report if configured
      if (process.env.SYNC_REPORT_EMAIL) {
        await this.sendSyncReport(results);
      }

      return results;

    } catch (error) {
      console.error('Offline sync error:', error);
    }
  }

  // @desc    Validate offline record
  async validateRecord(record) {
    try {
      // Check if student exists and is active
      const student = await Student.findById(record.student);
      if (!student || !student.isActive) {
        return false;
      }

      // Check if class exists
      const classExists = await mongoose.model('Class').exists({ _id: record.class });
      if (!classExists) {
        return false;
      }

      // Check if school exists
      const schoolExists = await School.exists({ _id: record.school });
      if (!schoolExists) {
        return false;
      }

      // Check for duplicate attendance (same student, same date)
      const existingAttendance = await Attendance.findOne({
        student: record.student,
        date: record.date,
        _id: { $ne: record._id },
        syncStatus: 'synced',
      });

      if (existingAttendance) {
        console.log(`Duplicate attendance found for student ${record.student} on ${record.date}`);
        
        // Merge with existing record or update it
        existingAttendance.status = record.status;
        existingAttendance.remarks = record.remarks || existingAttendance.remarks;
        existingAttendance.checkInTime = record.checkInTime || existingAttendance.checkInTime;
        await existingAttendance.save();
        
        // Delete the offline duplicate
        await Attendance.deleteOne({ _id: record._id });
        
        return false; // Record was merged, not synced as new
      }

      // Validate date (not in future)
      const recordDate = new Date(record.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (recordDate > today) {
        return false;
      }

      // Validate status
      const validStatuses = ['present', 'absent', 'late', 'leave'];
      if (!validStatuses.includes(record.status)) {
        return false;
      }

      return true;

    } catch (error) {
      console.error('Record validation error:', error);
      return false;
    }
  }

  // @desc    Update student attendance statistics
  async updateStudentStats(studentId) {
    try {
      const stats = await Attendance.aggregate([
        {
          $match: {
            student: new mongoose.Types.ObjectId(studentId),
            syncStatus: 'synced',
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

    } catch (error) {
      console.error('Update student stats error:', error);
    }
  }

  // @desc    Get sync status
  async getSyncStatus(schoolId = null) {
    try {
      const query = { syncStatus: 'pending' };
      
      if (schoolId) {
        query.school = schoolId;
      }

      const pendingCount = await Attendance.countDocuments(query);
      const failedCount = await Attendance.countDocuments({ 
        ...query,
        syncStatus: 'failed' 
      });
      
      const lastSync = await Attendance.findOne({ syncStatus: 'synced' })
        .sort({ syncedAt: -1 })
        .select('syncedAt');

      return {
        pending: pendingCount,
        failed: failedCount,
        lastSync: lastSync?.syncedAt || null,
        syncInterval: this.syncInterval,
        batchSize: this.batchSize,
      };
    } catch (error) {
      console.error('Get sync status error:', error);
      return {
        pending: 0,
        failed: 0,
        lastSync: null,
        error: error.message,
      };
    }
  }

  // @desc    Manually trigger sync
  async manualSync(schoolId = null) {
    try {
      console.log('Manual sync triggered');
      const results = await this.syncPendingRecords();
      
      return {
        success: true,
        message: 'Manual sync completed',
        results,
      };
    } catch (error) {
      console.error('Manual sync error:', error);
      return {
        success: false,
        message: 'Manual sync failed',
        error: error.message,
      };
    }
  }

  // @desc    Send sync report (placeholder for email/notification)
  async sendSyncReport(results) {
    // This would send email or notification about sync results
    console.log('Sync Report:', JSON.stringify(results, null, 2));
    
    // In a real implementation, you would:
    // 1. Send email to admin
    // 2. Send notification to concerned teachers
    // 3. Log to monitoring system
    
    return true;
  }

  // @desc    Clean up old failed records
  async cleanupOldRecords(days = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await Attendance.deleteMany({
        syncStatus: 'failed',
        createdAt: { $lt: cutoffDate },
      });

      console.log(`Cleaned up ${result.deletedCount} old failed records`);

      return {
        success: true,
        deletedCount: result.deletedCount,
        cutoffDate,
      };
    } catch (error) {
      console.error('Cleanup error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // @desc    Export offline data for backup
  async exportOfflineData(schoolId, format = 'json') {
    try {
      const pendingRecords = await Attendance.find({
        school: schoolId,
        syncStatus: 'pending',
      })
        .populate('student', 'rollNumber firstName lastName')
        .populate('class', 'name grade section')
        .populate('school', 'name code');

      const data = {
        exportDate: new Date().toISOString(),
        totalRecords: pendingRecords.length,
        records: pendingRecords.map(record => ({
          id: record._id,
          offlineId: record.offlineId,
          student: {
            id: record.student._id,
            rollNumber: record.student.rollNumber,
            name: `${record.student.firstName} ${record.student.lastName || ''}`.trim(),
          },
          class: {
            id: record.class._id,
            name: record.class.name,
            grade: record.class.grade,
            section: record.class.section,
          },
          date: record.date,
          status: record.status,
          markedAt: record.markedAt,
          remarks: record.remarks,
          createdAt: record.createdAt,
        })),
      };

      if (format === 'json') {
        return {
          success: true,
          data,
          format: 'json',
        };
      } else if (format === 'csv') {
        // Convert to CSV
        const csv = this.convertToCSV(data.records);
        return {
          success: true,
          data: csv,
          format: 'csv',
        };
      }

    } catch (error) {
      console.error('Export error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // @desc    Convert records to CSV
  convertToCSV(records) {
    const headers = ['Student Roll No', 'Student Name', 'Class', 'Date', 'Status', 'Marked At', 'Remarks'];
    
    const rows = records.map(record => [
      record.student.rollNumber,
      `${record.student.firstName} ${record.student.lastName || ''}`.trim(),
      `${record.class.grade}-${record.class.section}`,
      new Date(record.date).toLocaleDateString(),
      record.status,
      new Date(record.markedAt).toLocaleString(),
      record.remarks || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  // @desc    Import offline data (for data recovery)
  async importOfflineData(importData) {
    try {
      if (!Array.isArray(importData)) {
        throw new Error('Import data must be an array');
      }

      const results = {
        imported: 0,
        skipped: 0,
        failed: 0,
        details: [],
      };

      for (const recordData of importData) {
        try {
          // Validate import record
          const isValid = await this.validateImportRecord(recordData);
          if (!isValid) {
            results.skipped++;
            results.details.push({
              record: recordData,
              status: 'skipped',
              reason: 'Invalid record',
            });
            continue;
          }

          // Check if already exists
          const exists = await Attendance.findOne({
            student: recordData.studentId,
            date: new Date(recordData.date),
          });

          if (exists) {
            results.skipped++;
            results.details.push({
              record: recordData,
              status: 'skipped',
              reason: 'Already exists',
            });
            continue;
          }

          // Create new attendance record
          const attendance = new Attendance({
            student: recordData.studentId,
            class: recordData.classId,
            school: recordData.schoolId,
            date: new Date(recordData.date),
            status: recordData.status,
            markedBy: recordData.markedBy,
            recognitionMethod: 'offline_import',
            remarks: recordData.remarks || 'Imported from offline backup',
            syncStatus: 'synced',
            importedAt: new Date(),
          });

          await attendance.save();

          // Update student stats
          await this.updateStudentStats(recordData.studentId);

          results.imported++;
          results.details.push({
            record: recordData,
            status: 'imported',
            attendanceId: attendance._id,
          });

        } catch (error) {
          results.failed++;
          results.details.push({
            record: recordData,
            status: 'failed',
            reason: error.message,
          });
        }
      }

      return {
        success: true,
        message: `Import completed: ${results.imported} imported, ${results.skipped} skipped, ${results.failed} failed`,
        results,
      };

    } catch (error) {
      console.error('Import error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // @desc    Validate import record
  async validateImportRecord(recordData) {
    // Basic validation
    if (!recordData.studentId || !recordData.date || !recordData.status) {
      return false;
    }

    // Validate status
    const validStatuses = ['present', 'absent', 'late', 'leave'];
    if (!validStatuses.includes(recordData.status)) {
      return false;
    }

    // Check if student exists
    const studentExists = await Student.exists({ _id: recordData.studentId });
    if (!studentExists) {
      return false;
    }

    // Validate date (not in future)
    const recordDate = new Date(recordData.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (recordDate > today) {
      return false;
    }

    return true;
  }
}

module.exports = new OfflineSyncService();