import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, School, User, Eye, EyeOff } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const LoginForm = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState('teacher');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleLogin = (e) => {
    e.preventDefault();

    // Simple validation
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    // Mock login - in real app, this would be API call
    const userData = {
      id: '1',
      name: userType === 'admin' ? 'Admin User' : 'Teacher User',
      email: formData.email,
      role: userType,
      token: 'mock-jwt-token'
    };

    // Save to localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userData.token);

    // Show success message
    toast.success(`Welcome ${userData.name}!`);

    // Redirect based on role
    if (userType === 'admin') {
      navigate('/admin');
    } else {
      navigate('/teacher');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <School size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Smart Attendance</h1>
          <p className="text-gray-600 mt-2">Rural School System</p>
        </div>

        {/* User Type Selection */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setUserType('teacher')}
            className={`flex-1 p-3 rounded-lg border-2 text-center ${userType === 'teacher'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
          >
            <User className="mx-auto mb-2" size={20} />
            Teacher
          </button>
          <button
            onClick={() => setUserType('admin')}
            className={`flex-1 p-3 rounded-lg border-2 text-center ${userType === 'admin'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
          >
            <User className="mx-auto mb-2" size={20} />
            Admin
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm">Remember me</span>
            </label>
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-800"
              onClick={() => {
                if (formData.email) {
                  toast.success(`📧 Password reset link sent to ${formData.email}`);
                } else {
                  toast.error('Enter your email first');
                }
              }}
            >
              Forgot Password?
            </button>
          </div>

          {/* Login Button */}
          <Button
            type="submit"
            className="w-full py-3"
          >
            Sign In as {userType === 'admin' ? 'Admin' : 'Teacher'}
          </Button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Demo Credentials:</p>
          <div className="text-xs space-y-1">
            <p><strong>Admin:</strong> admin@school.com / password123</p>
            <p><strong>Teacher:</strong> teacher@school.com / password123</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact support@smartattendance.com
          </p>
        </div>
      </Card>
    </div>
  );
};

export default LoginForm;