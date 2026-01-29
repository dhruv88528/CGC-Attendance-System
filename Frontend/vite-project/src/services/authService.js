import { apiMethods } from '../utils/api'
import { STORAGE_KEYS } from '../constants'

class AuthService {
  // Login user
  async login(email, password, role) {
    try {
      const response = await apiMethods.login({ email, password, role })
      
      if (response.data?.token && response.data?.user) {
        // Store token and user data
        localStorage.setItem(STORAGE_KEYS.TOKEN, response.data.token)
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.user))
        
        return {
          success: true,
          user: response.data.user,
          token: response.data.token
        }
      }
      
      return {
        success: false,
        error: 'Invalid response from server'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Login failed'
      }
    }
  }

  // Logout user
  async logout() {
    try {
      await apiMethods.logout()
    } catch (error) {
      // Ignore logout errors
    } finally {
      // Clear local storage
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)
    }
  }

  // Register new user (admin only)
  async register(userData) {
    try {
      const response = await apiMethods.register(userData)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Registration failed'
      }
    }
  }

  // Get current user
  getCurrentUser() {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER)
    return userStr ? JSON.parse(userStr) : null
  }

  // Get auth token
  getToken() {
    return localStorage.getItem(STORAGE_KEYS.TOKEN)
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken()
    return !!token
  }

  // Check if user has specific role
  hasRole(role) {
    const user = this.getCurrentUser()
    return user?.role === role
  }

  // Check if user has permission
  hasPermission(permission) {
    const user = this.getCurrentUser()
    
    if (!user) return false
    
    // Admin has all permissions
    if (user.role === 'admin') return true
    
    // Check teacher permissions
    const teacherPermissions = [
      'view_students',
      'manage_students',
      'mark_attendance',
      'view_reports'
    ]
    
    return teacherPermissions.includes(permission)
  }

  // Update user profile
  async updateProfile(userData) {
    try {
      const user = this.getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        }
      }
      
      const response = await apiMethods.updateUser(user.id, userData)
      
      // Update local storage
      const updatedUser = { ...user, ...userData }
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser))
      
      return {
        success: true,
        user: updatedUser
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Update failed'
      }
    }
  }

  // Forgot password
  async forgotPassword(email) {
    try {
      await apiMethods.forgotPassword(email)
      return {
        success: true,
        message: 'Password reset link sent to your email'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to send reset link'
      }
    }
  }

  // Refresh token
  async refreshToken() {
    try {
      const response = await apiMethods.refreshToken()
      
      if (response.data?.token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, response.data.token)
        return {
          success: true,
          token: response.data.token
        }
      }
      
      return {
        success: false,
        error: 'Invalid response from server'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Token refresh failed'
      }
    }
  }

  // Clear auth data
  clearAuthData() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
  }
}

export default new AuthService()