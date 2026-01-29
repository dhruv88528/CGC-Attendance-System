import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Bell,
  Palette,
  Shield,
  Database,
  Network,
  Camera,
  Users,
  Save,
  RotateCcw
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import BackButton from '../components/common/BackButton';
import ToggleSwitch from '../components/common/ToggleSwitch';
import Input from '../components/common/Input';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    // General Settings
    schoolName: 'Rural Primary School',
    schoolAddress: '123 Education Street, Village',
    contactEmail: 'info@school.edu',
    contactPhone: '+1234567890',

    // Attendance Settings
    autoAttendance: true,
    faceRecognition: true,
    manualEntry: true,
    lateThreshold: 10,

    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    parentNotifications: true,
    dailyReports: true,

    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,

    // Camera Settings
    cameraQuality: 'high',
    recognitionThreshold: 85,
    retryAttempts: 3,
  });

  const handleSave = () => {
    // Save settings to localStorage
    localStorage.setItem('app_settings', JSON.stringify(settings));
    toast.success('✅ Settings saved successfully!', { id: 'settings-save' });
  };

  const handleReset = () => {
    const defaultSettings = {
      schoolName: 'Rural Primary School',
      schoolAddress: '123 Education Street, Village',
      contactEmail: 'info@school.edu',
      contactPhone: '+1234567890',
      autoAttendance: true,
      faceRecognition: true,
      manualEntry: true,
      lateThreshold: 10,
      emailNotifications: true,
      smsNotifications: false,
      parentNotifications: true,
      dailyReports: true,
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordExpiry: 90,
      cameraQuality: 'high',
      recognitionThreshold: 85,
      retryAttempts: 3,
    };
    setSettings(defaultSettings);
    localStorage.removeItem('app_settings');
    toast.success('🔄 Settings reset to defaults!', { id: 'settings-reset' });
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton />
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mr-4">
                <Settings className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">System Settings</h1>
                <p className="text-gray-600">Configure application preferences and behavior</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" icon={RotateCcw} onClick={handleReset}>
              Reset Defaults
            </Button>
            <Button variant="primary" icon={Save} onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <nav className="space-y-2">
              {[
                { id: 'general', label: 'General', icon: Settings },
                { id: 'attendance', label: 'Attendance', icon: Camera },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'security', label: 'Security', icon: Shield },
                { id: 'camera', label: 'Camera', icon: Camera },
              ].map((item) => (
                <button
                  key={item.id}
                  className="w-full flex items-center p-3 rounded-lg text-left hover:bg-gray-50 transition-colors"
                  onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <item.icon className="text-gray-600 mr-3" size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Settings */}
          <motion.div
            id="general"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <Settings className="mr-2" size={24} />
                General Settings
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School Name
                  </label>
                  <Input
                    value={settings.schoolName}
                    onChange={(e) => handleChange('schoolName', e.target.value)}
                    placeholder="Enter school name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School Address
                  </label>
                  <textarea
                    value={settings.schoolAddress}
                    onChange={(e) => handleChange('schoolAddress', e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                    rows="3"
                    placeholder="Enter school address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email
                    </label>
                    <Input
                      value={settings.contactEmail}
                      onChange={(e) => handleChange('contactEmail', e.target.value)}
                      type="email"
                      placeholder="Enter email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Phone
                    </label>
                    <Input
                      value={settings.contactPhone}
                      onChange={(e) => handleChange('contactPhone', e.target.value)}
                      type="tel"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Attendance Settings */}
          <motion.div
            id="attendance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <Camera className="mr-2" size={24} />
                Attendance Settings
              </h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800">Auto Attendance</h3>
                    <p className="text-sm text-gray-600">Enable automatic attendance marking</p>
                  </div>
                  <ToggleSwitch
                    checked={settings.autoAttendance}
                    onChange={(checked) => handleChange('autoAttendance', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800">Face Recognition</h3>
                    <p className="text-sm text-gray-600">Use AI for student identification</p>
                  </div>
                  <ToggleSwitch
                    checked={settings.faceRecognition}
                    onChange={(checked) => handleChange('faceRecognition', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800">Manual Entry</h3>
                    <p className="text-sm text-gray-600">Allow manual attendance entry</p>
                  </div>
                  <ToggleSwitch
                    checked={settings.manualEntry}
                    onChange={(checked) => handleChange('manualEntry', checked)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Late Arrival Threshold (minutes)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={settings.lateThreshold}
                    onChange={(e) => handleChange('lateThreshold', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>1 min</span>
                    <span className="font-medium">{settings.lateThreshold} mins</span>
                    <span>60 mins</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Notification Settings */}
          <motion.div
            id="notifications"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <Bell className="mr-2" size={24} />
                Notification Settings
              </h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800">Email Notifications</h3>
                    <p className="text-sm text-gray-600">Receive alerts via email</p>
                  </div>
                  <ToggleSwitch
                    checked={settings.emailNotifications}
                    onChange={(checked) => handleChange('emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800">SMS Notifications</h3>
                    <p className="text-sm text-gray-600">Receive alerts via SMS</p>
                  </div>
                  <ToggleSwitch
                    checked={settings.smsNotifications}
                    onChange={(checked) => handleChange('smsNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800">Parent Notifications</h3>
                    <p className="text-sm text-gray-600">Notify parents about attendance</p>
                  </div>
                  <ToggleSwitch
                    checked={settings.parentNotifications}
                    onChange={(checked) => handleChange('parentNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800">Daily Reports</h3>
                    <p className="text-sm text-gray-600">Send daily attendance reports</p>
                  </div>
                  <ToggleSwitch
                    checked={settings.dailyReports}
                    onChange={(checked) => handleChange('dailyReports', checked)}
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Security Settings */}
          <motion.div
            id="security"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <Shield className="mr-2" size={24} />
                Security Settings
              </h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-600">Require 2FA for admin accounts</p>
                  </div>
                  <ToggleSwitch
                    checked={settings.twoFactorAuth}
                    onChange={(checked) => handleChange('twoFactorAuth', checked)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="120"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>5 mins</span>
                    <span className="font-medium">{settings.sessionTimeout} mins</span>
                    <span>120 mins</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password Expiry (days)
                  </label>
                  <select
                    value={settings.passwordExpiry}
                    onChange={(e) => handleChange('passwordExpiry', parseInt(e.target.value))}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                  >
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                    <option value={180}>180 days</option>
                  </select>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Camera Settings */}
          <motion.div
            id="camera"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <Camera className="mr-2" size={24} />
                Camera Settings
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Camera Quality
                  </label>
                  <select
                    value={settings.cameraQuality}
                    onChange={(e) => handleChange('cameraQuality', e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                  >
                    <option value="low">Low (Faster processing)</option>
                    <option value="medium">Medium</option>
                    <option value="high">High (Best quality)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recognition Threshold (%)
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={settings.recognitionThreshold}
                    onChange={(e) => handleChange('recognitionThreshold', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>50%</span>
                    <span className="font-medium">{settings.recognitionThreshold}%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Retry Attempts
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={settings.retryAttempts}
                    onChange={(e) => handleChange('retryAttempts', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>1</span>
                    <span className="font-medium">{settings.retryAttempts}</span>
                    <span>10</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;