import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, role }) => {
  const location = useLocation();

  // Check if user is logged in
  let user = null;
  let token = null;

  try {
    const userStr = localStorage.getItem('user');
    const tokenStr = localStorage.getItem('token');

    if (userStr && userStr !== 'null' && userStr !== 'undefined') {
      user = JSON.parse(userStr);
    }
    token = tokenStr;
  } catch (e) {
    console.error('Error parsing user data:', e);
    user = null;
    token = null;
  }

  console.log('ProtectedRoute check:', { user, token, role, path: location.pathname });

  // If no user/token, redirect to login
  if (!user || !token) {
    console.log('No user or token, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is specified, check if user has that role
  // For admin role, only check if accessing admin-specific routes
  if (role === 'admin' && user.role !== 'admin') {
    console.log('Admin route accessed by non-admin, redirecting to teacher');
    return <Navigate to="/teacher" replace />;
  }

  // For teacher role, only check if accessing teacher-specific routes  
  if (role === 'teacher' && user.role !== 'teacher') {
    console.log('Teacher route accessed by non-teacher, redirecting to admin');
    return <Navigate to="/admin" replace />;
  }

  // User is authenticated and authorized
  return children;
};

// Hook to check authentication
export const useAuth = () => {
  let user = null;
  let token = null;

  try {
    const userStr = localStorage.getItem('user');
    const tokenStr = localStorage.getItem('token');

    if (userStr && userStr !== 'null' && userStr !== 'undefined') {
      user = JSON.parse(userStr);
    }
    token = tokenStr;
  } catch (e) {
    console.error('Error in useAuth:', e);
  }

  return {
    isAuthenticated: !!user && !!token,
    user,
    token,
    isAdmin: user?.role === 'admin',
    isTeacher: user?.role === 'teacher'
  };
};

export default ProtectedRoute;