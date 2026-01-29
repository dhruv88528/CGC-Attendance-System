import React from 'react'
import { Navigate } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Pages
import LoginPage from './pages/LoginPage'
import SchoolSignupPage from './pages/SchoolSignupPage'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentsPage from './pages/StudentsPage'
import AttendancePage from './pages/AttendancePage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import ClassManagementPage from './pages/ClassManagementPage'
import TeacherManagementPage from './pages/TeacherManagementPage'
import SchoolSetupPage from './pages/SchoolSetupPage'
import StudentRegistrationPage from './pages/StudentRegistrationPage'

const routes = [
  {
    path: '/login',
    component: LoginPage,
    protected: false
  },
  {
    path: '/signup',
    component: SchoolSignupPage,
    protected: false
  },
  {
    path: '/dashboard',
    component: () => <ProtectedRoute><Dashboard /></ProtectedRoute>,
    protected: true
  },
  {
    path: '/admin',
    component: () => <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>,
    protected: true
  },
  {
    path: '/teacher',
    component: () => <ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>,
    protected: true
  },
  {
    path: '/students',
    component: () => <ProtectedRoute><StudentsPage /></ProtectedRoute>,
    protected: true
  },
  {
    path: '/attendance',
    component: () => <ProtectedRoute><AttendancePage /></ProtectedRoute>,
    protected: true
  },
  {
    path: '/reports',
    component: () => <ProtectedRoute><ReportsPage /></ProtectedRoute>,
    protected: true
  },
  {
    path: '/settings',
    component: () => <ProtectedRoute><SettingsPage /></ProtectedRoute>,
    protected: true
  },
  {
    path: '/classes',
    component: () => <ProtectedRoute role="admin"><ClassManagementPage /></ProtectedRoute>,
    protected: true
  },
  {
    path: '/teachers',
    component: () => <ProtectedRoute role="admin"><TeacherManagementPage /></ProtectedRoute>,
    protected: true
  },
  {
    path: '/school-setup',
    component: () => <ProtectedRoute role="admin"><SchoolSetupPage /></ProtectedRoute>,
    protected: true
  },
  {
    path: '/student-registration',
    component: () => <ProtectedRoute><StudentRegistrationPage /></ProtectedRoute>,
    protected: true
  },
  {
    path: '/',
    component: () => <Navigate to="/login" replace />,
    protected: false
  }
]

export default routes