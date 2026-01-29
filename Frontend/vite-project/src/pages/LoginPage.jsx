import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  School,
  Users,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle,
  Wifi,
  Camera,
  Hash
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { apiMethods } from '../utils/api';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState('teacher');
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    schoolCode: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(credentials.email)) {
        toast.error('Please enter a valid email address (e.g., user@school.com)', { id: 'login-validation' });
        setIsLoading(false);
        return;
      }

      // For teacher login, school code is required
      if (userType === 'teacher' && !credentials.schoolCode) {
        toast.error('School code is required for teacher login', { id: 'login-validation' });
        setIsLoading(false);
        return;
      }

      const loginData = {
        email: credentials.email,
        password: credentials.password,
        ...(userType === 'teacher' && { schoolCode: credentials.schoolCode })
      };

      const response = await apiMethods.login(loginData);

      if (response.success) {
        const userData = response.data?.user || response.data;
        const token = response.data?.token || response.token;

        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);

        toast.success('Login successful!', { id: 'login-success' });

        // Redirect based on role
        if (userData.role === 'admin' || userType === 'admin') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/teacher';
        }
      } else {
        toast.error(response.message || 'Invalid credentials', { id: 'login-error' });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed. Please check your credentials.', { id: 'login-error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply blur-3xl opacity-20 animate-pulse"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <School size={40} className="text-white" />
              </div>
              <Sparkles className="absolute -top-3 -right-3 text-yellow-400 animate-bounce-slow" size={24} />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Smart Attendance System
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Automated facial recognition attendance for rural schools. Simple, Fast, and Accurate.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Login Form Section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-2xl border-0">
              {/* Form Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Welcome Back 👋
                </h2>
                <p className="text-gray-600">Sign in to your account</p>
              </div>

              {/* User Type Selection */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setUserType('teacher')}
                  className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center transition-all ${userType === 'teacher'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <Users size={24} className="mb-2" />
                  <span className="font-medium">Teacher</span>
                </button>
                <button
                  onClick={() => setUserType('admin')}
                  className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center transition-all ${userType === 'admin'
                    ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <School size={24} className="mb-2" />
                  <span className="font-medium">Admin</span>
                </button>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={credentials.email}
                      onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      className="w-full pl-10 pr-12 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* School Code Field - Only for Teacher */}
                {userType === 'teacher' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      School Code *
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        placeholder="Enter school code (e.g., SCH001)"
                        value={credentials.schoolCode}
                        onChange={(e) => setCredentials({ ...credentials, schoolCode: e.target.value.toUpperCase() })}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all uppercase"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Ask your school administrator for the code</p>
                  </div>
                )}

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2" />
                    <span className="text-sm">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    onClick={() => {
                      if (credentials.email) {
                        toast.success(`📧 Password reset link sent to ${credentials.email}`, { id: 'forgot-password' })
                      } else {
                        toast.error('Please enter your email address first', { id: 'forgot-password' })
                      }
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Sign In as {userType === 'admin' ? 'Administrator' : 'Teacher'}
                </Button>
              </form>

              {/* Footer */}
              <div className="mt-6 pt-6 border-t text-center">
                <p className="text-sm text-gray-600 mb-3">
                  New school?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/signup')}
                    className="text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Register Your School
                  </button>
                </p>
                <p className="text-xs text-gray-500">
                  Teachers: Contact your school admin for account access
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-gray-800">Why Schools Love Us</h3>

            {[
              {
                icon: Camera,
                title: 'AI Face Recognition',
                description: 'Automatically recognizes students with 99% accuracy using camera',
                color: 'text-blue-600'
              },
              {
                icon: Wifi,
                title: 'Works Offline',
                description: 'No internet needed. Data syncs automatically when online',
                color: 'text-green-600'
              },
              {
                icon: CheckCircle,
                title: 'Easy to Use',
                description: 'Simple interface designed for rural school teachers',
                color: 'text-purple-600'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-start p-4 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color.replace('text-', 'bg-')} bg-opacity-10 mr-4`}>
                  <feature.icon className={feature.color} size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">{feature.title}</h4>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </motion.div>
            ))}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">500+</div>
                <div className="text-sm text-gray-600">Schools</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">50K+</div>
                <div className="text-sm text-gray-600">Students</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">99%</div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;