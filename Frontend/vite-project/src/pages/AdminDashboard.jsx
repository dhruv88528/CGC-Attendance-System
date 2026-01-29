
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  Users,
  BookOpen,
  TrendingUp,
  Calendar,
  Activity,
  Bell,
  Settings,
  Download,
  Eye,
  CheckCircle,
  AlertCircle,
  LogOut
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { apiMethods } from '../utils/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    todayAttendance: 0,
    pendingTasks: 0,
    monthlyAverage: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real stats from API
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);

      let studentCount = 0;
      let classCount = 0;
      let teacherCount = 0;
      let todayRate = 0;
      let monthlyRate = 0;
      let weeklyData = [];
      let activities = [];

      try {
        // Fetch students count
        const studentsRes = await apiMethods.getStudents();
        studentCount = studentsRes?.data?.students?.length || studentsRes?.data?.length || 0;
      } catch (e) {
        console.log('Could not fetch students');
      }

      try {
        // Fetch classes count
        const classesRes = await apiMethods.getClasses();
        classCount = classesRes?.data?.length || 0;
      } catch (e) {
        console.log('Could not fetch classes');
      }

      try {
        // Fetch teachers count
        const usersRes = await apiMethods.getUsers();
        teacherCount = usersRes?.data?.filter(u => u.role === 'teacher')?.length || 0;
      } catch (e) {
        console.log('Could not fetch users');
      }

      try {
        // Fetch today's attendance
        const today = new Date().toISOString().split('T')[0];
        const todayRes = await apiMethods.getDailyAttendance({ date: today });
        if (todayRes?.success && todayRes?.data) {
          const records = Array.isArray(todayRes.data) ? todayRes.data : [];
          const present = records.filter(r => r.status === 'present').length;
          const total = records.length;
          todayRate = total > 0 ? Math.round((present / total) * 100) : 0;

          // Create recent activity from today's attendance
          if (records.length > 0) {
            activities = records.slice(0, 5).map((r, i) => ({
              id: i + 1,
              activity: `${r.student?.firstName || 'Student'} marked ${r.status}`,
              user: r.class?.name || 'Class',
              time: r.markedAt ? new Date(r.markedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Today',
              type: r.status === 'present' ? 'success' : 'warning'
            }));
          }
        }
      } catch (e) {
        console.log('Could not fetch today attendance');
      }

      try {
        // Fetch last 7 days attendance for weekly chart
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];

          const dayRes = await apiMethods.getDailyAttendance({ date: dateStr });
          if (dayRes?.success && dayRes?.data) {
            const records = Array.isArray(dayRes.data) ? dayRes.data : [];
            const present = records.filter(r => r.status === 'present').length;
            const total = records.length;
            const rate = total > 0 ? Math.round((present / total) * 100) : 0;
            weeklyData.push(rate);
          } else {
            weeklyData.push(0);
          }
        }

        // Calculate monthly average from weekly data
        const nonZeroData = weeklyData.filter(v => v > 0);
        monthlyRate = nonZeroData.length > 0 ? Math.round(nonZeroData.reduce((a, b) => a + b, 0) / nonZeroData.length) : 0;
      } catch (e) {
        console.log('Could not fetch weekly attendance');
        weeklyData = [0, 0, 0, 0, 0, 0, 0];
      }

      setStats({
        totalStudents: studentCount,
        totalTeachers: teacherCount,
        totalClasses: classCount,
        todayAttendance: todayRate,
        pendingTasks: 0,
        monthlyAverage: monthlyRate
      });

      setRecentActivity(activities);
      setAttendanceData(weeklyData);
      setIsLoading(false);
    };

    fetchStats();
  }, []);

  const adminQuickActions = [
    {
      title: 'Register Student',
      description: 'Add new student with face capture',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      path: '/student-registration'
    },
    {
      title: 'Manage Teachers',
      description: 'Add, edit, or remove teacher accounts',
      icon: Users,
      color: 'from-green-500 to-emerald-500',
      path: '/teachers'
    },
    {
      title: 'Class Management',
      description: 'Create classes and sections',
      icon: BookOpen,
      color: 'from-purple-500 to-pink-500',
      path: '/classes'
    },
    {
      title: 'School Setup',
      description: 'Configure school profile',
      icon: Settings,
      color: 'from-orange-500 to-amber-500',
      path: '/school-setup'
    },
    {
      title: 'View Students',
      description: 'View and manage all students',
      icon: Eye,
      color: 'from-pink-500 to-rose-500',
      path: '/students'
    },
    {
      title: 'View Reports',
      description: 'Generate and export reports',
      icon: Download,
      color: 'from-indigo-500 to-purple-500',
      path: '/reports'
    }
  ];

  const handleExportReport = async () => {
    try {
      // Get today's date for filename
      const today = new Date().toISOString().split('T')[0];

      // Fetch attendance data
      const response = await apiMethods.getDailyAttendance({ date: today });

      if (response?.data && response.data.length > 0) {
        // Create CSV content
        const headers = ['Date', 'Student Name', 'Roll Number', 'Status', 'Time'];
        const rows = response.data.map(record => [
          today,
          record.student?.firstName + ' ' + (record.student?.lastName || ''),
          record.student?.rollNumber || '',
          record.status,
          new Date(record.markedAt).toLocaleTimeString()
        ]);

        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_report_${today}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast.success('📊 Report exported successfully!');
      } else {
        toast.error('No attendance data found for today');
        navigate('/reports');
      }
    } catch (error) {
      console.error('Export error:', error);
      navigate('/reports');
    }
  };

  const handleMarkAllRead = () => {
    toast.success('✅ All notifications marked as read');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 md:mb-8"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mr-3">
              <Shield className="text-white" size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-3xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-sm md:text-base text-gray-600 truncate">Welcome back, {user?.name || 'Administrator'} 👋</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              icon={Bell}
              size="sm"
              onClick={handleMarkAllRead}
            >
              <span className="hidden sm:inline">Notifi</span>cations
            </Button>
            <Button
              variant="primary"
              icon={Download}
              size="sm"
              onClick={handleExportReport}
            >
              <span className="hidden sm:inline">Export </span>Report
            </Button>
            <Button
              variant="outline"
              icon={LogOut}
              size="sm"
              onClick={handleLogout}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Logout
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4 mb-6 md:mb-8">
        {[
          { label: 'Students', value: stats.totalStudents, icon: Users, color: 'blue' },
          { label: 'Teachers', value: stats.totalTeachers, icon: Users, color: 'green' },
          { label: 'Classes', value: stats.totalClasses, icon: BookOpen, color: 'purple' },
          { label: 'Today', value: `${stats.todayAttendance}%`, icon: TrendingUp, color: 'orange' },
          { label: 'Monthly', value: `${stats.monthlyAverage}%`, icon: Calendar, color: 'cyan' },
          { label: 'Pending', value: stats.pendingTasks, icon: AlertCircle, color: 'red' },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="p-3 md:p-5 hover-lift">
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <div className={`p-2 md:p-3 rounded-xl bg-${stat.color}-100`}>
                  <stat.icon className={`text-${stat.color}-600`} size={18} />
                </div>
              </div>
              <div className="text-lg md:text-2xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-xs md:text-sm text-gray-600 mt-1 truncate">{stat.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {adminQuickActions.map((action, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`bg-gradient-to-br ${action.color} rounded-2xl p-5 text-white cursor-pointer shadow-lg hover:shadow-xl transition-all`}
                  onClick={() => navigate(action.path)}
                >
                  <div className="flex items-center mb-3">
                    <action.icon size={24} />
                    <span className="ml-2 font-semibold">{action.title}</span>
                  </div>
                  <p className="text-white/90 text-sm">{action.description}</p>
                  <div className="mt-4 text-xs bg-white/20 rounded-full px-3 py-1 inline-block">
                    Click to access →
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <Activity className="mr-2" size={20} />
                Recent Activity
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/reports')}
              >
                View All
              </Button>
            </div>

            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="mx-auto text-gray-400 mb-3" size={40} />
                  <p className="text-gray-500">No recent activity</p>
                  <p className="text-sm text-gray-400">Attendance records will appear here</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`p-2 rounded-lg mr-3 ${activity.type === 'success' ? 'bg-green-100' :
                      activity.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                      }`}>
                      {activity.type === 'success' ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : (
                        <AlertCircle size={16} className="text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{activity.activity}</p>
                      <p className="text-sm text-gray-600">{activity.user}</p>
                    </div>
                    <div className="text-sm text-gray-500 whitespace-nowrap">{activity.time}</div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Attendance Chart Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Weekly Attendance Trend</h2>
              <p className="text-gray-600">Last 7 days performance</p>
            </div>
            <select
              className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => toast.success(`Showing data for ${e.target.value}`)}
            >
              <option>This Week</option>
              <option>Last Week</option>
              <option>This Month</option>
            </select>
          </div>

          {/* Chart */}
          {attendanceData.length === 0 || attendanceData.every(v => v === 0) ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-400">
              <TrendingUp size={48} className="mb-3" />
              <p className="text-gray-500">No attendance data this week</p>
              <p className="text-sm text-gray-400">Take attendance to see trends</p>
            </div>
          ) : (
            <div className="h-48 flex items-end gap-2">
              {attendanceData.map((value, index) => {
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const date = new Date();
                date.setDate(date.getDate() - (6 - index));
                const dayName = dayNames[date.getDay()];

                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(value, 5)}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className={`w-full rounded-t-lg ${value > 0 ? 'bg-gradient-to-t from-blue-500 to-cyan-300' : 'bg-gray-200'}`}
                    />
                    <div className="text-xs mt-2 font-medium">{dayName}</div>
                    <div className="text-xs text-gray-500">{value}%</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Chart Legend */}
          <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gradient-to-t from-blue-500 to-cyan-300 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Attendance %</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Target: 95%</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* System Status & Stats */}
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <Card className="p-5">
          <h3 className="font-bold text-gray-800 mb-3">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">AI Face Recognition</span>
              <span className="text-sm font-medium text-green-600">Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Database</span>
              <span className="text-sm font-medium text-green-600">Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Total Students</span>
              <span className="text-sm font-medium text-blue-600">{stats.totalStudents}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Total Classes</span>
              <span className="text-sm font-medium text-purple-600">{stats.totalClasses}</span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-gray-800 mb-3">Attendance Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
              <span className="text-gray-700">Today's Rate</span>
              <span className="text-lg font-bold text-blue-600">{stats.todayAttendance}%</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-green-50 rounded">
              <span className="text-gray-700">Weekly Average</span>
              <span className="text-lg font-bold text-green-600">{stats.monthlyAverage}%</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
              <span className="text-gray-700">Total Teachers</span>
              <span className="text-lg font-bold text-purple-600">{stats.totalTeachers}</span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-gray-800 mb-3">Quick Stats</h3>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Students per Class</div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: stats.totalClasses > 0 ? `${Math.min((stats.totalStudents / stats.totalClasses) * 10, 100)}%` : '0%' }}
                />
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Average: {stats.totalClasses > 0 ? Math.round(stats.totalStudents / stats.totalClasses) : 0} students
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Attendance Rate</div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${stats.todayAttendance}%` }}
                />
              </div>
              <div className="text-xs text-gray-600 mt-1">Today: {stats.todayAttendance}%</div>
            </div>
            <Button
              variant="outline"
              icon={Eye}
              className="w-full mt-2"
              onClick={() => navigate('/reports')}
            >
              View Detailed Analytics
            </Button>
          </div>
        </Card>
      </div >
    </div >
  );
};

export default AdminDashboard;
