import React, { useState } from 'react';
import { BookOpen, Plus, Edit, Trash2, Users } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';

const ClassManagement = () => {
  const [classes, setClasses] = useState([
    { id: 1, name: 'Class 1', section: 'A', teacher: 'Teacher A', students: 42 },
    { id: 2, name: 'Class 2', section: 'B', teacher: 'Teacher B', students: 38 },
    { id: 3, name: 'Class 3', section: 'A', teacher: 'Teacher C', students: 45 },
    { id: 4, name: 'Class 4', section: 'C', teacher: 'Teacher D', students: 40 },
  ]);

  const [newClass, setNewClass] = useState({ name: '', section: '', teacher: '' });

  const handleAddClass = () => {
    if (newClass.name && newClass.section) {
      setClasses([...classes, { 
        id: classes.length + 1, 
        ...newClass, 
        students: 0 
      }]);
      setNewClass({ name: '', section: '', teacher: '' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <BookOpen className="mr-2" /> Class Management
        </h1>
        <p className="text-gray-600">Manage classes, sections, and assignments</p>
      </div>

      {/* Add New Class Form */}
      <Card className="mb-6 p-4">
        <h3 className="font-medium mb-3">Add New Class</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Class Name"
            value={newClass.name}
            onChange={(e) => setNewClass({...newClass, name: e.target.value})}
            className="p-2 border rounded-lg"
          />
          <input
            type="text"
            placeholder="Section"
            value={newClass.section}
            onChange={(e) => setNewClass({...newClass, section: e.target.value})}
            className="p-2 border rounded-lg"
          />
          <input
            type="text"
            placeholder="Teacher"
            value={newClass.teacher}
            onChange={(e) => setNewClass({...newClass, teacher: e.target.value})}
            className="p-2 border rounded-lg"
          />
          <Button onClick={handleAddClass} icon={Plus}>
            Add Class
          </Button>
        </div>
      </Card>

      {/* Classes List */}
      <Card>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Class</th>
              <th className="p-3 text-left">Section</th>
              <th className="p-3 text-left">Teacher</th>
              <th className="p-3 text-left">Students</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {classes.map(cls => (
              <tr key={cls.id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <div className="flex items-center">
                    <BookOpen size={18} className="mr-2 text-gray-500" />
                    {cls.name}
                  </div>
                </td>
                <td className="p-3">{cls.section}</td>
                <td className="p-3">{cls.teacher}</td>
                <td className="p-3">
                  <div className="flex items-center">
                    <Users size={16} className="mr-2 text-gray-500" />
                    {cls.students}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => setClasses(classes.filter(c => c.id !== cls.id))}
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Total Classes</div>
          <div className="text-2xl font-bold">{classes.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Total Students</div>
          <div className="text-2xl font-bold">
            {classes.reduce((sum, cls) => sum + cls.students, 0)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Average per Class</div>
          <div className="text-2xl font-bold">
            {Math.round(classes.reduce((sum, cls) => sum + cls.students, 0) / classes.length)}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ClassManagement;