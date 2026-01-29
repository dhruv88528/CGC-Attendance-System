import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Camera,
  Upload,
  Save,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import BackButton from '../components/common/BackButton';
import CameraCapture from '../components/common/CameraCapture';
import { apiMethods } from '../utils/api';
import toast from 'react-hot-toast';

const StudentRegistrationPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [isDetectingFace, setIsDetectingFace] = useState(false);
  const [faceDetected, setFaceDetected] = useState(null); // null, true, false
  const [faceError, setFaceError] = useState('');

  const [studentInfo, setStudentInfo] = useState({
    firstName: '',
    lastName: '',
    rollNumber: '',
    dateOfBirth: '',
    gender: '',
    classId: '',
    section: '',
    fatherName: '',
    motherName: '',
    parentPhone: '',
    parentEmail: '',
    address: '',
    city: '',
    pinCode: '',
  });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch classes from backend
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
      // If API fails, use empty array - no fake data
      setClasses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get sections for selected class
  useEffect(() => {
    if (studentInfo.classId) {
      const selectedClass = classes.find(c => c._id === studentInfo.classId);
      if (selectedClass && selectedClass.sections) {
        setSections(selectedClass.sections);
      } else {
        setSections(['A', 'B', 'C', 'D']); // Default sections
      }
    }
  }, [studentInfo.classId, classes]);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!studentInfo.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!studentInfo.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!studentInfo.rollNumber.trim()) {
      newErrors.rollNumber = 'Roll number is required';
    }
    if (!studentInfo.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }
    if (!studentInfo.gender) {
      newErrors.gender = 'Gender is required';
    }
    if (!studentInfo.classId) {
      newErrors.classId = 'Class is required';
    }
    if (!studentInfo.section) {
      newErrors.section = 'Section is required';
    }
    if (!studentInfo.fatherName.trim()) {
      newErrors.fatherName = "Father's name is required";
    }
    if (!studentInfo.parentPhone.trim()) {
      newErrors.parentPhone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(studentInfo.parentPhone)) {
      newErrors.parentPhone = 'Invalid phone number (10 digits required)';
    }
    if (!photoPreview) {
      newErrors.photo = 'Student photo is required for face recognition';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!faceDetected) {
      toast.error('Please capture a valid photo with human face');
      return;
    }

    setIsSaving(true);
    try {
      // Step 1: Get face encoding from AI service
      let faceEncoding = null;

      if (photoPreview) {
        try {
          const encodingResponse = await apiMethods.encodeFace(photoPreview);

          if (encodingResponse.success && encodingResponse.encoding) {
            faceEncoding = encodingResponse.encoding;
          } else {
            toast.error(encodingResponse.error || 'Failed to process face');
            setIsSaving(false);
            return;
          }
        } catch (encError) {
          console.error('Face encoding error:', encError);
          toast.error('Failed to process face - please try again');
          setIsSaving(false);
          return;
        }
      }

      // Step 2: Prepare student data with BOTH face image and encoding
      const studentData = {
        rollNumber: studentInfo.rollNumber,
        firstName: studentInfo.firstName,
        lastName: studentInfo.lastName,
        dateOfBirth: studentInfo.dateOfBirth,
        gender: studentInfo.gender,
        parentName: studentInfo.fatherName,
        parentPhone: studentInfo.parentPhone,
        address: `${studentInfo.address}, ${studentInfo.city} - ${studentInfo.pinCode}`,
        classId: studentInfo.classId,
        faceImage: photoPreview,      // Base64 image for admin viewing
        faceEncoding: faceEncoding,   // 128-D encoding for AI matching
      };

      // Step 3: Save student to database
      const response = await apiMethods.createStudent(studentData);

      if (response.success) {
        toast.success('Student registered successfully with face recognition!');
        navigate('/admin');
      } else {
        toast.error(response.message || 'Failed to register student');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to register student');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
        setPhotoFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = async (data) => {
    const imageUrl = data?.image?.url || data?.image || (typeof data === 'string' ? data : null);

    if (!imageUrl) {
      toast.error('Failed to capture image');
      return;
    }

    setShowCamera(false);
    setPhotoPreview(imageUrl);
    setIsDetectingFace(true);
    setFaceDetected(null);
    setFaceError('');

    try {
      // Call AI service to detect and validate human face
      const response = await apiMethods.detectFaces(imageUrl);

      if (response.success && response.faces > 0) {
        setFaceDetected(true);
        setFaceError('');
        toast.success('✅ Human face detected successfully!');
      } else {
        setFaceDetected(false);
        const errorMsg = response.message || response.errors?.[0] || 'No human face detected';
        setFaceError(errorMsg);
        toast.error(`❌ ${errorMsg}`);
      }
    } catch (error) {
      console.error('Face detection error:', error);
      // STRICT: Don't allow images if face detection fails
      setFaceDetected(false);
      setFaceError('Face detection service error - please try again');
      toast.error('❌ Could not verify face. Please try again.');
    } finally {
      setIsDetectingFace(false);
    }
  };

  const handleChange = (field, value) => {
    setStudentInfo(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
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
            <BackButton to="/students" />
            <div className="min-w-0">
              <h1 className="text-xl md:text-3xl font-bold text-gray-800 flex items-center">
                <UserPlus className="mr-2 md:mr-3 flex-shrink-0" size={24} />
                <span className="truncate">Student Registration</span>
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1 truncate">Register new students with face capture for attendance</p>
            </div>
          </div>
          <Button
            variant="primary"
            icon={isSaving ? Loader2 : Save}
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : <><span className="hidden sm:inline">Register </span>Student</>}
          </Button>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Photo Section */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h3 className="font-bold text-gray-800 mb-4 text-center">Student Photo *</h3>

            <div className="flex flex-col items-center">
              <div className={`w-48 h-48 rounded-xl bg-gray-100 flex items-center justify-center mb-4 overflow-hidden border-2 ${errors.photo ? 'border-red-500' : faceDetected === true ? 'border-green-500' : faceDetected === false ? 'border-red-500' : 'border-gray-200'}`}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Student" className="w-full h-full object-cover" />
                ) : (
                  <UserPlus className="text-gray-400" size={48} />
                )}
              </div>

              {/* Face Detection Status */}
              {isDetectingFace && (
                <div className="flex items-center text-blue-600 mb-2">
                  <Loader2 className="animate-spin mr-2" size={16} />
                  <span className="text-sm">Detecting face...</span>
                </div>
              )}
              {faceDetected === true && !isDetectingFace && (
                <div className="flex items-center text-green-600 mb-2">
                  <CheckCircle className="mr-2" size={16} />
                  <span className="text-sm font-medium">Human face detected ✓</span>
                </div>
              )}
              {faceDetected === false && !isDetectingFace && (
                <div className="flex flex-col items-center mb-2">
                  <div className="flex items-center text-red-600">
                    <XCircle className="mr-2" size={16} />
                    <span className="text-sm font-medium">Face not detected</span>
                  </div>
                  {faceError && (
                    <span className="text-xs text-red-500 mt-1">{faceError}</span>
                  )}
                </div>
              )}

              {errors.photo && (
                <p className="text-red-500 text-sm mb-2">{errors.photo}</p>
              )}

              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  icon={Camera}
                  className="flex-1"
                  onClick={() => setShowCamera(true)}
                >
                  Camera
                </Button>
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Upload size={18} />
                    <span>Upload</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>
              </div>

              <p className="text-xs text-gray-500 mt-3 text-center">
                Photo is required for face recognition attendance
              </p>
            </div>
          </Card>

          {/* Info Card */}
          <Card className="p-6 mt-6 bg-blue-50">
            <h3 className="font-bold text-gray-800 mb-4">Important Notes</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• All fields marked with * are required</li>
              <li>• Photo must be clear front-facing</li>
              <li>• Roll number must be unique</li>
              <li>• Phone number should be 10 digits</li>
            </ul>
          </Card>
        </div>

        {/* Registration Form */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Student Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <Input
                  value={studentInfo.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                  error={errors.firstName}
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <Input
                  value={studentInfo.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                  error={errors.lastName}
                />
              </div>

              {/* Roll Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Roll Number *
                </label>
                <Input
                  value={studentInfo.rollNumber}
                  onChange={(e) => handleChange('rollNumber', e.target.value)}
                  placeholder="Enter roll number"
                  error={errors.rollNumber}
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <Input
                  value={studentInfo.dateOfBirth}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  type="date"
                  icon={Calendar}
                  error={errors.dateOfBirth}
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  value={studentInfo.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none ${errors.gender ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
              </div>

              {/* Class */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class *
                </label>
                <select
                  value={studentInfo.classId}
                  onChange={(e) => handleChange('classId', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none ${errors.classId ? 'border-red-500' : 'border-gray-300'}`}
                  disabled={isLoading}
                >
                  <option value="">Select class</option>
                  {classes.map(cls => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name || `Class ${cls.grade}`} - {cls.section || ''}
                    </option>
                  ))}
                </select>
                {errors.classId && <p className="text-red-500 text-sm mt-1">{errors.classId}</p>}
                {classes.length === 0 && !isLoading && (
                  <p className="text-yellow-600 text-sm mt-1">No classes found. Please create classes first.</p>
                )}
              </div>

              {/* Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section *
                </label>
                <select
                  value={studentInfo.section}
                  onChange={(e) => handleChange('section', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none ${errors.section ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select section</option>
                  {sections.map(sec => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>
                {errors.section && <p className="text-red-500 text-sm mt-1">{errors.section}</p>}
              </div>

              {/* Father's Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Father's Name *
                </label>
                <Input
                  value={studentInfo.fatherName}
                  onChange={(e) => handleChange('fatherName', e.target.value)}
                  placeholder="Enter father's name"
                  error={errors.fatherName}
                />
              </div>

              {/* Mother's Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mother's Name
                </label>
                <Input
                  value={studentInfo.motherName}
                  onChange={(e) => handleChange('motherName', e.target.value)}
                  placeholder="Enter mother's name"
                />
              </div>

              {/* Parent Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Phone *
                </label>
                <Input
                  value={studentInfo.parentPhone}
                  onChange={(e) => handleChange('parentPhone', e.target.value)}
                  placeholder="Enter 10-digit phone number"
                  icon={Phone}
                  type="tel"
                  maxLength={10}
                  error={errors.parentPhone}
                />
              </div>

              {/* Parent Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Email
                </label>
                <Input
                  value={studentInfo.parentEmail}
                  onChange={(e) => handleChange('parentEmail', e.target.value)}
                  placeholder="Enter email address"
                  icon={Mail}
                  type="email"
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={studentInfo.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                  rows="2"
                  placeholder="Enter complete address"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <Input
                  value={studentInfo.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Enter city"
                  icon={MapPin}
                />
              </div>

              {/* Pin Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pin Code
                </label>
                <Input
                  value={studentInfo.pinCode}
                  onChange={(e) => handleChange('pinCode', e.target.value)}
                  placeholder="Enter pin code"
                  type="number"
                  maxLength={6}
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <Button variant="outline" onClick={() => navigate('/admin')}>
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={isSaving ? Loader2 : Save}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Register Student'}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Camera Capture Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full overflow-hidden">
            <CameraCapture
              onCapture={handleCameraCapture}
              onClose={() => setShowCamera(false)}
              mode="photo"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentRegistrationPage;