import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  School,
  MapPin,
  Phone,
  Mail,
  User,
  Calendar,
  Save,
  Upload,
  Loader2,
  CheckCircle,
  Image,
  Building
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { ShimmerDashboard } from '../components/common/Shimmer';
import { apiMethods } from '../utils/api';
import toast from 'react-hot-toast';

const SchoolSetupPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [schoolExists, setSchoolExists] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); // Show form only when editing
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  const currentYear = new Date().getFullYear();

  const [schoolInfo, setSchoolInfo] = useState({
    name: '',
    code: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    phone: '',
    email: '',
    principalName: '',
    establishmentYear: '',
    schoolType: 'primary',
    academicYear: `${currentYear}-${currentYear + 1}`,
    studentCapacity: '',
  });

  // Fetch existing school data on mount
  useEffect(() => {
    fetchSchoolData();
  }, []);

  const fetchSchoolData = async () => {
    setIsLoading(true);
    try {
      const response = await apiMethods.getSchools();
      if (response.success && response.data && response.data.length > 0) {
        const school = response.data[0]; // Get first school
        setSchoolExists(true);
        setSchoolInfo({
          name: school.name || '',
          code: school.code || '',
          street: school.address?.street || '',
          city: school.address?.city || '',
          state: school.address?.state || '',
          pincode: school.address?.pincode || '',
          country: school.address?.country || 'India',
          phone: school.contact?.phone || '',
          email: school.contact?.email || '',
          principalName: school.contact?.principalName || '',
          establishmentYear: school.establishmentYear || '',
          schoolType: school.schoolType || '',
          academicYear: school.academicYear || `${currentYear}-${currentYear + 1}`,
          studentCapacity: school.studentCapacity || '',
        });
        if (school.logo) {
          setLogoPreview(school.logo);
        }
      }
    } catch (error) {
      console.log('No existing school found, starting fresh setup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSchoolInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo size should be less than 2MB');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateSchoolCode = () => {
    const nameParts = schoolInfo.name.split(' ');
    const code = nameParts.map(p => p.charAt(0).toUpperCase()).join('') +
      Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    handleChange('code', code);
  };

  const validateForm = () => {
    if (!schoolInfo.name.trim()) {
      toast.error('Please enter school name');
      return false;
    }
    if (!schoolInfo.code.trim()) {
      toast.error('Please enter or generate school code');
      return false;
    }
    if (!schoolInfo.city.trim()) {
      toast.error('Please enter city');
      return false;
    }
    if (!schoolInfo.state.trim()) {
      toast.error('Please enter state');
      return false;
    }
    if (!schoolInfo.phone.trim()) {
      toast.error('Please enter contact phone');
      return false;
    }
    if (!schoolInfo.email.trim()) {
      toast.error('Please enter contact email');
      return false;
    }
    if (!schoolInfo.principalName.trim()) {
      toast.error('Please enter principal name');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const schoolData = {
        name: schoolInfo.name,
        code: schoolInfo.code.toUpperCase(),
        address: {
          street: schoolInfo.street,
          city: schoolInfo.city,
          state: schoolInfo.state,
          pincode: schoolInfo.pincode,
          country: schoolInfo.country,
        },
        contact: {
          phone: schoolInfo.phone,
          email: schoolInfo.email,
          principalName: schoolInfo.principalName,
        },
        academicYear: schoolInfo.academicYear,
        schoolType: schoolInfo.schoolType,
        studentCapacity: parseInt(schoolInfo.studentCapacity) || 0,
        establishmentYear: schoolInfo.establishmentYear,
      };

      // If logo file exists, convert to base64 and include
      if (logoFile) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          schoolData.logo = e.target.result;
          await saveSchool(schoolData);
        };
        reader.readAsDataURL(logoFile);
      } else {
        await saveSchool(schoolData);
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save school information');
      setIsSaving(false);
    }
  };

  const saveSchool = async (schoolData) => {
    try {
      let response;
      if (schoolExists) {
        // Update existing school
        response = await apiMethods.updateSchoolProfile(schoolData);
      } else {
        // Create new school
        response = await apiMethods.createSchool(schoolData);
      }

      if (response.success) {
        toast.success('School information saved successfully!');
        setSchoolExists(true);
        setIsEditMode(false); // Switch back to view mode after saving
      }
    } catch (error) {
      console.error('Save school error:', error);
      toast.error(error.message || 'Failed to save school');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <ShimmerDashboard />
      </div>
    );
  }

  // Profile View Mode - when school exists and not editing
  if (schoolExists && !isEditMode) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                School Profile
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">Your school information</p>
            </div>
            <Button
              onClick={() => setIsEditMode(true)}
              size="sm"
              className="flex items-center gap-2 flex-shrink-0"
            >
              <Save size={16} />
              <span className="hidden sm:inline">Edit </span>Profile
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* School Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <Card className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                {/* Logo */}
                <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                  {logoPreview ? (
                    <img src={logoPreview} alt="School Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building size={32} className="text-blue-500" />
                  )}
                </div>

                {/* School Info */}
                <div className="flex-1 min-w-0 text-center sm:text-left w-full">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800 truncate">{schoolInfo.name || 'School Name'}</h2>
                  <p className="text-blue-600 font-mono text-xs md:text-sm mt-1">Code: {schoolInfo.code}</p>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4">
                    <div className="flex items-center text-gray-600 text-sm">
                      <MapPin size={14} className="mr-2 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{schoolInfo.city}, {schoolInfo.state}</span>
                    </div>
                    <div className="flex items-center text-gray-600 text-sm">
                      <Phone size={14} className="mr-2 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{schoolInfo.phone || 'Not set'}</span>
                    </div>
                    <div className="flex items-center text-gray-600 text-sm">
                      <Mail size={14} className="mr-2 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{schoolInfo.email || 'Not set'}</span>
                    </div>
                    <div className="flex items-center text-gray-600 text-sm">
                      <User size={14} className="mr-2 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{schoolInfo.principalName || 'Not set'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t grid grid-cols-3 gap-2 md:gap-4">
                <div className="text-center">
                  <p className="text-xs md:text-sm text-gray-500">School Type</p>
                  <p className="font-semibold text-gray-800 capitalize text-sm md:text-base truncate">{schoolInfo.schoolType}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs md:text-sm text-gray-500">Academic Year</p>
                  <p className="font-semibold text-gray-800 text-sm md:text-base">{schoolInfo.academicYear}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs md:text-sm text-gray-500">Established</p>
                  <p className="font-semibold text-gray-800 text-sm md:text-base">{schoolInfo.establishmentYear || 'N/A'}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/classes')}
                  className="w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <School size={16} className="text-white" />
                  </div>
                  <span className="font-medium text-gray-700">Manage Classes</span>
                </button>
                <button
                  onClick={() => navigate('/teachers')}
                  className="w-full p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center"
                >
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                    <User size={16} className="text-white" />
                  </div>
                  <span className="font-medium text-gray-700">Manage Teachers</span>
                </button>
                <button
                  onClick={() => navigate('/student-registration')}
                  className="w-full p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center"
                >
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                    <User size={16} className="text-white" />
                  </div>
                  <span className="font-medium text-gray-700">Register Students</span>
                </button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 md:mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl md:text-3xl font-bold text-gray-800 flex items-center">
              <Building className="mr-2 md:mr-3 text-blue-600 flex-shrink-0" size={24} />
              <span className="truncate">{schoolExists ? 'Edit School Profile' : 'School Setup'}</span>
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1 truncate">
              {schoolExists ? 'Update your school information' : 'Configure your school to get started'}
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3 flex-shrink-0">
            {schoolExists && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditMode(false)}
              >
                Cancel
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              icon={isSaving ? Loader2 : Save}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : <><span className="hidden sm:inline">Save </span>Changes</>}
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
        {/* School Logo and Status */}
        <div className="lg:col-span-1">
          <Card className="p-6 text-center">
            <div
              className="w-32 h-32 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-4 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => fileInputRef.current?.click()}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="School Logo" className="w-full h-full object-cover" />
              ) : (
                <School className="text-blue-400" size={48} />
              )}
            </div>
            <h3 className="font-bold text-gray-800 mb-2">School Logo</h3>
            <p className="text-sm text-gray-600 mb-4">Click to upload (Max 2MB)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              icon={Upload}
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Logo
            </Button>
          </Card>

          {/* Setup Progress */}
          <Card className="p-6 mt-6">
            <h3 className="font-bold text-gray-800 mb-4">Setup Progress</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${schoolInfo.name ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                  {schoolInfo.name ? <CheckCircle size={16} /> : '1'}
                </div>
                <span className={schoolInfo.name ? 'text-green-600' : 'text-gray-600'}>
                  Basic Information
                </span>
              </div>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${schoolInfo.phone && schoolInfo.email ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                  {schoolInfo.phone && schoolInfo.email ? <CheckCircle size={16} /> : '2'}
                </div>
                <span className={schoolInfo.phone && schoolInfo.email ? 'text-green-600' : 'text-gray-600'}>
                  Contact Details
                </span>
              </div>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${logoPreview ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                  {logoPreview ? <CheckCircle size={16} /> : '3'}
                </div>
                <span className={logoPreview ? 'text-green-600' : 'text-gray-600'}>
                  School Logo
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* School Information Form */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School Name *
                </label>
                <Input
                  value={schoolInfo.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter school name"
                  icon={School}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School Code *
                </label>
                <div className="flex gap-2">
                  <Input
                    value={schoolInfo.code}
                    onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                    placeholder="e.g., ABC001"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={generateSchoolCode}
                    disabled={!schoolInfo.name}
                  >
                    Generate
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year *
                </label>
                <Input
                  value={schoolInfo.academicYear}
                  onChange={(e) => handleChange('academicYear', e.target.value)}
                  placeholder="e.g., 2024-2025"
                  icon={Calendar}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address
                </label>
                <textarea
                  value={schoolInfo.street}
                  onChange={(e) => handleChange('street', e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                  rows="2"
                  placeholder="Enter complete street address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <Input
                  value={schoolInfo.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Enter city"
                  icon={MapPin}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <Input
                  value={schoolInfo.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  placeholder="Enter state"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pin Code
                </label>
                <Input
                  value={schoolInfo.pincode}
                  onChange={(e) => handleChange('pincode', e.target.value)}
                  placeholder="Enter pin code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <select
                  value={schoolInfo.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                >
                  <option value="India">India</option>
                  <option value="USA">USA</option>
                  <option value="UK">UK</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="p-6 mt-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Contact Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone *
                </label>
                <Input
                  value={schoolInfo.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                  icon={Phone}
                  type="tel"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email *
                </label>
                <Input
                  value={schoolInfo.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Enter email address"
                  icon={Mail}
                  type="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Principal Name *
                </label>
                <Input
                  value={schoolInfo.principalName}
                  onChange={(e) => handleChange('principalName', e.target.value)}
                  placeholder="Enter principal's name"
                  icon={User}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Establishment Year
                </label>
                <Input
                  value={schoolInfo.establishmentYear}
                  onChange={(e) => handleChange('establishmentYear', e.target.value)}
                  placeholder="Enter year (e.g., 1990)"
                  icon={Calendar}
                  type="number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School Type
                </label>
                <select
                  value={schoolInfo.schoolType}
                  onChange={(e) => handleChange('schoolType', e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                >
                  <option value="primary">Primary School (1-5)</option>
                  <option value="middle">Middle School (6-8)</option>
                  <option value="high">High School (9-10)</option>
                  <option value="secondary">Higher Secondary (11-12)</option>
                  <option value="k12">K-12 School</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Capacity
                </label>
                <Input
                  value={schoolInfo.studentCapacity}
                  onChange={(e) => handleChange('studentCapacity', e.target.value)}
                  placeholder="Maximum students"
                  type="number"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <Button variant="outline" onClick={() => navigate('/admin')}>
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={isSaving ? Loader2 : Save}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save & Continue to Classes'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SchoolSetupPage;