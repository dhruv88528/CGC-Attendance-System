import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Download,
  Filter,
  Calendar,
  FileText,
  PieChart,
  TrendingUp,
  Eye,
  ChevronDown
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import BackButton from '../components/common/BackButton';
import { DailyAttendance, MonthlySummary, ReportExporter, StudentHistory } from '../components/reports';
import { apiMethods } from '../utils/api';
import toast from 'react-hot-toast';


const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportStats, setReportStats] = useState([
    { title: 'Total Reports', value: '0', icon: FileText, color: 'blue' },
    { title: 'Generated Today', value: '0', icon: BarChart3, color: 'green' },
    { title: 'Pending Review', value: '0', icon: Calendar, color: 'orange' },
    { title: 'Avg. Accuracy', value: '0%', icon: TrendingUp, color: 'purple' },
  ]);

  // Fetch real report stats
  useEffect(() => {
    fetchReportStats();
  }, []);

  const fetchReportStats = async () => {
    try {
      // Get today's attendance for stats
      const today = new Date().toISOString().split('T')[0];
      const response = await apiMethods.getDailyAttendance({ date: today });

      if (response.success && response.data) {
        const records = Array.isArray(response.data) ? response.data : [];
        const present = records.filter(r => r.status === 'present').length;
        const total = records.length;
        const accuracy = total > 0 ? Math.round((present / total) * 100) : 0;

        setReportStats([
          { title: 'Total Records', value: total.toString(), icon: FileText, color: 'blue' },
          { title: 'Present Today', value: present.toString(), icon: BarChart3, color: 'green' },
          { title: 'Absent Today', value: (total - present).toString(), icon: Calendar, color: 'orange' },
          { title: 'Attendance Rate', value: `${accuracy}%`, icon: TrendingUp, color: 'purple' },
        ]);
      }
    } catch (error) {
      console.error('Error fetching report stats:', error);
    }
  };

  // Export attendance data as CSV
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Report generation timestamp (unchangeable)
    const generatedAt = new Date();
    const reportTimestamp = `Report Generated: ${generatedAt.toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })} at ${generatedAt.toLocaleTimeString('en-IN')}`;

    // Create CSV headers
    const headers = ['Date', 'Time', 'Student Name', 'Roll Number', 'Class', 'Status', 'Marked At'];

    // Helper function to format date properly
    const formatDate = (dateValue) => {
      if (!dateValue) return 'N/A';
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-IN', {
        year: 'numeric', month: '2-digit', day: '2-digit'
      });
    };

    // Helper function to format time properly
    const formatTime = (dateValue) => {
      if (!dateValue) return 'N/A';
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true
      });
    };

    // Create CSV rows
    const rows = data.map(record => [
      formatDate(record.date || record.createdAt),
      formatTime(record.markedAt || record.createdAt),
      record.student?.firstName ? `${record.student.firstName} ${record.student.lastName || ''}` : 'N/A',
      record.student?.rollNumber || 'N/A',
      record.class?.name || record.class?.grade || 'N/A',
      record.status || 'N/A',
      formatTime(record.markedAt || record.createdAt)
    ]);

    // Combine headers and rows with report metadata
    const csvContent = [
      `"${reportTimestamp}"`,  // First line - report timestamp (unchangeable proof)
      '',  // Empty line for spacing
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`✅ Report exported: ${filename}.csv`);
  };

  // Generate and download report
  const handleGenerateReport = async () => {
    toast.loading('Generating report...', { id: 'generate-report' });
    try {
      const response = await apiMethods.getDailyAttendance({
        startDate: dateRange.start,
        endDate: dateRange.end
      });

      if (response.success && response.data) {
        const data = Array.isArray(response.data) ? response.data : [];
        if (data.length === 0) {
          toast.error('No attendance records found for selected date range', { id: 'generate-report' });
          return;
        }
        exportToCSV(data, `attendance_report_${dateRange.start}_to_${dateRange.end}`);
        toast.success('Report generated!', { id: 'generate-report' });
      } else {
        toast.error('Failed to fetch attendance data', { id: 'generate-report' });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report', { id: 'generate-report' });
    }
  };

  // Export all reports
  const handleExportAllReports = async () => {
    toast.loading('Exporting all attendance records...', { id: 'export-all' });
    try {
      // Fetch all attendance data (last 30 days)
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await apiMethods.getDailyAttendance({
        startDate,
        endDate
      });

      if (response.success && response.data) {
        const data = Array.isArray(response.data) ? response.data : [];
        if (data.length === 0) {
          toast.error('No attendance records found', { id: 'export-all' });
          return;
        }
        exportToCSV(data, 'all_attendance_reports');
        toast.success('All records exported!', { id: 'export-all' });
      } else {
        toast.error('Failed to fetch attendance data', { id: 'export-all' });
      }
    } catch (error) {
      console.error('Error exporting reports:', error);
      toast.error('Failed to export reports', { id: 'export-all' });
    }
  };

  // Report templates
  const reportTemplates = [
    { name: 'Daily Attendance', description: 'Attendance report for a specific day', icon: Calendar },
    { name: 'Monthly Summary', description: 'Comprehensive monthly attendance statistics', icon: PieChart },
    { name: 'Student History', description: 'Individual student attendance history', icon: FileText },
    { name: 'Class Performance', description: 'Class-wise attendance comparison', icon: BarChart3 },
  ];

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
                <BarChart3 className="mr-2 md:mr-3 flex-shrink-0" size={24} />
                <span className="truncate">Reports & Analytics</span>
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1 truncate">Generate and analyze attendance reports</p>
            </div>
          </div>
          <Button variant="primary" icon={Download} size="sm" onClick={handleExportAllReports}>
            <span className="hidden sm:inline">Export All </span>Reports
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {reportStats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-3 md:p-5 text-center">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-${stat.color}-100 flex items-center justify-center mx-auto mb-2 md:mb-3`}>
                <stat.icon className={`text-${stat.color}-600`} size={20} />
              </div>
              <div className="text-xl md:text-2xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-xs md:text-sm text-gray-600">{stat.title}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Report Templates */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {reportTemplates.map((template, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className="p-3 md:p-5 text-center cursor-pointer hover-lift"
              onClick={() => setActiveTab(template.name.toLowerCase().replace(' ', '-').split('-')[0])}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-2 md:mb-3">
                <template.icon className="text-blue-600" size={20} />
              </div>
              <h3 className="font-bold text-gray-800 text-sm md:text-base">{template.name}</h3>
              <p className="text-xs md:text-sm text-gray-600 mt-1 hidden sm:block">{template.description}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full p-2 border rounded-lg"
              />
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Button variant="outline" icon={Filter} size="sm" onClick={() => toast.success('Filters applied')}>
              <span className="hidden sm:inline">Apply </span>Filters
            </Button>
            <Button variant="primary" icon={Download} size="sm" onClick={handleGenerateReport}>
              <span className="hidden sm:inline">Generate </span>Report
            </Button>
          </div>
        </div>
      </Card>

      {/* Report Tabs - Hamburger on mobile, horizontal on desktop */}
      {/* Mobile: Dropdown Menu */}
      <div className="sm:hidden mb-4 relative">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border rounded-xl shadow-sm"
        >
          <div className="flex items-center">
            {activeTab === 'daily' && <><Calendar size={18} className="mr-2 text-blue-600" /> Daily Attendance</>}
            {activeTab === 'monthly' && <><PieChart size={18} className="mr-2 text-blue-600" /> Monthly Summary</>}
            {activeTab === 'student' && <><FileText size={18} className="mr-2 text-blue-600" /> Student History</>}
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
                onClick={() => { setActiveTab('daily'); setShowMobileMenu(false); }}
                className={`w-full flex items-center px-4 py-3 text-left ${activeTab === 'daily' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
              >
                <Calendar size={18} className="mr-3" />
                Daily Attendance
              </button>
              <button
                onClick={() => { setActiveTab('monthly'); setShowMobileMenu(false); }}
                className={`w-full flex items-center px-4 py-3 text-left ${activeTab === 'monthly' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
              >
                <PieChart size={18} className="mr-3" />
                Monthly Summary
              </button>
              <button
                onClick={() => { setActiveTab('student'); setShowMobileMenu(false); }}
                className={`w-full flex items-center px-4 py-3 text-left ${activeTab === 'student' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
              >
                <FileText size={18} className="mr-3" />
                Student History
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop: Horizontal Tabs */}
      <div className="hidden sm:flex border-b mb-6">
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-6 py-3 font-medium border-b-2 transition-all ${activeTab === 'daily'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
        >
          <Calendar className="inline mr-2" size={18} />
          Daily Attendance
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`px-6 py-3 font-medium border-b-2 transition-all ${activeTab === 'monthly'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
        >
          <PieChart className="inline mr-2" size={18} />
          Monthly Summary
        </button>
        <button
          onClick={() => setActiveTab('student')}
          className={`px-6 py-3 font-medium border-b-2 transition-all ${activeTab === 'student'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
        >
          <FileText className="inline mr-2" size={18} />
          Student History
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'daily' && <DailyAttendance />}
      {activeTab === 'monthly' && <MonthlySummary />}
      {activeTab === 'student' && <StudentHistory />}

      {/* Report Exporter */}
      <ReportExporter />
    </div>
  );
};

export default ReportsPage;