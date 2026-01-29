import React, { useState, useEffect } from 'react';
import { Users, BookOpen, UserCheck, TrendingUp, Calendar, Activity } from 'lucide-react';
import Card from '../common/Card';
import { apiMethods } from '../../utils/api';

const DashboardStats = () => {
  const [stats, setStats] = useState([
    { title: 'Total Students', value: '0', icon: Users, color: 'bg-blue-500', change: '' },
    { title: 'Total Classes', value: '0', icon: BookOpen, color: 'bg-green-500', change: '' },
    { title: 'Active Teachers', value: '0', icon: UserCheck, color: 'bg-purple-500', change: '' },
    { title: 'Today\'s Attendance', value: '0%', icon: TrendingUp, color: 'bg-yellow-500', change: '' },
  ]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    let studentCount = 0;
    let classCount = 0;
    let teacherCount = 0;
    let attendanceRate = 0;

    try {
      const studentsRes = await apiMethods.getStudents();
      studentCount = studentsRes?.data?.students?.length || studentsRes?.data?.length || 0;
    } catch (e) { }

    try {
      const classesRes = await apiMethods.getClasses();
      classCount = classesRes?.data?.length || 0;
    } catch (e) { }

    try {
      const usersRes = await apiMethods.getUsers();
      teacherCount = usersRes?.data?.filter(u => u.role === 'teacher')?.length || 0;
    } catch (e) { }

    try {
      const today = new Date().toISOString().split('T')[0];
      const attendanceRes = await apiMethods.getDailyAttendance({ date: today });
      if (attendanceRes?.data && Array.isArray(attendanceRes.data)) {
        const present = attendanceRes.data.filter(a => a.status === 'present').length;
        const total = attendanceRes.data.length;
        attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
      }
    } catch (e) { }

    setStats([
      { title: 'Total Students', value: studentCount.toString(), icon: Users, color: 'bg-blue-500', change: '' },
      { title: 'Total Classes', value: classCount.toString(), icon: BookOpen, color: 'bg-green-500', change: '' },
      { title: 'Active Teachers', value: teacherCount.toString(), icon: UserCheck, color: 'bg-purple-500', change: '' },
      { title: 'Today\'s Attendance', value: `${attendanceRate}%`, icon: TrendingUp, color: 'bg-yellow-500', change: '' },
    ]);

    setRecentActivity([]); // Real activity would come from API
    setIsLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10`}>
                <stat.icon className={`${stat.color.replace('bg-', 'text-')}`} />
              </div>
              {stat.change && <span className="text-sm text-green-600">{stat.change}</span>}
            </div>
            <div className="text-2xl font-bold">{isLoading ? '...' : stat.value}</div>
            <div className="text-sm text-gray-600">{stat.title}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <h3 className="font-bold mb-4 flex items-center">
            <Activity className="mr-2" /> Recent Activity
          </h3>
          {recentActivity.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No recent activity</div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item, index) => (
                <div key={index} className="flex items-start border-b pb-3 last:border-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                    <Calendar size={18} className="text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{item.activity}</div>
                    <div className="text-sm text-gray-600">{item.user}</div>
                  </div>
                  <div className="text-sm text-gray-500">{item.time}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card>
          <h3 className="font-bold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/reports'}
              className="w-full p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-left"
            >
              View Attendance Reports
            </button>
            <button
              onClick={() => window.location.href = '/student-registration'}
              className="w-full p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-left"
            >
              Add New Student
            </button>
            <button
              onClick={() => window.location.href = '/reports'}
              className="w-full p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-left"
            >
              Generate Mid-Day Meal Report
            </button>
            <button
              onClick={() => window.location.href = '/school-setup'}
              className="w-full p-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 text-left"
            >
              System Settings
            </button>
          </div>
        </Card>
      </div>

      {/* No fake chart - show message */}
      <Card className="mt-6 p-4">
        <h3 className="font-bold mb-4">Weekly Attendance Trend</h3>
        <div className="text-center text-gray-500 py-8">
          Chart data will appear when attendance records are available
        </div>
      </Card>
    </div>
  );
};

export default DashboardStats;