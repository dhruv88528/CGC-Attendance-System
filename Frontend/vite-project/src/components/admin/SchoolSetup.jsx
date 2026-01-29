import React, { useState } from 'react';
import { School, MapPin, Phone, User, Save } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const SchoolSetup = () => {
  const [schoolInfo, setSchoolInfo] = useState({
    name: 'Rural Primary School',
    address: 'Village Road, District, State',
    phone: '9876543210',
    principal: 'Principal Name',
    email: 'school@email.com',
    established: '2000',
    type: 'Primary School'
  });

  const handleSave = () => {
    localStorage.setItem('school_info', JSON.stringify(schoolInfo));
    toast.success('✅ School information saved successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <School className="mr-2" /> School Setup
        </h1>
        <p className="text-gray-600">Configure school profile and settings</p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          {/* School Name */}
          <div>
            <label className="block font-medium mb-2 flex items-center">
              <School size={18} className="mr-2" /> School Name
            </label>
            <input
              type="text"
              value={schoolInfo.name}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, name: e.target.value })}
              className="w-full p-3 border rounded-lg"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block font-medium mb-2 flex items-center">
              <MapPin size={18} className="mr-2" /> School Address
            </label>
            <textarea
              value={schoolInfo.address}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, address: e.target.value })}
              className="w-full p-3 border rounded-lg h-24"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phone */}
            <div>
              <label className="block font-medium mb-2 flex items-center">
                <Phone size={18} className="mr-2" /> Phone Number
              </label>
              <input
                type="tel"
                value={schoolInfo.phone}
                onChange={(e) => setSchoolInfo({ ...schoolInfo, phone: e.target.value })}
                className="w-full p-3 border rounded-lg"
              />
            </div>

            {/* Principal */}
            <div>
              <label className="block font-medium mb-2 flex items-center">
                <User size={18} className="mr-2" /> Principal Name
              </label>
              <input
                type="text"
                value={schoolInfo.principal}
                onChange={(e) => setSchoolInfo({ ...schoolInfo, principal: e.target.value })}
                className="w-full p-3 border rounded-lg"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block font-medium mb-2">Email Address</label>
              <input
                type="email"
                value={schoolInfo.email}
                onChange={(e) => setSchoolInfo({ ...schoolInfo, email: e.target.value })}
                className="w-full p-3 border rounded-lg"
              />
            </div>

            {/* Established Year */}
            <div>
              <label className="block font-medium mb-2">Established Year</label>
              <input
                type="number"
                value={schoolInfo.established}
                onChange={(e) => setSchoolInfo({ ...schoolInfo, established: e.target.value })}
                className="w-full p-3 border rounded-lg"
              />
            </div>
          </div>

          {/* School Type */}
          <div>
            <label className="block font-medium mb-2">School Type</label>
            <select
              value={schoolInfo.type}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, type: e.target.value })}
              className="w-full p-3 border rounded-lg"
            >
              <option>Primary School</option>
              <option>Middle School</option>
              <option>High School</option>
              <option>Higher Secondary</option>
            </select>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <Button onClick={handleSave} icon={Save} className="w-full">
              Save School Information
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card className="text-center p-4">
          <div className="text-2xl font-bold">256</div>
          <div className="text-sm text-gray-600">Total Students</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold">12</div>
          <div className="text-sm text-gray-600">Classes</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold">8</div>
          <div className="text-sm text-gray-600">Teachers</div>
        </Card>
      </div>
    </div>
  );
};

export default SchoolSetup;