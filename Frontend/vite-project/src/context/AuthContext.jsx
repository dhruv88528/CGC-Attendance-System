import React, { createContext, useState, useContext, useEffect } from 'react'
import { apiMethods } from '../utils/api'
import { STORAGE_KEYS, ROLES } from '../constants'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
        const savedUser = localStorage.getItem(STORAGE_KEYS.USER)
        
        if (token && savedUser) {
          setUser(JSON.parse(savedUser))
          setIsAuthenticated(true)
          
          // Verify token with server
          await apiMethods.refreshToken()
        }
      } catch (error) {
        // Token is invalid, clear storage
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER)
      } finally {
        setLoading(false)
      }
    }
    
    loadUser()
  }, [])

  // Login function
  const login = async (email, password, role) => {
    try {
      setLoading(true)
      const response = await apiMethods.login({ email, password, role })
      
      const { token, user: userData } = response.data
      
      // Store token and user data
      localStorage.setItem(STORAGE_KEYS.TOKEN, token)
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData))
      
      setUser(userData)
      setIsAuthenticated(true)
      
      toast.success('Login successful!')
      return { success: true, user: userData }
    } catch (error) {
      toast.error(error.message || 'Login failed')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await apiMethods.logout()
    } catch (error) {
      // Ignore logout errors
    } finally {
      // Clear local storage
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)
      
      // Clear state
      setUser(null)
      setIsAuthenticated(false)
      
      toast.success('Logged out successfully')
    }
  }

  // Register function (for admin only)
  const register = async (userData) => {
    try {
      const response = await apiMethods.register(userData)
      toast.success('Registration successful!')
      return { success: true, data: response.data }
    } catch (error) {
      toast.error(error.message || 'Registration failed')
      return { success: false, error: error.message }
    }
  }

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const response = await apiMethods.updateUser(user.id, userData)
      
      // Update local storage
      const updatedUser = { ...user, ...userData }
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser))
      setUser(updatedUser)
      
      toast.success('Profile updated successfully')
      return { success: true, user: updatedUser }
    } catch (error) {
      toast.error(error.message || 'Update failed')
      return { success: false, error: error.message }
    }
  }

  // Check if user has role
  const hasRole = (role) => {
    if (!user) return false
    return user.role === role
  }

  // Check if user has permission
  const hasPermission = (permission) => {
    if (!user) return false
    
    // Admin has all permissions
    if (user.role === ROLES.ADMIN) return true
    
    // Check teacher permissions
    const teacherPermissions = [
      'view_students',
      'manage_students',
      'mark_attendance',
      'view_reports'
    ]
    
    return teacherPermissions.includes(permission)
  }

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      await apiMethods.forgotPassword(email)
      toast.success('Password reset link sent to your email')
      return { success: true }
    } catch (error) {
      toast.error(error.message || 'Failed to send reset link')
      return { success: false, error: error.message }
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    register,
    updateProfile,
    hasRole,
    hasPermission,
    forgotPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}