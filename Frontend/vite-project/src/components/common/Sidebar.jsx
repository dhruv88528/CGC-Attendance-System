import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import {
  Home,
  Users,
  Calendar,
  FileText,
  Settings,
  BookOpen,
  UserPlus,
  BarChart3,
  Camera,
  School,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const Sidebar = ({ collapsed = false, onToggle }) => {
  const { user } = useAuth()
  const location = useLocation()
  const [hoveredItem, setHoveredItem] = useState(null)

  const adminItems = [
    {
      name: 'Dashboard',
      path: '/admin',
      icon: Home,
      role: 'admin'
    },
    {
      name: 'Register Student',
      path: '/student-registration',
      icon: UserPlus,
      role: 'admin'
    },
    {
      name: 'Students',
      path: '/students',
      icon: Users,
      role: 'both'
    },
    {
      name: 'Teachers',
      path: '/teachers',
      icon: Users,
      role: 'admin'
    },
    {
      name: 'Classes',
      path: '/classes',
      icon: BookOpen,
      role: 'admin'
    },
    {
      name: 'School Setup',
      path: '/school-setup',
      icon: School,
      role: 'admin'
    },
    {
      name: 'Attendance',
      path: '/attendance',
      icon: Calendar,
      role: 'both'
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: BarChart3,
      role: 'both'
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: Settings,
      role: 'both'
    }
  ]

  const teacherItems = [
    {
      name: 'Dashboard',
      path: '/teacher',
      icon: Home,
      role: 'teacher'
    },
    {
      name: 'My Classes',
      path: '/teacher/classes',
      icon: BookOpen,
      role: 'teacher'
    },
    {
      name: 'Students',
      path: '/students',
      icon: Users,
      role: 'teacher'
    },
    {
      name: 'Take Attendance',
      path: '/attendance/capture',
      icon: Camera,
      role: 'teacher'
    },
    {
      name: 'Attendance History',
      path: '/attendance',
      icon: Calendar,
      role: 'teacher'
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: FileText,
      role: 'teacher'
    }
  ]

  const items = user?.role === 'admin' ? adminItems : teacherItems

  const filteredItems = items.filter(item => {
    if (item.role === 'both') return true
    return item.role === user?.role
  })

  const sidebarVariants = {
    collapsed: {
      width: 80,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    expanded: {
      width: 260,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  }

  const itemVariants = {
    hover: {
      scale: 1.05,
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.95
    }
  }

  return (
    <motion.aside
      className={`h-screen bg-white border-r border-gray-200 shadow-lg flex flex-col ${collapsed ? 'items-center' : ''}`}
      initial={collapsed ? "collapsed" : "expanded"}
      animate={collapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
    >
      {/* Logo */}
      <div className={`p-6 ${collapsed ? 'px-4' : 'px-6'} border-b border-gray-200`}>
        <div className="flex items-center justify-between">
          {!collapsed && (
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-school-purple flex items-center justify-center">
                <span className="text-white font-bold text-lg">🎓</span>
              </div>
              <div>
                <h2 className="text-lg font-heading font-bold gradient-text">
                  Smart Attendance
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.role === 'admin' ? 'Admin Panel' : 'Teacher Panel'}
                </p>
              </div>
            </motion.div>
          )}

          {collapsed && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-school-purple flex items-center justify-center">
              <span className="text-white font-bold text-lg">🎓</span>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </motion.button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-2">
        <ul className="space-y-2">
          {filteredItems.map((item, index) => {
            const isActive = location.pathname.startsWith(item.path)

            return (
              <motion.li
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center ${collapsed ? 'justify-center' : 'justify-start'} 
                    p-3 rounded-xl transition-all duration-200 relative
                    ${isActive
                      ? 'bg-gradient-to-r from-primary-500/20 to-primary-500/10 text-primary-600 dark:text-primary-400 border-l-4 border-primary-500'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary-500 to-school-purple rounded-r"
                      layoutId="activeIndicator"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}

                  {/* Icon */}
                  <item.icon
                    size={22}
                    className={isActive ? 'text-primary-600 dark:text-primary-400' : ''}
                  />

                  {/* Label */}
                  {!collapsed && (
                    <motion.span
                      className="ml-3 font-medium"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                    >
                      {item.name}
                    </motion.span>
                  )}

                  {/* Tooltip for collapsed state */}
                  {collapsed && hoveredItem === item.name && (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-xl z-50 whitespace-nowrap"
                    >
                      {item.name}
                      <div className="absolute top-1/2 -left-1 w-2 h-2 bg-gray-900 transform -translate-y-1/2 rotate-45" />
                    </motion.div>
                  )}
                </NavLink>
              </motion.li>
            )
          })}
        </ul>
      </nav>

      {/* User Profile (bottom) */}
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 border-t border-gray-200 dark:border-gray-800"
        >
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-school-purple flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.role || 'User'}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.aside>
  )
}

export default Sidebar