import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Calendar,
  Users,
  TrendingUp,
  Camera,
  BookOpen,
  Bell,
  Clock,
  CheckCircle,
  BarChart3,
  AlertCircle,
  Loader2,
  LogOut
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { ShimmerDashboard } from '../components/common/Shimmer';
import AttendanceCalendar from '../components/teacher/AttendanceCalendar';
import { useAuth } from '../context/AuthContext';
import { apiMethods } from '../utils/api';
import toast from 'react-hot-toast';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Logout handler

  const [isLoading, setIsLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    todayPresent: 0,
    attendanceRate: 0
  });

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);

    let classesData = [];
    let studentsData = [];

    try {
      // Fetch classes
      const classesRes = await apiMethods.getClasses();
      if (classesRes?.data) {
        classesData = classesRes.data;
        setClasses(classesData);
      }
    } catch (e) {
      console.log('Could not fetch classes');
    }

    try {
      // Fetch students
      const studentsRes = await apiMethods.getStudents();
      if (studentsRes?.data) {
        studentsData = studentsRes.data.students || studentsRes.data || [];
        setStudents(studentsData);
      }
    } catch (e) {
      console.log('Could not fetch students');
    }

    setStats({
      totalStudents: studentsData.length,
      totalClasses: classesData.length,
      todayPresent: 0,
      attendanceRate: 0
    });

    setIsLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Quick actions
  const quickActions = [
    { title: 'Take Attendance', icon: Camera, color: 'from-blue-500 to-cyan-500', path: '/attendance' },
    { title: 'View Students', icon: Users, color: 'from-green-500 to-emerald-500', path: '/students' },
    { title: 'View Reports', icon: BarChart3, color: 'from-purple-500 to-pink-500', path: '/reports' },
    { title: 'View Calendar', icon: Calendar, color: 'from-orange-500 to-amber-500', action: 'calendar' },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 md:mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mr-3 md:mr-4 flex-shrink-0">
              <User className="text-white" size={24} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-3xl font-bold text-gray-800 truncate">Teacher Dashboard</h1>
              <p className="text-sm md:text-base text-gray-600 truncate">Welcome back, {user?.name || 'Teacher'}! 👋</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Button
              variant="primary"
              icon={Camera}
              size="sm"
              onClick={() => navigate('/attendance')}
              className="text-sm md:text-base"
            >
              <span className="hidden sm:inline">Take </span>Attendance
            </Button>
            <Button
              variant="outline"
              icon={LogOut}
              size="sm"
              onClick={handleLogout}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Loading State - Shimmer Effect */}
      {isLoading ? (
        <ShimmerDashboard />
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            <Card className="p-3 md:p-5">
              <div className="flex items-center justify-center mb-2 md:mb-4">
                <div className="p-2 md:p-3 rounded-xl bg-blue-100">
                  <Users className="text-blue-600" size={20} />
                </div>
              </div>
              <div className="text-xl md:text-2xl font-bold text-gray-800 text-center">{stats.totalStudents}</div>
              <div className="text-xs md:text-sm text-gray-600 mt-1 text-center">Total Students</div>
            </Card>

            <Card className="p-3 md:p-5">
              <div className="flex items-center justify-center mb-2 md:mb-4">
                <div className="p-2 md:p-3 rounded-xl bg-green-100">
                  <BookOpen className="text-green-600" size={20} />
                </div>
              </div>
              <div className="text-xl md:text-2xl font-bold text-gray-800 text-center">{stats.totalClasses}</div>
              <div className="text-xs md:text-sm text-gray-600 mt-1 text-center">Total Classes</div>
            </Card>

            <Card className="p-3 md:p-5">
              <div className="flex items-center justify-center mb-2 md:mb-4">
                <div className="p-2 md:p-3 rounded-xl bg-purple-100">
                  <CheckCircle className="text-purple-600" size={20} />
                </div>
              </div>
              <div className="text-xl md:text-2xl font-bold text-gray-800 text-center">{stats.todayPresent}</div>
              <div className="text-xs md:text-sm text-gray-600 mt-1 text-center">Present Today</div>
            </Card>

            <Card className="p-3 md:p-5">
              <div className="flex items-center justify-center mb-2 md:mb-4">
                <div className="p-2 md:p-3 rounded-xl bg-orange-100">
                  <TrendingUp className="text-orange-600" size={20} />
                </div>
              </div>
              <div className="text-xl md:text-2xl font-bold text-gray-800 text-center">{stats.attendanceRate}%</div>
              <div className="text-xs md:text-sm text-gray-600 mt-1 text-center">Attendance Rate</div>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2"
            >
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ y: -5 }}
                      whileTap={{ scale: 0.98 }}
                      className={`bg-gradient-to-br ${action.color} rounded-2xl p-5 text-white cursor-pointer shadow-lg hover:shadow-xl transition-all`}
                      onClick={() => action.action === 'calendar' ? setShowCalendar(true) : navigate(action.path)}
                    >
                      <action.icon size={24} className="mb-3" />
                      <h3 className="font-semibold text-lg">{action.title}</h3>
                      <p className="text-white/80 text-sm mt-2">Click to get started</p>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* My Classes */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <BookOpen className="mr-2" size={20} />
                    My Classes
                  </h2>
                </div>

                {classes.length > 0 ? (
                  <div className="space-y-3">
                    {classes.slice(0, 5).map((cls, index) => (
                      <div key={cls._id || index} className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mr-3">
                          <span className="text-white font-bold text-sm">
                            {cls.grade || cls.name?.charAt(0) || 'C'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">
                            {cls.name || `Class ${cls.grade}`}
                          </div>
                          <div className="text-sm text-gray-600">
                            Section {cls.section} • {cls.studentCount || 0} students
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto text-gray-400 mb-3" size={32} />
                    <p className="text-gray-600">No classes assigned yet</p>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Students List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Recent Students</h2>
                <Button variant="outline" size="sm" onClick={() => navigate('/students')}>
                  View All
                </Button>
              </div>

              {students.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-left">Roll No</th>
                        <th className="p-3 text-left">Name</th>
                        <th className="p-3 text-left">Class</th>
                        <th className="p-3 text-left">Face Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.slice(0, 5).map((student) => (
                        <tr key={student._id} className="border-t hover:bg-gray-50">
                          <td className="p-3 font-medium">{student.rollNumber}</td>
                          <td className="p-3">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mr-2">
                                <span className="text-white text-sm font-medium">
                                  {(student.firstName || 'S').charAt(0)}
                                </span>
                              </div>
                              {student.firstName} {student.lastName}
                            </div>
                          </td>
                          <td className="p-3">
                            {student.class?.name || student.class?.grade || 'N/A'} - {student.class?.section || 'N/A'}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${student.faceRegistered
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {student.faceRegistered ? 'Registered' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto text-gray-400 mb-3" size={32} />
                  <p className="text-gray-600">No students found</p>
                  <p className="text-sm text-gray-500">Students will appear here when added by admin</p>
                </div>
              )}
            </Card>
          </motion.div>
        </>
      )}

      {/* Attendance Calendar Modal */}
      {showCalendar && (
        <AttendanceCalendar onClose={() => setShowCalendar(false)} />
      )}
    </div>
  );
};

export default TeacherDashboard;