const mongoose = require('mongoose');

/**
 * Student Schema - Production Ready
 * 
 * Stores student details with face recognition data:
 * - faceImage: Base64 string for admin viewing/verification
 * - faceEncoding: 512-D vector for FaceNet AI matching
 */
const studentSchema = new mongoose.Schema({
  // Basic Student Information
  rollNumber: {
    type: String,
    required: [true, 'Roll number is required'],
    trim: true,
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
    default: '',
  },
  dateOfBirth: {
    type: Date,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
  },

  // Parent/Guardian Information
  parentName: {
    type: String,
    trim: true,
  },
  parentPhone: {
    type: String,
    trim: true,
  },
  parentFcmToken: {
    type: String,
    trim: true,
    // FCM token for sending push notifications to parent
  },
  address: {
    type: String,
  },
  aadhaarNumber: {
    type: String,
    sparse: true,
  },

  // School References
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class is required'],
    index: true,  // Index for fast queries by class
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School is required'],
    index: true,  // Index for data isolation by school
  },

  // Face Recognition Data
  faceRegistered: {
    type: Boolean,
    default: false,
    index: true,  // Index for filtering students with faces
  },
  faceImage: {
    type: String,  // Base64 encoded image string
    default: null,
    // Used for: Admin viewing, verification, re-training
  },
  faceEncoding: {
    type: [Number],  // 512-dimension face encoding vector (FaceNet)
    default: null,
    validate: {
      validator: function (arr) {
        // If encoding exists, it must be exactly 512 dimensions (FaceNet)
        return arr === null || arr.length === 512;
      },
      message: 'Face encoding must be exactly 512 dimensions (FaceNet)'
    },
    // Used for: Fast face matching in attendance
  },
  lastFaceUpdate: {
    type: Date,
  },

  // Attendance Statistics
  attendanceStats: {
    totalPresent: {
      type: Number,
      default: 0,
    },
    totalAbsent: {
      type: Number,
      default: 0,
    },
    attendancePercentage: {
      type: Number,
      default: 0,
    },
    lastAttendance: {
      type: Date,
    },
  },

  // Student Status
  enrollmentDate: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,  // Index for filtering active students
  },
  midDayMealEligible: {
    type: Boolean,
    default: true,
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for Performance
studentSchema.index({ school: 1, rollNumber: 1 }, { unique: true }); // Unique roll number per school
studentSchema.index({ school: 1, class: 1, isActive: 1 }); // Fast class queries
studentSchema.index({ school: 1, faceRegistered: 1 }); // Face recognition queries

// Pre-save middleware
studentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();

  // Auto-set faceRegistered flag (512 dimensions for FaceNet)
  if (this.faceEncoding && this.faceEncoding.length === 512) {
    this.faceRegistered = true;
    this.lastFaceUpdate = Date.now();
  }

  next();
});

// Virtual for full name
studentSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName || ''}`.trim();
});

// Method to update attendance stats
studentSchema.methods.updateAttendanceStats = async function (status) {
  if (status === 'present') {
    this.attendanceStats.totalPresent += 1;
  } else if (status === 'absent') {
    this.attendanceStats.totalAbsent += 1;
  }

  const total = this.attendanceStats.totalPresent + this.attendanceStats.totalAbsent;
  if (total > 0) {
    this.attendanceStats.attendancePercentage =
      Math.round((this.attendanceStats.totalPresent / total) * 100);
  }

  this.attendanceStats.lastAttendance = new Date();
  await this.save();
};

module.exports = mongoose.model('Student', studentSchema);