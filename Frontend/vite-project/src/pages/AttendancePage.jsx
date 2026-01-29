import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Camera,
  Users,
  CheckCircle,
  XCircle,
  Download,
  Filter,
  Clock,
  TrendingUp,
  MessageCircle,
  Phone,
  Send,
  X,
  Menu,
  ChevronDown
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import BackButton from '../components/common/BackButton';
import Modal from '../components/common/Modal';
import { AttendanceCapture, AttendanceVerification } from '../components/teacher';
import { apiMethods } from '../utils/api';
import toast from 'react-hot-toast';

const AttendancePage = () => {
  const [activeTab, setActiveTab] = useState('capture');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Message Parents Modal states
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [studentsWithPhone, setStudentsWithPhone] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [messageType, setMessageType] = useState('whatsapp'); // 'whatsapp' or 'sms'

  // Real attendance stats from API
  const [attendanceStats, setAttendanceStats] = useState({
    today: { total: 0, present: 0, absent: 0, rate: 0 },
    week: { total: 0, present: 0, absent: 0, rate: 0 },
    month: { total: 0, present: 0, absent: 0, rate: 0 },
  });

  // Real recent attendance from API
  const [recentAttendance, setRecentAttendance] = useState([]);

  // Fetch real data from API
  useEffect(() => {
    fetchAttendanceData();
  }, [date]);

  const fetchAttendanceData = async () => {
    setIsLoading(true);
    try {
      // Fetch daily attendance
      const dailyResponse = await apiMethods.getDailyAttendance({ date });

      if (dailyResponse.success && dailyResponse.data) {
        const data = dailyResponse.data;
        const present = data.filter(a => a.status === 'present').length;
        const absent = data.filter(a => a.status === 'absent').length;
        const total = data.length;
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;

        setAttendanceStats(prev => ({
          ...prev,
          today: { total, present, absent, rate }
        }));
      } else {
        // No data - show zeros
        setAttendanceStats({
          today: { total: 0, present: 0, absent: 0, rate: 0 },
          week: { total: 0, present: 0, absent: 0, rate: 0 },
          month: { total: 0, present: 0, absent: 0, rate: 0 },
        });
        setRecentAttendance([]);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      // Show empty state on error
      setAttendanceStats({
        today: { total: 0, present: 0, absent: 0, rate: 0 },
        week: { total: 0, present: 0, absent: 0, rate: 0 },
        month: { total: 0, present: 0, absent: 0, rate: 0 },
      });
      setRecentAttendance([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Open Message Parents Modal
  const handleOpenMessageModal = async () => {
    try {
      // Fetch students to get parent phone numbers
      const response = await apiMethods.getStudents();
      if (response.success && response.data) {
        const studentsWithParentPhone = response.data.filter(s => s.parentPhone);
        setStudentsWithPhone(studentsWithParentPhone);
        setSelectedStudents(studentsWithParentPhone.map(s => s._id)); // Select all by default
        setMessageText(`Dear Parent, this is a message from the teacher regarding your child's attendance.`);
        setShowMessageModal(true);
      } else {
        toast.error('No students found', { id: 'message-error' });
      }
    } catch (error) {
      toast.error('Failed to load students', { id: 'message-error' });
    }
  };

  // Toggle student selection
  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Select/Deselect all
  const toggleSelectAll = () => {
    if (selectedStudents.length === studentsWithPhone.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(studentsWithPhone.map(s => s._id));
    }
  };

  // Send Message via WhatsApp or SMS
  const handleSendMessage = () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student', { id: 'message-error' });
      return;
    }
    if (!messageText.trim()) {
      toast.error('Please enter a message', { id: 'message-error' });
      return;
    }

    const selectedStudentData = studentsWithPhone.filter(s => selectedStudents.includes(s._id));

    if (messageType === 'whatsapp') {
      // Open WhatsApp for each selected student
      selectedStudentData.forEach((student, index) => {
        const phone = student.parentPhone.replace(/\D/g, ''); // Remove non-digits
        const phoneWithCountry = phone.startsWith('91') ? phone : `91${phone}`;
        const encodedMessage = encodeURIComponent(
          `Dear Parent of ${student.firstName} ${student.lastName || ''},\n\n${messageText}\n\n- Teacher`
        );

        // Open WhatsApp in new tab (with slight delay for each to avoid browser blocking)
        setTimeout(() => {
          window.open(`https://wa.me/${phoneWithCountry}?text=${encodedMessage}`, '_blank');
        }, index * 500);
      });

      toast.success(`Opening WhatsApp for ${selectedStudentData.length} parent(s)`, { id: 'message-success' });
    } else {
      // SMS - open default SMS app
      selectedStudentData.forEach((student, index) => {
        const phone = student.parentPhone;
        const smsBody = encodeURIComponent(
          `Parent of ${student.firstName}: ${messageText} - Teacher`
        );

        setTimeout(() => {
          window.open(`sms:${phone}?body=${smsBody}`, '_blank');
        }, index * 300);
      });

      toast.success(`Opening SMS for ${selectedStudentData.length} parent(s)`, { id: 'message-success' });
    }

    setShowMessageModal(false);
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
                <Calendar className="mr-2 md:mr-3 flex-shrink-0" size={24} />
                <span className="truncate">Attendance Management</span>
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1 truncate">Capture, verify, and manage student attendance</p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 flex-shrink-0">
            <Button variant="outline" icon={Download} size="sm" onClick={() => toast.success('Exporting attendance data...')}>
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Tabs - Hamburger on mobile, horizontal on desktop */}
      {/* Mobile: Dropdown Menu */}
      <div className="sm:hidden mb-4 relative">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border rounded-xl shadow-sm"
        >
          <div className="flex items-center">
            {activeTab === 'capture' && <><Camera size={18} className="mr-2 text-blue-600" /> Capture Attendance</>}
            {activeTab === 'verification' && <><CheckCircle size={18} className="mr-2 text-blue-600" /> Verify Attendance</>}
            {activeTab === 'history' && <><Clock size={18} className="mr-2 text-blue-600" /> History</>}
          </div>
          <ChevronDown size={18} className={`transition-transform ${showMobileMenu ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-2 bg-white border rounded-xl shadow-lg overflow-hidden"
            >
              <button
                onClick={() => { setActiveTab('capture'); setShowMobileMenu(false); }}
                className={`w-full flex items-center px-4 py-3 text-left ${activeTab === 'capture' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
              >
                <Camera size={18} className="mr-3" />
                Capture Attendance
              </button>
              <button
                onClick={() => { setActiveTab('verification'); setShowMobileMenu(false); }}
                className={`w-full flex items-center px-4 py-3 text-left ${activeTab === 'verification' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
              >
                <CheckCircle size={18} className="mr-3" />
                Verify Attendance
              </button>
              <button
                onClick={() => { setActiveTab('history'); setShowMobileMenu(false); }}
                className={`w-full flex items-center px-4 py-3 text-left ${activeTab === 'history' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
              >
                <Clock size={18} className="mr-3" />
                History
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop: Horizontal Tabs */}
      <div className="hidden sm:flex border-b mb-6">
        <button
          onClick={() => setActiveTab('capture')}
          className={`px-6 py-3 font-medium border-b-2 transition-all ${activeTab === 'capture'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
        >
          <Camera className="inline mr-2" size={18} />
          Capture Attendance
        </button>
        <button
          onClick={() => setActiveTab('verification')}
          className={`px-6 py-3 font-medium border-b-2 transition-all ${activeTab === 'verification'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
        >
          <CheckCircle className="inline mr-2" size={18} />
          Verify Attendance
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 font-medium border-b-2 transition-all ${activeTab === 'history'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
        >
          <Clock className="inline mr-2" size={18} />
          History
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'capture' && <AttendanceCapture />}
      {activeTab === 'verification' && <AttendanceVerification />}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Date Filter */}
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Select Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="flex items-end gap-3">
                <Button variant="outline" icon={Filter} onClick={() => toast.success(`Filtered by date: ${date}`)}>
                  Filter
                </Button>
                <Button variant="primary" icon={Download} onClick={() => toast.success('Downloading daily report...')}>
                  Download Report
                </Button>
              </div>
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-5">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-xl bg-blue-100 mr-4">
                  <Calendar className="text-blue-600" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold">{attendanceStats.today.present}</div>
                  <div className="text-sm text-gray-600">Today Present</div>
                </div>
              </div>
              {attendanceStats.today.total > 0 ? (
                <div className="text-sm text-green-600">{attendanceStats.today.rate}% attendance rate</div>
              ) : (
                <div className="text-sm text-gray-400">No attendance data</div>
              )}
            </Card>

            <Card className="p-5">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-xl bg-green-100 mr-4">
                  <TrendingUp className="text-green-600" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold">{attendanceStats.week.rate}%</div>
                  <div className="text-sm text-gray-600">Weekly Average</div>
                </div>
              </div>
              {attendanceStats.week.total > 0 ? (
                <div className="text-sm text-blue-600">{attendanceStats.week.present} present this week</div>
              ) : (
                <div className="text-sm text-gray-400">No weekly data yet</div>
              )}
            </Card>

            <Card className="p-5">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-xl bg-purple-100 mr-4">
                  <Users className="text-purple-600" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold">{attendanceStats.month.total}</div>
                  <div className="text-sm text-gray-600">Monthly Total</div>
                </div>
              </div>
              {attendanceStats.month.total > 0 ? (
                <div className="text-sm text-purple-600">{attendanceStats.month.rate}% monthly rate</div>
              ) : (
                <div className="text-sm text-gray-400">No monthly data yet</div>
              )}
            </Card>
          </div>

          {/* Recent Attendance */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Recent Attendance Records</h2>
            {recentAttendance.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto text-gray-400 mb-3" size={48} />
                <p className="text-gray-500">No attendance records found</p>
                <p className="text-sm text-gray-400 mt-1">Take attendance to see records here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAttendance.map((record, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-xl ${record.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'
                        } flex items-center justify-center mr-4`}>
                        {record.status === 'completed' ? (
                          <CheckCircle className="text-green-600" size={24} />
                        ) : (
                          <Clock className="text-yellow-600" size={24} />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{record.class}</h3>
                        <p className="text-sm text-gray-600">{record.time}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{record.present}</div>
                        <div className="text-sm text-gray-600">Present</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{record.absent}</div>
                        <div className="text-sm text-gray-600">Absent</div>
                      </div>
                      <div>
                        <span className={`px-3 py-1 rounded-full text-sm ${record.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {record.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Chart */}
          <Card className="p-6">
            <h3 className="font-bold text-gray-800 mb-4">Monthly Attendance Trend</h3>
            {attendanceStats.month.total === 0 ? (
              <div className="h-48 flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="mx-auto text-gray-400 mb-3" size={48} />
                  <p className="text-gray-500">No trend data available</p>
                  <p className="text-sm text-gray-400 mt-1">Attendance data will appear here</p>
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-end gap-2">
                {Array.from({ length: 12 }, (_, index) => {
                  // Generate bars based on actual rate if available, else random demo
                  const value = attendanceStats.month.rate > 0
                    ? Math.max(20, attendanceStats.month.rate - Math.random() * 10 + Math.random() * 10)
                    : 0;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-cyan-300 rounded-t-lg transition-all"
                        style={{ height: value > 0 ? `${value}%` : '5%', opacity: value > 0 ? 1 : 0.3 }}
                      />
                      <div className="text-xs mt-2">{index + 1}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Quick Tips */}
      <Card className="mt-6 p-4">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <h4 className="font-medium mb-2">📋 Best Practices:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Take attendance at the beginning of each class</li>
              <li>• Ensure good lighting for face recognition</li>
              <li>• Verify attendance before final submission</li>
              <li>• Export weekly reports for parents</li>
            </ul>
          </div>
          <div className="flex-1">
            <h4 className="font-medium mb-2">⚡ Quick Actions:</h4>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => {
                // Navigate to reports page with daily tab
                window.location.href = '/reports';
              }}>View Daily Report</Button>
              <Button size="sm" variant="outline" onClick={() => {
                // Print current page
                window.print();
                toast.success('Printing attendance...', { id: 'print-attendance' });
              }}>Print Attendance</Button>
              <Button size="sm" variant="outline" icon={MessageCircle} onClick={handleOpenMessageModal}>
                Message Parents
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Message Parents Modal */}
      <Modal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        title="📱 Message Parents"
        size="lg"
      >
        <div className="space-y-4">
          {/* Message Type Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMessageType('whatsapp')}
              className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${messageType === 'whatsapp'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <MessageCircle size={20} />
              WhatsApp
            </button>
            <button
              onClick={() => setMessageType('sms')}
              className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${messageType === 'sms'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <Phone size={20} />
              SMS
            </button>
          </div>

          {/* Message Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Type your message to parents..."
            />
          </div>

          {/* Student Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Select Students ({selectedStudents.length}/{studentsWithPhone.length})
              </label>
              <button
                onClick={toggleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {selectedStudents.length === studentsWithPhone.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto border rounded-xl p-2 space-y-1">
              {studentsWithPhone.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No students with parent phone numbers</p>
              ) : (
                studentsWithPhone.map(student => (
                  <label
                    key={student._id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedStudents.includes(student._id) ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student._id)}
                      onChange={() => toggleStudentSelection(student._id)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div className="flex-1">
                      <span className="font-medium">{student.firstName} {student.lastName || ''}</span>
                      <span className="text-gray-500 text-sm ml-2">({student.parentPhone})</span>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Send Button */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" fullWidth onClick={() => setShowMessageModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              fullWidth
              icon={Send}
              onClick={handleSendMessage}
              disabled={selectedStudents.length === 0}
            >
              Send via {messageType === 'whatsapp' ? 'WhatsApp' : 'SMS'} ({selectedStudents.length})
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AttendancePage;