import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Edit,
  Trash2,
  Loader2,
  RefreshCw,
  X,
  Save,
  BookOpen
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import BackButton from '../components/common/BackButton';
import { ShimmerTeachersPage } from '../components/common/Shimmer';
import { apiMethods } from '../utils/api';
import toast from 'react-hot-toast';

const TeacherManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);

  // New teacher form
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    subjects: [],
    assignedClasses: [],
    qualification: '',
    specialization: '',
  });

  // Subject input for tag-like entry
  const [subjectInput, setSubjectInput] = useState('');

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch teachers (users with role teacher)
      const usersResponse = await apiMethods.getUsers();
      if (usersResponse.success && usersResponse.data) {
        const teachersList = usersResponse.data.filter(u => u.role === 'teacher');
        setTeachers(teachersList);
      }

      // Fetch classes
      const classesResponse = await apiMethods.getClasses();
      if (classesResponse.success && classesResponse.data) {
        setClasses(classesResponse.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setTeachers([]);
      setClasses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter teachers
  const filteredTeachers = teachers.filter(teacher => {
    const teacherInfo = `${teacher.name || ''} ${teacher.email || ''}`.toLowerCase();
    return teacherInfo.includes(searchTerm.toLowerCase());
  });

  // Stats
  const stats = {
    total: teachers.length,
    active: teachers.filter(t => t.isActive !== false).length,
  };

  // Add or update teacher
  const handleSaveTeacher = async () => {
    if (!newTeacher.name.trim()) {
      toast.error('Please enter teacher name', { id: 'teacher-validation' });
      return;
    }
    if (!newTeacher.email.trim()) {
      toast.error('Please enter email', { id: 'teacher-validation' });
      return;
    }
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newTeacher.email)) {
      toast.error('Please enter a valid email address (e.g., teacher@school.com)', { id: 'teacher-validation' });
      return;
    }
    if (!editingTeacher && (!newTeacher.password || newTeacher.password.length < 6)) {
      toast.error('Password must be at least 6 characters', { id: 'teacher-validation' });
      return;
    }

    setIsSaving(true);
    try {
      const emptyTeacher = { name: '', email: '', password: '', phone: '', subjects: [], assignedClasses: [], qualification: '', specialization: '' };

      if (editingTeacher) {
        // Update existing teacher
        const updateData = {
          name: newTeacher.name,
          phone: newTeacher.phone,
          subjects: newTeacher.subjects,
          assignedClasses: newTeacher.assignedClasses,
          qualification: newTeacher.qualification,
          specialization: newTeacher.specialization,
        };
        const response = await apiMethods.updateUser(editingTeacher._id, updateData);
        if (response.success) {
          toast.success('Teacher updated successfully!', { id: 'teacher-action' });
          setShowAddModal(false);
          setEditingTeacher(null);
          setNewTeacher(emptyTeacher);
          fetchData();
        }
      } else {
        // Create new teacher
        const teacherData = {
          name: newTeacher.name,
          email: newTeacher.email,
          password: newTeacher.password,
          role: 'teacher',
          phone: newTeacher.phone,
          subjects: newTeacher.subjects,
          assignedClasses: newTeacher.assignedClasses,
          qualification: newTeacher.qualification,
          specialization: newTeacher.specialization,
        };
        const response = await apiMethods.createUser(teacherData);
        if (response.success) {
          toast.success('Teacher added successfully!', { id: 'teacher-action' });
          setShowAddModal(false);
          setNewTeacher(emptyTeacher);
          fetchData();
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save teacher', { id: 'teacher-action' });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete teacher
  const handleDelete = async (teacherId) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) {
      return;
    }

    try {
      const response = await apiMethods.deleteUser(teacherId);
      if (response.success) {
        toast.success('Teacher deleted successfully', { id: 'teacher-delete' });
        fetchData();
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.message || error.response?.data?.message || 'Failed to delete teacher', { id: 'teacher-delete' });
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
                <Users className="mr-2 md:mr-3 flex-shrink-0" size={24} />
                <span className="truncate">Teacher Management</span>
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1 truncate">Manage teacher accounts and class assignments</p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 flex-shrink-0">
            <Button
              variant="outline"
              icon={RefreshCw}
              size="sm"
              onClick={fetchData}
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
              <span className="hidden sm:inline">Add New </span>Teacher
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
        <Card className="p-3 md:p-5 text-center">
          <div className="text-xl md:text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-xs md:text-sm text-gray-600">Total Teachers</div>
        </Card>
        <Card className="p-3 md:p-5 text-center bg-green-50">
          <div className="text-xl md:text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-xs md:text-sm text-gray-600">Active Teachers</div>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6 p-4">
        <Input
          placeholder="Search teachers by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={Search}
          showClear
          onClear={() => setSearchTerm('')}
        />
      </Card>

      {/* Loading State - Shimmer Effect */}
      {isLoading ? (
        <ShimmerTeachersPage />
      ) : (
        <>
          {/* Teachers Grid */}
          {filteredTeachers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTeachers.map((teacher) => (
                <Card key={teacher._id} className="p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center mr-3">
                        <span className="text-white font-bold text-lg">
                          {(teacher.name || 'T').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{teacher.name}</h3>
                        <p className="text-sm text-gray-600">Teacher</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Edit"
                        onClick={() => {
                          setEditingTeacher(teacher);
                          setNewTeacher({
                            name: teacher.name,
                            email: teacher.email,
                            password: '',
                            phone: teacher.phone || '',
                            subjects: teacher.subjects || [],
                            assignedClasses: teacher.assignedClasses || [],
                            qualification: teacher.qualification || '',
                            specialization: teacher.specialization || '',
                          });
                          setShowAddModal(true);
                        }}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                        onClick={() => handleDelete(teacher._id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Mail size={14} className="mr-2" />
                      {teacher.email}
                    </div>
                    {teacher.phone && (
                      <div className="flex items-center">
                        <Phone size={14} className="mr-2" />
                        {teacher.phone}
                      </div>
                    )}
                    <div className="flex items-center">
                      <BookOpen size={14} className="mr-2" />
                      {(teacher.assignedClasses?.length || 0) || classes.filter(c => c.teacher?._id === teacher._id || c.teacher === teacher._id).length} Classes Assigned
                    </div>
                  </div>

                  {/* Subjects Tags */}
                  {teacher.subjects && teacher.subjects.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {teacher.subjects.map((subject, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                          {subject}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs ${teacher.isActive !== false
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                      }`}>
                      {teacher.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Users className="text-gray-400 mx-auto mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No teachers found</h3>
              <p className="text-gray-600 mb-4">
                {teachers.length === 0
                  ? 'Add your first teacher to get started'
                  : 'Try adjusting your search'
                }
              </p>
              {teachers.length === 0 && (
                <Button
                  variant="primary"
                  icon={Plus}
                  onClick={() => setShowAddModal(true)}
                >
                  Add First Teacher
                </Button>
              )}
            </Card>
          )}
        </>
      )}

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-md w-full my-4 sm:my-0 flex flex-col max-h-[90vh]"
          >
            {/* Modal Header - Sticky */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b flex-shrink-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingTeacher(null);
                  setNewTeacher({ name: '', email: '', password: '', phone: '', assignedClasses: [] });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <Input
                    value={newTeacher.name}
                    onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={newTeacher.email}
                    onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                    placeholder="Enter email address"
                    disabled={!!editingTeacher}
                  />
                  {editingTeacher && (
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  )}
                </div>

                {!editingTeacher && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <Input
                      type="password"
                      value={newTeacher.password}
                      onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                      placeholder="Min 6 characters"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={newTeacher.phone}
                    onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>

                {/* Subjects - Tag Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subjects (Press Enter to add)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newTeacher.subjects.map((subject, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                      >
                        {subject}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = newTeacher.subjects.filter((_, i) => i !== index);
                            setNewTeacher({ ...newTeacher, subjects: updated });
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <Input
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && subjectInput.trim()) {
                        e.preventDefault();
                        if (!newTeacher.subjects.includes(subjectInput.trim())) {
                          setNewTeacher({
                            ...newTeacher,
                            subjects: [...newTeacher.subjects, subjectInput.trim()]
                          });
                        }
                        setSubjectInput('');
                      }
                    }}
                    placeholder="Type subject and press Enter (e.g. Math, English)"
                  />
                </div>

                {/* Qualification */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qualification
                  </label>
                  <Input
                    value={newTeacher.qualification}
                    onChange={(e) => setNewTeacher({ ...newTeacher, qualification: e.target.value })}
                    placeholder="e.g. B.Ed, M.Ed, PhD"
                  />
                </div>

                {/* Specialization */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization
                  </label>
                  <Input
                    value={newTeacher.specialization}
                    onChange={(e) => setNewTeacher({ ...newTeacher, specialization: e.target.value })}
                    placeholder="e.g. Mathematics, Science, English"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Classes
                  </label>
                  <select
                    multiple
                    value={newTeacher.assignedClasses}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setNewTeacher({ ...newTeacher, assignedClasses: selected });
                    }}
                    className="w-full p-3 border rounded-lg h-24"
                  >
                    {classes.map(cls => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name || `Class ${cls.grade}`} - {cls.section}
                      </option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

            {/* Modal Footer - Sticky */}
            <div className="p-4 sm:p-6 border-t bg-gray-50 flex-shrink-0">
              <div className="flex gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  size="sm"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingTeacher(null);
                    setNewTeacher({ name: '', email: '', password: '', phone: '', assignedClasses: [] });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  size="sm"
                  icon={isSaving ? Loader2 : Save}
                  onClick={handleSaveTeacher}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : (editingTeacher ? 'Update' : 'Add Teacher')}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TeacherManagementPage;