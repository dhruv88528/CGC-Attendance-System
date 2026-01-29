const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add school name'],
    unique: true,
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Please add school code'],
    unique: true,
    uppercase: true,
  },
  logo: {
    type: String, // Base64 or URL
  },
  schoolType: {
    type: String, // Any value allowed - no enum restriction
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: {
      type: String,
      default: 'India',
    },
  },
  contact: {
    phone: String,
    email: String,
    principalName: String,
  },
  establishmentYear: {
    type: Number,
  },
  studentCapacity: {
    type: Number,
  },
  academicYear: {
    type: String,
    required: true,
  },
  totalStudents: {
    type: Number,
    default: 0,
  },
  totalTeachers: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  settings: {
    attendanceStartTime: {
      type: String,
      default: '09:00',
    },
    attendanceEndTime: {
      type: String,
      default: '10:00',
    },
    lateThreshold: {
      type: Number,
      default: 15, // minutes
    },
    offlineModeEnabled: {
      type: Boolean,
      default: true,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

schoolSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('School', schoolSchema);