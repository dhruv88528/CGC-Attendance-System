import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Plus,
  Search,
  Users,
  Edit,
  Trash2,
  Loader2,
  RefreshCw,
  X,
  Save
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import BackButton from '../components/common/BackButton';
import { ShimmerClassesPage } from '../components/common/Shimmer';
import { apiMethods } from '../utils/api';
import toast from 'react-hot-toast';

const ClassManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  // New class form - with auto-generated academic year
  const currentYear = new Date().getFullYear();
  const [newClass, setNewClass] = useState({
    name: '',
    grade: '',
    section: 'A',
    academicYear: `${currentYear}-${currentYear + 1}`,
  });

  // Fetch classes on mount
  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setIsLoading(true);
    try {
      const response = await apiMethods.getClasses();
      if (response.success && response.data) {
        setClasses(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      setClasses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter classes
  const filteredClasses = classes.filter(cls => {
    const classInfo = `${cls.name || ''} ${cls.grade || ''} ${cls.section || ''}`.toLowerCase();
    return classInfo.includes(searchTerm.toLowerCase());
  });

  // Stats
  const stats = {
    totalClasses: classes.length,
    totalSections: classes.length,
    totalStudents: classes.reduce((sum, c) => sum + (c.studentCount || 0), 0),
  };

  // Add new class
  const handleAddClass = async () => {
    if (!newClass.name && !newClass.grade) {
      toast.error('Please enter class name or grade');
      return;
    }
    if (!newClass.section) {
      toast.error('Please enter section');
      return;
    }

    setIsSaving(true);
    try {
      const classData = {
        name: newClass.name || `Class ${newClass.grade}`,
        grade: parseInt(newClass.grade),
        section: newClass.section,
        academicYear: newClass.academicYear,
      };

      const response = await apiMethods.createClass(classData);
      if (response.success) {
        toast.success('Class created successfully!');
        setShowAddModal(false);
        setNewClass({ name: '', grade: '', section: 'A', academicYear: `${currentYear}-${currentYear + 1}` });
        fetchClasses();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create class');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete class
  const handleDelete = async (classId) => {
    if (!window.confirm('Are you sure you want to delete this class?')) {
      return;
    }

    try {
      const response = await apiMethods.deleteClass(classId);
      if (response.success) {
        toast.success('Class deleted successfully');
        fetchClasses();
      }
    } catch (error) {
      toast.error('Failed to delete class');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 md:mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <BackButton to="/admin" />
            <div className="min-w-0">
              <h1 className="text-xl md:text-3xl font-bold text-gray-800 flex items-center">
                <BookOpen className="mr-2 md:mr-3 flex-shrink-0" size={24} />
                <span className="truncate">Class Management</span>
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1 truncate">Create and manage classes and sections</p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 flex-shrink-0">
            <Button
              variant="outline"
              icon={RefreshCw}
              size="sm"
              onClick={fetchClasses}
              disabled={isLoading}
            >
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="primary"
              icon={Plus}
              size="sm"
              onClick={() => setShowAddModal(true)}
            >
              <span className="hidden sm:inline">Add New </span>Class
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-8">
        <Card className="p-2 md:p-5 text-center">
          <div className="text-lg md:text-2xl font-bold text-gray-800">{stats.totalClasses}</div>
          <div className="text-xs md:text-sm text-gray-600">Classes</div>
        </Card>
        <Card className="p-2 md:p-5 text-center bg-blue-50">
          <div className="text-lg md:text-2xl font-bold text-blue-600">{stats.totalSections}</div>
          <div className="text-xs md:text-sm text-gray-600">Sections</div>
        </Card>
        <Card className="p-2 md:p-5 text-center bg-green-50">
          <div className="text-lg md:text-2xl font-bold text-green-600">{stats.totalStudents}</div>
          <div className="text-xs md:text-sm text-gray-600">Students</div>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6 p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
              showClear
              onClear={() => setSearchTerm('')}
            />
          </div>
        </div>
      </Card>

      {/* Loading State - Shimmer Effect */}
      {isLoading ? (
        <ShimmerClassesPage />
      ) : (
        <>
          {/* Classes Grid */}
          {filteredClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClasses.map((cls) => (
                <Card key={cls._id} className="p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mr-3">
                        <BookOpen className="text-white" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">
                          {cls.name || `Class ${cls.grade}`}
                        </h3>
                        <p className="text-sm text-gray-600">Section {cls.section}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        onClick={() => {
                          setEditingClass(cls);
                          setNewClass({
                            name: cls.name,
                            grade: cls.grade,
                            section: cls.section
                          });
                          setShowAddModal(true);
                        }}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        onClick={() => handleDelete(cls._id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <Users className="mr-2" size={16} />
                      {cls.studentCount || 0} Students
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      Grade {cls.grade}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <BookOpen className="text-gray-400 mx-auto mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No classes found</h3>
              <p className="text-gray-600 mb-4">
                {classes.length === 0
                  ? 'Create your first class to get started'
                  : 'Try adjusting your search'
                }
              </p>
              {classes.length === 0 && (
                <Button
                  variant="primary"
                  icon={Plus}
                  onClick={() => setShowAddModal(true)}
                >
                  Create First Class
                </Button>
              )}
            </Card>
          )}
        </>
      )}

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {editingClass ? 'Edit Class' : 'Add New Class'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingClass(null);
                  setNewClass({ name: '', grade: '', section: 'A', academicYear: `${currentYear}-${currentYear + 1}` });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Name *
                </label>
                <Input
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  placeholder="e.g., Class 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade
                </label>
                <select
                  value={newClass.grade}
                  onChange={(e) => setNewClass({ ...newClass, grade: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="">Select Grade</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section *
                </label>
                <select
                  value={newClass.section}
                  onChange={(e) => setNewClass({ ...newClass, section: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                >
                  {['A', 'B', 'C', 'D', 'E', 'F'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year *
                </label>
                <Input
                  value={newClass.academicYear}
                  onChange={(e) => setNewClass({ ...newClass, academicYear: e.target.value })}
                  placeholder="e.g., 2024-2025"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingClass(null);
                    setNewClass({ name: '', grade: '', section: 'A', academicYear: `${currentYear}-${currentYear + 1}` });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  icon={isSaving ? Loader2 : Save}
                  onClick={handleAddClass}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Class'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ClassManagementPage;