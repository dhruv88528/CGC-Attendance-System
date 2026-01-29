import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Users,
  Calendar,
  CheckCircle,
  ChevronRight,
  RefreshCw,
  Loader2,
  AlertCircle
} from 'lucide-react'
import Button from '../common/Button'
import Card from '../common/Card'
import { ShimmerGrid } from '../common/Shimmer'
import { apiMethods } from '../../utils/api'
import { useNavigate } from 'react-router-dom'

const ClassSelector = ({ onSelectClass, showActions = true }) => {
  const navigate = useNavigate()
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load classes on mount
  useEffect(() => {
    loadClasses()
  }, [])

  const loadClasses = async () => {
    setIsLoading(true)
    try {
      const response = await apiMethods.getClasses()
      if (response.success && response.data) {
        setClasses(response.data)
      }
    } catch (error) {
      console.error('Failed to load classes:', error)
      setClasses([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectClass = (cls) => {
    setSelectedClass(cls)
    if (onSelectClass) {
      onSelectClass(cls)
    }
  }

  const handleTakeAttendance = () => {
    if (selectedClass) {
      navigate('/attendance')
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <BookOpen className="mr-2" size={24} />
          Select a Class
        </h2>
        <Button
          variant="ghost"
          size="sm"
          icon={RefreshCw}
          onClick={loadClasses}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <ShimmerGrid count={6} columns={3} />
      ) : classes.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <motion.div
              key={cls._id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectClass(cls)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedClass?._id === cls._id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedClass?._id === cls._id ? 'bg-blue-500' : 'bg-gray-200'
                    }`}>
                    <span className={`font-bold ${selectedClass?._id === cls._id ? 'text-white' : 'text-gray-600'
                      }`}>
                      {cls.grade || cls.name?.replace('Class ', '') || 'C'}
                    </span>
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-800">
                      {cls.name || `Class ${cls.grade}`}
                    </h3>
                    <p className="text-sm text-gray-500">Section {cls.section}</p>
                  </div>
                </div>
                {selectedClass?._id === cls._id && (
                  <CheckCircle className="text-blue-500" size={20} />
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-600">
                  <Users size={14} className="mr-1" />
                  {cls.studentCount || 0} Students
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <AlertCircle className="mx-auto text-gray-400 mb-4" size={40} />
          <p className="text-gray-600 mb-2">No classes found</p>
          <p className="text-sm text-gray-500">Classes will appear here when admin creates them</p>
        </div>
      )}

      {/* Actions */}
      {showActions && selectedClass && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 pt-6 border-t"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">
                Selected: {selectedClass.name || `Class ${selectedClass.grade}`} - {selectedClass.section}
              </p>
              <p className="text-sm text-gray-500">
                {selectedClass.studentCount || 0} students enrolled
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/students')}>
                View Students
              </Button>
              <Button
                variant="primary"
                icon={Calendar}
                onClick={handleTakeAttendance}
              >
                Take Attendance
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </Card>
  )
}

export default ClassSelector