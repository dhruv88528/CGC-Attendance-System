const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * @desc    Detect faces in image - STRICT human face validation
 * @route   POST /api/ai/detect
 * @access  Private/Teacher
 */
const detectFaces = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Image data is required',
      });
    }

    // Call real AI service for face detection
    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/api/detect`,
        { image },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000,
        }
      );

      return res.status(200).json({
        success: response.data.success,
        faces: response.data.faces || 0,
        message: response.data.message || 'Detection complete',
        errors: response.data.errors || [],
      });
    } catch (aiError) {
      console.error('AI service error:', aiError.message);
      // If AI service is down, return error
      return res.status(503).json({
        success: false,
        faces: 0,
        message: 'Face detection service unavailable',
        errors: ['AI service not responding'],
      });
    }
  } catch (error) {
    console.error('Detect faces error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error detecting faces',
    });
  }
};

/**
 * @desc    Recognize faces in image
 * @route   POST /api/ai/recognize
 * @access  Private/Teacher
 */
const recognizeFaces = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Image data is required',
      });
    }

    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/api/recognize`,
        { image },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000,
        }
      );

      return res.status(200).json({
        success: response.data.success,
        recognized: response.data.recognized || [],
        message: 'Recognition complete',
      });
    } catch (aiError) {
      console.error('AI service error:', aiError.message);
      return res.status(503).json({
        success: false,
        message: 'Face recognition service unavailable',
      });
    }
  } catch (error) {
    console.error('Recognize faces error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error recognizing faces',
    });
  }
};

/**
 * @desc    Encode face for recognition - Register student face
 * @route   POST /api/ai/encode
 * @access  Private/Teacher
 */
const encodeFace = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Image data is required',
      });
    }

    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/api/register-face`,
        { image },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000,
        }
      );

      return res.status(200).json({
        success: response.data.success,
        encoding: response.data.encoding || [],
        faceImage: response.data.faceImage,
        error: response.data.error,
        message: response.data.success ? 'Face encoded successfully' : response.data.error,
      });
    } catch (aiError) {
      console.error('AI service error:', aiError.message);
      return res.status(503).json({
        success: false,
        message: 'Face encoding service unavailable',
      });
    }
  } catch (error) {
    console.error('Encode face error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error encoding face',
    });
  }
};

module.exports = {
  detectFaces,
  recognizeFaces,
  encodeFace,
};