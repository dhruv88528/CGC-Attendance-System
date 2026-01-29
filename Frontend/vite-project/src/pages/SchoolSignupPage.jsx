import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
    Building,
    User,
    Mail,
    Lock,
    Phone,
    MapPin,
    Loader2,
    ArrowRight,
    CheckCircle
} from 'lucide-react';
import { apiMethods } from '../utils/api';
import toast from 'react-hot-toast';

const SchoolSignupPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        // School Info
        schoolName: '',
        schoolCode: '',
        city: '',
        state: '',
        schoolPhone: '',
        principalName: '',
        // Admin Info (email is also used as school email)
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        confirmPassword: '',
        adminPhone: '',
    });

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle phone input - only allow digits
    const handlePhoneChange = (field, value) => {
        const digitsOnly = value.replace(/\D/g, '');
        handleChange(field, digitsOnly);
    };

    // Handle name input - no digits allowed
    const handleNameChange = (field, value) => {
        const noDigits = value.replace(/\d/g, '');
        handleChange(field, noDigits);
    };

    const generateSchoolCode = () => {
        if (formData.schoolName) {
            const nameParts = formData.schoolName.split(' ');
            const code = nameParts.map(p => p.charAt(0).toUpperCase()).join('') +
                Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            handleChange('schoolCode', code);
        }
    };

    const validateStep1 = () => {
        // School name validation
        if (!formData.schoolName.trim()) {
            toast.error('Please enter school name');
            return false;
        }
        if (formData.schoolName.length < 3) {
            toast.error('School name must be at least 3 characters');
            return false;
        }
        if (formData.schoolName.length > 100) {
            toast.error('School name must be less than 100 characters');
            return false;
        }
        if (/\d/.test(formData.schoolName)) {
            toast.error('School name should not contain numbers');
            return false;
        }

        // School code validation
        if (!formData.schoolCode.trim()) {
            toast.error('Please enter or generate school code');
            return false;
        }
        if (formData.schoolCode.length > 20) {
            toast.error('School code must be less than 20 characters');
            return false;
        }

        // City validation
        if (!formData.city.trim()) {
            toast.error('Please enter city');
            return false;
        }
        if (formData.city.length > 50) {
            toast.error('City name must be less than 50 characters');
            return false;
        }
        if (/\d/.test(formData.city)) {
            toast.error('City name should not contain numbers');
            return false;
        }

        // State validation
        if (formData.state && formData.state.length > 50) {
            toast.error('State name must be less than 50 characters');
            return false;
        }
        if (formData.state && /\d/.test(formData.state)) {
            toast.error('State name should not contain numbers');
            return false;
        }

        // Phone validation - only numbers allowed
        if (formData.schoolPhone && !/^\d*$/.test(formData.schoolPhone)) {
            toast.error('Phone number should contain only digits');
            return false;
        }
        if (formData.schoolPhone && (formData.schoolPhone.length < 10 || formData.schoolPhone.length > 15)) {
            toast.error('Phone number should be 10-15 digits');
            return false;
        }

        // Principal name validation
        if (formData.principalName && formData.principalName.length > 100) {
            toast.error('Principal name must be less than 100 characters');
            return false;
        }
        if (formData.principalName && /\d/.test(formData.principalName)) {
            toast.error('Principal name should not contain numbers');
            return false;
        }

        return true;
    };

    const validateStep2 = () => {
        if (!formData.adminName.trim()) {
            toast.error('Please enter admin name');
            return false;
        }
        // Admin name should not contain numbers
        if (/\d/.test(formData.adminName)) {
            toast.error('Admin name should not contain numbers');
            return false;
        }
        if (!formData.adminEmail.trim()) {
            toast.error('Please enter admin email');
            return false;
        }
        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.adminEmail)) {
            toast.error('Please enter a valid email address (e.g., admin@school.com)');
            return false;
        }
        // Admin phone validation - only numbers
        if (formData.adminPhone && !/^\d*$/.test(formData.adminPhone)) {
            toast.error('Admin phone should contain only digits');
            return false;
        }
        if (!formData.adminPassword) {
            toast.error('Please enter password');
            return false;
        }
        if (formData.adminPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return false;
        }
        if (formData.adminPassword !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return false;
        }
        return true;
    };

    const handleNextStep = () => {
        if (step === 1 && validateStep1()) {
            setStep(2);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep2()) return;

        setIsLoading(true);
        try {
            const response = await apiMethods.registerSchool({
                schoolName: formData.schoolName,
                schoolCode: formData.schoolCode,
                city: formData.city,
                state: formData.state,
                phone: formData.schoolPhone,
                email: formData.adminEmail, // School email = Admin email
                principalName: formData.principalName,
                adminName: formData.adminName,
                adminEmail: formData.adminEmail,
                adminPassword: formData.adminPassword,
                adminPhone: formData.adminPhone,
            });

            if (response.success) {
                // Store token and user data
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));

                toast.success('School registered successfully! Redirecting...');

                // Navigate to admin dashboard using window.location for full page reload
                // This ensures context is properly loaded
                setTimeout(() => {
                    window.location.href = '/admin';
                }, 500);
            }
        } catch (error) {
            console.error('Registration error:', error);
            toast.error(error.message || 'Failed to register school');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 relative"
            style={{
                backgroundImage: 'url(/images/rural-school-bg.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            {/* Overlay for better readability */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                    <h1 className="text-2xl font-bold flex items-center">
                        <Building className="mr-3" size={28} />
                        Register Your School
                    </h1>
                    <p className="text-blue-100 mt-2">
                        Create your school account to get started with Smart Attendance
                    </p>

                    {/* Progress Steps */}
                    <div className="flex items-center mt-6">
                        <div className={`flex items-center ${step >= 1 ? 'text-white' : 'text-blue-200'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step > 1 ? 'bg-green-500' : step === 1 ? 'bg-white text-blue-600' : 'bg-blue-400'
                                }`}>
                                {step > 1 ? <CheckCircle size={16} /> : '1'}
                            </div>
                            <span className="ml-2 font-medium">School Info</span>
                        </div>
                        <div className="flex-1 h-1 mx-4 bg-blue-400 rounded">
                            <div className={`h-full bg-white rounded transition-all ${step > 1 ? 'w-full' : 'w-0'}`} />
                        </div>
                        <div className={`flex items-center ${step >= 2 ? 'text-white' : 'text-blue-200'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 2 ? 'bg-white text-blue-600' : 'bg-blue-400'
                                }`}>
                                2
                            </div>
                            <span className="ml-2 font-medium">Admin Account</span>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    {step === 1 ? (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-4"
                        >
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">School Information</h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    School Name *
                                </label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={formData.schoolName}
                                        onChange={(e) => handleNameChange('schoolName', e.target.value)}
                                        maxLength={100}
                                        className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                                        placeholder="e.g., Delhi Public School (letters only)"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">{formData.schoolName.length}/100 characters</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        School Code *
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={formData.schoolCode}
                                            onChange={(e) => handleChange('schoolCode', e.target.value.toUpperCase())}
                                            className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                                            placeholder="e.g., DPS001"
                                        />
                                        <button
                                            type="button"
                                            onClick={generateSchoolCode}
                                            className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm"
                                        >
                                            Generate
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Principal Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.principalName}
                                        onChange={(e) => handleNameChange('principalName', e.target.value)}
                                        maxLength={100}
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                                        placeholder="Principal name (letters only)"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        City *
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => handleNameChange('city', e.target.value)}
                                            maxLength={50}
                                            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                                            placeholder="City (letters only)"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        State
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.state}
                                        onChange={(e) => handleNameChange('state', e.target.value)}
                                        maxLength={50}
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                                        placeholder="State (letters only)"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    School Phone
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="tel"
                                        value={formData.schoolPhone}
                                        onChange={(e) => handlePhoneChange('schoolPhone', e.target.value)}
                                        maxLength={15}
                                        className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                                        placeholder="Phone number (digits only)"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">10-15 digits only. School email will be your admin email.</p>
                            </div>

                            <button
                                type="button"
                                onClick={handleNextStep}
                                className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center"
                            >
                                Continue
                                <ArrowRight className="ml-2" size={18} />
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-4"
                        >
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Admin Account</h2>
                            <p className="text-sm text-gray-600 mb-4">
                                This account will have full access to manage your school.
                            </p>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Admin Name *
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={formData.adminName}
                                        onChange={(e) => handleChange('adminName', e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                                        placeholder="Your full name"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Admin Email *
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        value={formData.adminEmail}
                                        onChange={(e) => handleChange('adminEmail', e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                                        placeholder="admin@yourschool.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Admin Phone
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="tel"
                                        value={formData.adminPhone}
                                        onChange={(e) => handleChange('adminPhone', e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                                        placeholder="Your phone number"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Password *
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="password"
                                            value={formData.adminPassword}
                                            onChange={(e) => handleChange('adminPassword', e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                                            placeholder="Min 6 characters"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm Password *
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => handleChange('confirmPassword', e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                                            placeholder="Confirm password"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="animate-spin mr-2" size={18} />
                                            Creating...
                                        </>
                                    ) : (
                                        'Create School Account'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Login Link */}
                    <div className="mt-6 text-center text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-600 hover:underline font-medium">
                            Sign In
                        </Link>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default SchoolSignupPage;