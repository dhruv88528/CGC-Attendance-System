const mongoose = require('mongoose');

const faceEncodingSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    unique: true,
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
  },
  embeddings: {
    type: [[Number]], // Array of arrays for multiple face encodings
    required: true,
  },
  encodingVersion: {
    type: String,
    default: '1.0',
  },
  modelUsed: {
    type: String,
    enum: ['facenet', 'dlib', 'mobilefacenet'],
    default: 'facenet',
  },
  sampleImages: [{
    url: String,
    timestamp: Date,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  lastVerified: {
    type: Date,
    default: Date.now,
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

faceEncodingSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster retrieval
faceEncodingSchema.index({ school: 1 });
faceEncodingSchema.index({ student: 1 });

module.exports = mongoose.model('FaceEncoding', faceEncodingSchema);