import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Download,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  Phone,
  BookOpen,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import BackButton from '../components/common/BackButton';
import Modal from '../components/common/Modal';
import { ShimmerStudentsPage } from '../components/common/Shimmer';
import { apiMethods } from '../utils/api';
import toast from 'react-hot-toast';

const StudentsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    classes: 0,
    faceRegistered: 0
  });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    rollNumber: '',
    parentPhone: '',
    gender: '',
    class: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch students and classes on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch students
      const studentsResponse = await apiMethods.getStudents();
      if (studentsResponse.success && studentsResponse.data) {
        const studentList = studentsResponse.data.students || studentsResponse.data || [];
        setStudents(studentList);

        // Calculate stats
        setStats({
          total: studentList.length,
          active: studentList.filter(s => s.isActive !== false).length,
          classes: [...new Set(studentList.map(s => s.class?._id || s.class))].length,
          faceRegistered: studentList.filter(s => s.faceRegistered).length
        });
      }

      // Fetch classes
      const classesResponse = await apiMethods.getClasses();
      if (classesResponse.success && classesResponse.data) {
        setClasses(classesResponse.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Set empty arrays on error - no fake data
      setStudents([]);
      setClasses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter(student => {
    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
      (student.rollNumber || '').toString().includes(searchTerm);
    const matchesClass = selectedClass === 'all' ||
      (student.class?._id === selectedClass) ||
      (student.class === selectedClass);
    return matchesSearch && matchesClass;
  });

  // Delete student
  const handleDelete = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) {
      return;
    }

    try {
      const response = await apiMethods.deleteStudent(studentId);
      if (response.success) {
        toast.success('Student deleted successfully', { id: 'student-delete' });
        fetchData(); // Refresh list
      }
    } catch (error) {
      toast.error('Failed to delete student', { id: 'student-delete' });
    }
  };

  // View student details
  const handleView = (student) => {
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  // Open edit modal
  const handleEdit = (student) => {
    setSelectedStudent(student);
    setEditForm({
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      rollNumber: student.rollNumber || '',
      parentPhone: student.parentPhone || '',
      gender: student.gender || '',
      class: student.class?._id || student.class || ''
    });
    setShowEditModal(true);
  };

  // Save edited student
  const handleSaveEdit = async () => {
    if (!editForm.firstName.trim()) {
      toast.error('First name is required', { id: 'student-edit' });
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiMethods.updateStudent(selectedStudent._id, editForm);
      if (response.success) {
        toast.success('Student updated successfully!', { id: 'student-edit' });
        setShowEditModal(false);
        setSelectedStudent(null);
        fetchData(); // Refresh list
      }
    } catch (error) {
      toast.error('Failed to update student', { id: 'student-edit' });
    } finally {
      setIsSaving(false);
    }
  };

  // Export students list to CSV
  const handleExportStudents = () => {
    if (filteredStudents.length === 0) {
      toast.error('No students to export', { id: 'student-export' });
      return;
    }

    // Create CSV headers
    const headers = ['Roll Number', 'First Name', 'Last Name', 'Class', 'Section', 'Gender', 'Parent Phone', 'Face Registered'];

    // Create CSV rows
    const rows = filteredStudents.map(student => [
      student.rollNumber || 'N/A',
      student.firstName || 'N/A',
      student.lastName || '',
      student.class?.grade || student.class?.name || 'N/A',
      student.class?.section || student.section || 'N/A',
      student.gender || 'N/A',
      student.parentPhone || 'N/A',
      student.faceRegistered ? 'Yes' : 'No'
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `students_list_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`✅ Exported ${filteredStudents.length} students to CSV`, { id: 'student-export' });
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
            <BackButton />
            <div className="min-w-0">
              <h1 className="text-xl md:text-3xl font-bold text-gray-800 flex items-center">
                <Users className="mr-2 md:mr-3 flex-shrink-0" size={24} />
                <span className="truncate">Student Management</span>
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1 truncate">Manage all student records and information</p>
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
              icon={UserPlus}
              size="sm"
              onClick={() => navigate('/student-registration')}
            >
              <span className="hidden sm:inline">Add New </span>Student
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <Card className="text-center p-3 md:p-5">
          <div className="text-xl md:text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-xs md:text-sm text-gray-600">Total Students</div>
        </Card>
        <Card className="text-center p-3 md:p-5 bg-green-50">
          <div className="text-xl md:text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-xs md:text-sm text-gray-600">Active Students</div>
        </Card>
        <Card className="text-center p-3 md:p-5 bg-blue-50">
          <div className="text-xl md:text-2xl font-bold text-blue-600">{stats.classes}</div>
          <div className="text-xs md:text-sm text-gray-600">Classes</div>
        </Card>
        <Card className="text-center p-3 md:p-5 bg-purple-50">
          <div className="text-xl md:text-2xl font-bold text-purple-600">{stats.faceRegistered}</div>
          <div className="text-xs md:text-sm text-gray-600">Face Registered</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
              showClear
              onClear={() => setSearchTerm('')}
            />
          </div>
          <div className="flex gap-3">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">All Classes</option>
              {classes.map(cls => (
                <option key={cls._id} value={cls._id}>
                  {cls.name || `Class ${cls.grade}`} - {cls.section}
                </option>
              ))}
            </select>
            <Button variant="outline" icon={Download} onClick={handleExportStudents}>
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Loading State - Shimmer Effect */}
      {isLoading ? (
        <ShimmerStudentsPage />
      ) : (
        <>
          {/* Students Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left">Roll No</th>
                    <th className="p-3 text-left">Student Name</th>
                    <th className="p-3 text-left">Class & Section</th>
                    <th className="p-3 text-left">Contact</th>
                    <th className="p-3 text-left">Face Status</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student._id} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium">{student.rollNumber}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mr-3">
                            <span className="text-white font-medium">
                              {(student.firstName || 'S').charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {student.gender}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center">
                          <BookOpen className="text-gray-400 mr-2" size={16} />
                          {student.class?.name || student.class?.grade || 'N/A'} - {student.class?.section || student.section || 'N/A'}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center text-sm">
                          <Phone size={14} className="mr-2 text-gray-500" />
                          {student.parentPhone || 'N/A'}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full text-sm ${student.faceRegistered
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {student.faceRegistered ? 'Registered' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="View Details"
                            onClick={() => handleView(student)}
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Edit"
                            onClick={() => handleEdit(student)}
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                            onClick={() => handleDelete(student._id)}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {filteredStudents.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="text-gray-400 mx-auto mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                <p className="text-gray-600 mb-4">
                  {students.length === 0
                    ? 'No students registered yet. Add your first student!'
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
                {students.length === 0 && (
                  <Button
                    variant="primary"
                    icon={UserPlus}
                    onClick={() => navigate('/student-registration')}
                  >
                    Register First Student
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Footer Info */}
          <div className="mt-6 text-sm text-gray-600 text-center">
            Showing {filteredStudents.length} of {students.length} students
          </div>
        </>
      )}

      {/* View Student Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setSelectedStudent(null); }}
        title="Student Details"
        size="md"
      >
        {selectedStudent && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                {selectedStudent.firstName?.charAt(0)}{selectedStudent.lastName?.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                <p className="text-gray-500">Roll No: {selectedStudent.rollNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Class</p>
                <p className="font-medium">{selectedStudent.class?.name || selectedStudent.class?.grade || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Section</p>
                <p className="font-medium">{selectedStudent.class?.section || selectedStudent.section || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-medium capitalize">{selectedStudent.gender || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Parent Phone</p>
                <p className="font-medium">{selectedStudent.parentPhone || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                <p className="text-sm text-gray-500">Face Recognition</p>
                <p className={`font-medium ${selectedStudent.faceRegistered ? 'text-green-600' : 'text-yellow-600'}`}>
                  {selectedStudent.faceRegistered ? '✅ Registered' : '⏳ Pending'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" fullWidth onClick={() => setShowViewModal(false)}>
                Close
              </Button>
              <Button variant="primary" fullWidth onClick={() => { setShowViewModal(false); handleEdit(selectedStudent); }}>
                Edit Student
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedStudent(null); }}
        title="Edit Student"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="First Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Last Name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
            <input
              type="text"
              value={editForm.rollNumber}
              onChange={(e) => setEditForm({ ...editForm, rollNumber: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Roll Number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent Phone</label>
            <input
              type="tel"
              value={editForm.parentPhone}
              onChange={(e) => setEditForm({ ...editForm, parentPhone: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Parent Phone Number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              value={editForm.gender}
              onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class & Section *</label>
            <select
              value={editForm.class}
              onChange={(e) => setEditForm({ ...editForm, class: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Class</option>
              {classes.map(cls => (
                <option key={cls._id} value={cls._id}>
                  {cls.name || `Class ${cls.grade}`} - Section {cls.section}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" fullWidth onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" fullWidth onClick={handleSaveEdit} loading={isSaving}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentsPage;