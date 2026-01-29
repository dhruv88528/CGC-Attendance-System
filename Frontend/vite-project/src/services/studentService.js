import { apiMethods } from '../utils/api'
import { useOffline } from '../context/OfflineContext'

class StudentService {
  constructor() {
    // Initialize with offline context if available
    this.offlineContext = null
  }

  // Set offline context (to be called from component)
  setOfflineContext(context) {
    this.offlineContext = context
  }

  // Get all students
  async getStudents(params = {}) {
    try {
      const response = await apiMethods.getStudents(params)
      return {
        success: true,
        students: response.data.students,
        total: response.data.total,
        page: response.data.page,
        pages: response.data.pages
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch students'
      }
    }
  }

  // Get single student
  async getStudent(id) {
    try {
      const response = await apiMethods.getStudent(id)
      return {
        success: true,
        student: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch student'
      }
    }
  }

  // Create new student
  async createStudent(studentData) {
    try {
      const response = await apiMethods.createStudent(studentData)
      
      // If offline mode is enabled, also store locally
      if (this.offlineContext?.shouldUseOfflineMode()) {
        this.offlineContext.storeStudent(studentData)
      }
      
      return {
        success: true,
        student: response.data,
        message: 'Student created successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to create student'
      }
    }
  }

  // Update student
  async updateStudent(id, studentData) {
    try {
      const response = await apiMethods.updateStudent(id, studentData)
      
      // If offline mode is enabled, also store locally
      if (this.offlineContext?.shouldUseOfflineMode()) {
        this.offlineContext.storeStudent({ ...studentData, _id: id })
      }
      
      return {
        success: true,
        student: response.data,
        message: 'Student updated successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to update student'
      }
    }
  }

  // Delete student
  async deleteStudent(id) {
    try {
      await apiMethods.deleteStudent(id)
      
      // If offline mode is enabled, queue the delete
      if (this.offlineContext?.shouldUseOfflineMode()) {
        this.offlineContext.queueRequest('DELETE', `/students/${id}`, {})
      }
      
      return {
        success: true,
        message: 'Student deleted successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to delete student'
      }
    }
  }

  // Register face for student
  async registerFace(studentId, image) {
    try {
      const response = await apiMethods.registerFace(studentId, { image })
      return {
        success: true,
        data: response.data,
        message: 'Face registered successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to register face'
      }
    }
  }

  // Search students
  async searchStudents(query, filters = {}) {
    try {
      const params = { search: query, ...filters }
      const response = await apiMethods.getStudents(params)
      return {
        success: true,
        students: response.data.students,
        total: response.data.total
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to search students'
      }
    }
  }

  // Bulk upload students
  async bulkUpload(studentsData) {
    try {
      // This would typically be a separate endpoint
      // For now, we'll process individually
      const results = []
      
      for (const student of studentsData) {
        try {
          const result = await this.createStudent(student)
          results.push({
            student,
            success: result.success,
            error: result.error
          })
        } catch (error) {
          results.push({
            student,
            success: false,
            error: error.message
          })
        }
      }
      
      const successful = results.filter(r => r.success).length
      const failed = results.filter(r => !r.success).length
      
      return {
        success: true,
        results,
        message: `Uploaded ${successful} students successfully, ${failed} failed`
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to upload students'
      }
    }
  }

  // Get students by class
  async getStudentsByClass(classId, section = null) {
    try {
      const params = { class: classId }
      if (section) params.section = section
      
      const response = await apiMethods.getStudents(params)
      return {
        success: true,
        students: response.data.students,
        total: response.data.total
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch class students'
      }
    }
  }

  // Export students data
  async exportStudents(format = 'excel', filters = {}) {
    try {
      // Get all students with filters
      const response = await apiMethods.getStudents({ ...filters, limit: 1000 })
      const students = response.data.students
      
      // Prepare data for export
      const exportData = students.map(student => ({
        'Student ID': student.studentId,
        'First Name': student.name.firstName,
        'Last Name': student.name.lastName,
        'Class': student.class?.name || 'N/A',
        'Section': student.section,
        'Roll Number': student.rollNumber,
        'Date of Birth': student.dateOfBirth,
        'Gender': student.gender,
        'Father Name': student.fatherName,
        'Mother Name': student.motherName,
        'Contact': student.contactNumber,
        'Address': student.address,
        'Status': student.isActive ? 'Active' : 'Inactive'
      }))
      
      return {
        success: true,
        data: exportData,
        format,
        fileName: `students_${new Date().toISOString().split('T')[0]}.${format}`
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to export students'
      }
    }
  }

  // Get student statistics
  async getStudentStats() {
    try {
      const response = await apiMethods.getStudents({ limit: 1 })
      
      // This would typically come from a dedicated stats endpoint
      // For now, we'll estimate
      return {
        success: true,
        stats: {
          total: response.data.total || 0,
          active: response.data.total || 0, // Assuming all are active
          byClass: {}, // Would be populated from backend
          byGender: {} // Would be populated from backend
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get student statistics'
      }
    }
  }
}

export default new StudentService()