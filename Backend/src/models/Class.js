const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add class name'],
    trim: true,
  },
  grade: {
    type: Number,
    required: [true, 'Please add grade level'],
    min: 1,
    max: 12,
  },
  section: {
    type: String,
    required: [true, 'Please add section'],
    uppercase: true,
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  academicYear: {
    type: String,
    required: true,
  },
  studentCount: {
    type: Number,
    default: 0,
  },
  subjects: [{
    type: String,
  }],
  schedule: {
    startTime: String,
    endTime: String,
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    }],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for unique class-section combination per school
classSchema.index({ school: 1, grade: 1, section: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);