import React, { useState } from 'react';
import { UserPlus, Mail, Phone, Edit, Trash2, CheckCircle } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([
    { id: 1, name: 'Priya Sharma', email: 'priya@school.com', phone: '9876543210', status: 'active' },
    { id: 2, name: 'Raj Kumar', email: 'raj@school.com', phone: '9876543211', status: 'active' },
    { id: 3, name: 'Anjali Mehta', email: 'anjali@school.com', phone: '9876543212', status: 'inactive' },
  ]);

  const [newTeacher, setNewTeacher] = useState({ name: '', email: '', phone: '' });

  const handleAddTeacher = () => {
    if (newTeacher.name && newTeacher.email) {
      setTeachers([...teachers, { 
        id: teachers.length + 1, 
        ...newTeacher, 
        status: 'active' 
      }]);
      setNewTeacher({ name: '', email: '', phone: '' });
    }
  };

  const toggleStatus = (id) => {
    setTeachers(teachers.map(teacher => 
      teacher.id === id 
        ? { ...teacher, status: teacher.status === 'active' ? 'inactive' : 'active' }
        : teacher
    ));
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <UserPlus className="mr-2" /> Teacher Management
        </h1>
        <p className="text-gray-600">Manage teacher accounts and permissions</p>
      </div>

      {/* Add Teacher Form */}
      <Card className="mb-6 p-4">
        <h3 className="font-medium mb-3">Add New Teacher</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <input
            type="text"
            placeholder="Full Name"
            value={newTeacher.name}
            onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})}
            className="p-2 border rounded-lg"
          />
          <input
            type="email"
            placeholder="Email Address"
            value={newTeacher.email}
            onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})}
            className="p-2 border rounded-lg"
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={newTeacher.phone}
            onChange={(e) => setNewTeacher({...newTeacher, phone: e.target.value})}
            className="p-2 border rounded-lg"
          />
        </div>
        <Button onClick={handleAddTeacher} icon={UserPlus}>
          Add Teacher
        </Button>
      </Card>

      {/* Teachers List */}
      <Card>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Teacher</th>
              <th className="p-3 text-left">Contact</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map(teacher => (
              <tr key={teacher.id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <div className="font-medium">{teacher.name}</div>
                </td>
                <td className="p-3">
                  <div className="text-sm space-y-1">
                    <div className="flex items-center">
                      <Mail size={14} className="mr-2 text-gray-500" />
                      {teacher.email}
                    </div>
                    <div className="flex items-center">
                      <Phone size={14} className="mr-2 text-gray-500" />
                      {teacher.phone}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => toggleStatus(teacher.id)}
                    className={`px-3 py-1 rounded-full text-sm flex items-center ${
                      teacher.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <CheckCircle size={14} className="mr-1" />
                    {teacher.status}
                  </button>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => setTeachers(teachers.filter(t => t.id !== teacher.id))}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card className="text-center p-4">
          <div className="text-2xl font-bold">{teachers.length}</div>
          <div className="text-sm text-gray-600">Total Teachers</div>
        </Card>
        <Card className="text-center p-4 bg-green-50">
          <div className="text-2xl font-bold text-green-600">
            {teachers.filter(t => t.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600">Active</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold">4</div>
          <div className="text-sm text-gray-600">Classes Assigned</div>
        </Card>
      </div>
    </div>
  );
};

export default TeacherManagement;