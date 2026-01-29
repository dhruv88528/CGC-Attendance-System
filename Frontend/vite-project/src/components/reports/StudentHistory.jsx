import React, { useState, useEffect } from 'react';
import { User, Calendar, TrendingUp, Search } from 'lucide-react';
import Card from '../common/Card';
import Input from '../common/Input';
import { apiMethods } from '../../utils/api';

const StudentHistory = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentHistory, setStudentHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await apiMethods.getStudents();
      if (response.success && response.data) {
        const studentsList = response.data.students || response.data || [];
        setStudents(studentsList);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchStudentHistory = async (studentId) => {
    if (!studentId) return;
    setIsLoading(true);
    try {
      const response = await apiMethods.getStudentAttendance(studentId);
      if (response.success && response.data) {
        const history = Array.isArray(response.data) ? response.data : response.data.history || [];
        setStudentHistory(history.map(h => ({
          date: h.date ? new Date(h.date).toLocaleDateString() : '-',
          status: h.status || 'absent',
          class: h.class?.name || 'Unknown',
          teacher: h.markedBy?.name || 'System'
        })));
      } else {
        setStudentHistory([]);
      }
    } catch (error) {
      console.error('Error fetching student history:', error);
      setStudentHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    fetchStudentHistory(student._id);
  };

  const filteredStudents = students.filter(s =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNumber?.toString().includes(searchTerm)
  );

  const stats = {
    totalDays: studentHistory.length,
    presentDays: studentHistory.filter(d => d.status === 'present').length,
    absentDays: studentHistory.filter(d => d.status === 'absent').length,
    attendanceRate: studentHistory.length > 0
      ? Math.round((studentHistory.filter(d => d.status === 'present').length / studentHistory.length) * 100)
      : 0
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Student Attendance History</h1>
        <p className="text-gray-600">Track individual student attendance records</p>
      </div>

      {/* Search Form */}
      <Card className="mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Search Student</label>
          <Input
            placeholder="Search by name or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
          />
        </div>

        {searchTerm && filteredStudents.length > 0 && (
          <div className="border rounded-lg max-h-48 overflow-y-auto">
            {filteredStudents.slice(0, 10).map(student => (
              <div
                key={student._id}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                onClick={() => handleSelectStudent(student)}
              >
                <div className="font-medium">{student.firstName} {student.lastName}</div>
                <div className="text-sm text-gray-600">Roll: {student.rollNumber} | {student.class?.name || 'No class'}</div>
              </div>
            ))}
          </div>
        )}

        {students.length === 0 && (
          <div className="text-center text-gray-500 py-4">No students found. Register students first.</div>
        )}
      </Card>

      {/* Student Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="text-center p-4">
          <div className="text-2xl font-bold">{stats.totalDays}</div>
          <div className="text-sm text-gray-600">Total Days</div>
        </Card>
        <Card className="text-center p-4 bg-green-50">
          <div className="text-2xl font-bold text-green-600">{stats.presentDays}</div>
          <div className="text-sm text-gray-600">Present</div>
        </Card>
        <Card className="text-center p-4 bg-red-50">
          <div className="text-2xl font-bold text-red-600">{stats.absentDays}</div>
          <div className="text-sm text-gray-600">Absent</div>
        </Card>
        <Card className="text-center p-4 bg-blue-50">
          <div className="text-2xl font-bold text-blue-600">{stats.attendanceRate}%</div>
          <div className="text-sm text-gray-600">Attendance Rate</div>
        </Card>
      </div>

      {/* Student Info */}
      {selectedStudent ? (
        <Card className="mb-6 p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={32} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
              <p className="text-gray-600">
                Roll No: {selectedStudent.rollNumber} | Class: {selectedStudent.class?.name || 'Not assigned'}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="mb-6 p-4 text-center text-gray-500">
          Select a student to view their attendance history
        </Card>
      )}

      {/* Attendance History */}
      <Card>
        <h3 className="font-bold mb-4 flex items-center">
          <TrendingUp className="mr-2" /> Attendance History
        </h3>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : studentHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {selectedStudent ? 'No attendance records found' : 'Select a student to view history'}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Class</th>
                  <th className="p-3 text-left">Marked By</th>
                </tr>
              </thead>
              <tbody>
                {studentHistory.map((record, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-3">{record.date}</td>
                    <td className="p-3">
                      <span className={`px-3 py-1 rounded-full ${record.status === 'present'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                        }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="p-3">{record.class}</td>
                    <td className="p-3">{record.teacher}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};

export default StudentHistory;