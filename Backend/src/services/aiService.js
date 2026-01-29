const axios = require('axios');

class AIService {
  constructor() {
    this.baseURL = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/v1';
    this.timeout = 30000; // 30 seconds
  }

  // @desc    Recognize faces in image
  // @param   {String} imageBase64 - Base64 encoded image
  // @param   {String} schoolId - School ID
  // @param   {String} classId - Class ID (optional)
  // @return  {Array} Recognition results
  async recognizeFaces(imageBase64, schoolId, classId = null) {
    try {
      const response = await axios.post(
        `${this.baseURL}/recognize`,
        {
          image: imageBase64,
          school_id: schoolId,
          class_id: classId,
          timestamp: new Date().toISOString(),
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: this.timeout,
        }
      );

      if (response.data.success) {
        return response.data.recognitions || [];
      } else {
        console.error('AI service error:', response.data.message);
        return [];
      }
    } catch (error) {
      console.error('AI service call failed:', error.message);
      
      // Fallback to mock data for development
      if (process.env.NODE_ENV === 'development') {
        return this.getMockRecognitionResults();
      }
      
      throw new Error('Face recognition service unavailable');
    }
  }

  // @desc    Register student face
  // @param   {String} studentId - Student ID
  // @param   {String} imageBase64 - Base64 encoded image
  // @param   {String} schoolId - School ID
  // @return  {Object} Registration result
  async registerFace(studentId, imageBase64, schoolId) {
    try {
      const response = await axios.post(
        `${this.baseURL}/register`,
        {
          student_id: studentId,
          image: imageBase64,
          school_id: schoolId,
          timestamp: new Date().toISOString(),
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: this.timeout,
        }
      );

      return {
        success: response.data.success || false,
        encodingId: response.data.encoding_id,
        message: response.data.message || 'Face registered successfully',
      };
    } catch (error) {
      console.error('Face registration failed:', error.message);
      
      // Fallback for development
      if (process.env.NODE_ENV === 'development') {
        return {
          success: true,
          encodingId: `mock_${Date.now()}`,
          message: 'Face registered (mock)',
        };
      }
      
      throw new Error('Face registration service unavailable');
    }
  }

  // @desc    Verify face registration
  // @param   {String} studentId - Student ID
  // @param   {String} imageBase64 - Base64 encoded image
  // @return  {Object} Verification result
  async verifyFace(studentId, imageBase64) {
    try {
      const response = await axios.post(
        `${this.baseURL}/verify`,
        {
          student_id: studentId,
          image: imageBase64,
          timestamp: new Date().toISOString(),
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: this.timeout,
        }
      );

      return {
        success: response.data.success || false,
        isMatch: response.data.is_match || false,
        confidence: response.data.confidence || 0,
        message: response.data.message || 'Verification completed',
      };
    } catch (error) {
      console.error('Face verification failed:', error.message);
      
      // Fallback for development
      if (process.env.NODE_ENV === 'development') {
        return {
          success: true,
          isMatch: true,
          confidence: 0.85,
          message: 'Face verified (mock)',
        };
      }
      
      throw new Error('Face verification service unavailable');
    }
  }

  // @desc    Get embeddings for offline mode
  // @param   {String} schoolId - School ID
  // @param   {String} classId - Class ID (optional)
  // @return  {Object} Embeddings data
  async getEmbeddingsForOffline(schoolId, classId = null) {
    try {
      const response = await axios.get(
        `${this.baseURL}/embeddings`,
        {
          params: {
            school_id: schoolId,
            class_id: classId,
          },
          timeout: this.timeout,
        }
      );

      return {
        success: true,
        embeddings: response.data.embeddings || [],
        modelVersion: response.data.model_version || '1.0',
        lastUpdated: response.data.last_updated || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to get embeddings:', error.message);
      
      // Return empty embeddings for offline fallback
      return {
        success: false,
        embeddings: [],
        modelVersion: 'unknown',
        lastUpdated: new Date().toISOString(),
        message: 'Using local cache',
      };
    }
  }

  // @desc    Get system status
  // @return  {Object} Service status
  async getServiceStatus() {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000,
      });

      return {
        online: true,
        status: response.data.status || 'healthy',
        version: response.data.version || 'unknown',
        responseTime: response.data.response_time || 0,
      };
    } catch (error) {
      return {
        online: false,
        status: 'unavailable',
        version: 'unknown',
        error: error.message,
      };
    }
  }

  // @desc    Mock recognition results for development
  getMockRecognitionResults() {
    return [
      {
        student_id: 'mock_student_1',
        confidence: 0.92,
        bounding_box: [100, 100, 200, 200],
        face_encoding_id: 'mock_encoding_1',
      },
      {
        student_id: 'mock_student_2',
        confidence: 0.87,
        bounding_box: [300, 150, 400, 250],
        face_encoding_id: 'mock_encoding_2',
      },
    ];
  }

  // @desc    Process batch recognition
  // @param   {Array} images - Array of base64 images
  // @param   {String} schoolId - School ID
  // @return  {Array} Batch recognition results
  async batchRecognize(images, schoolId) {
    try {
      const response = await axios.post(
        `${this.baseURL}/batch-recognize`,
        {
          images: images,
          school_id: schoolId,
          batch_id: `batch_${Date.now()}`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60 seconds for batch
        }
      );

      return {
        success: true,
        results: response.data.results || [],
        batchId: response.data.batch_id,
        processed: response.data.processed || 0,
        failed: response.data.failed || 0,
      };
    } catch (error) {
      console.error('Batch recognition failed:', error.message);
      throw new Error('Batch recognition service unavailable');
    }
  }

  // @desc    Train/update model with new data
  // @param   {Array} trainingData - Training data
  // @return  {Object} Training result
  async trainModel(trainingData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/train`,
        {
          training_data: trainingData,
          timestamp: new Date().toISOString(),
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 120000, // 2 minutes for training
        }
      );

      return {
        success: response.data.success || false,
        modelVersion: response.data.model_version,
        accuracy: response.data.accuracy,
        message: response.data.message || 'Model training completed',
        trainingTime: response.data.training_time,
      };
    } catch (error) {
      console.error('Model training failed:', error.message);
      throw new Error('Model training service unavailable');
    }
  }
}

module.exports = new AIService();