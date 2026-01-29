import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Camera, 
  BookOpen, 
  Calendar,
  BarChart3,
  Settings,
  LogOut
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useAuth } from '../components/auth/ProtectedRoute';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Dashboard stats
  const stats = [
    { title: 'Total Students', value: '1,248', icon: Users, color: 'blue' },
    { title: 'Today Present', value: '1,186', icon: Calendar, color: 'green' },
    { title: 'Classes', value: '24', icon: BookOpen, color: 'purple' },
    { title: 'Attendance Rate', value: '95%', icon: BarChart3, color: 'orange' },
  ];

  // Quick actions
  const quickActions = [
    { title: 'Take Attendance', icon: Camera, color: 'from-blue-500 to-cyan-500', path: '/attendance' },
    { title: 'View Students', icon: Users, color: 'from-green-500 to-emerald-500', path: '/students' },
    { title: 'Class Management', icon: BookOpen, color: 'from-purple-500 to-pink-500', path: '/classes' },
    { title: 'Reports', icon: BarChart3, color: 'from-orange-500 to-amber-500', path: '/reports' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mr-4">
              <LayoutDashboard className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.name || 'User'} 👋</p>
            </div>
          </div>
          <Button variant="outline" icon={LogOut} onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-5 hover-lift">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-${stat.color}-100`}>
                  <stat.icon className={`text-${stat.color}-600`} size={22} />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-sm text-gray-600 mt-1">{stat.title}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {quickActions.map((action, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className="p-6 text-center cursor-pointer hover-lift"
              onClick={() => navigate(action.path)}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mx-auto mb-4`}>
                <action.icon className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-800">{action.title}</h3>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { time: '2 hours ago', activity: 'Attendance marked for Class 3A', user: 'You' },
              { time: '4 hours ago', activity: 'New student registered', user: 'Admin' },
              { time: 'Yesterday', activity: 'Monthly report generated', user: 'System' },
              { time: '2 days ago', activity: 'Class schedule updated', user: 'Teacher Smith' },
            ].map((item, index) => (
              <div key={index} className="flex items-center p-3 hover:bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-4"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{item.activity}</p>
                  <p className="text-sm text-gray-600">{item.user} • {item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;