import React, { useState, useEffect } from 'react';
import { TrendingUp, Download } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import { apiMethods } from '../../utils/api';

const MonthlySummary = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [monthlyData, setMonthlyData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchMonthlyData();
  }, [selectedMonth, selectedYear, selectedClass]);

  const fetchClasses = async () => {
    try {
      const response = await apiMethods.getClasses();
      if (response.success && response.data) {
        setClasses(response.data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchMonthlyData = async () => {
    setIsLoading(true);
    try {
      const response = await apiMethods.getMonthlyAttendance({
        month: selectedMonth,
        year: selectedYear,
        classId: selectedClass || undefined
      });

      if (response.success && response.data) {
        setMonthlyData(response.data.summary || []);
      } else {
        setMonthlyData([]);
      }
    } catch (error) {
      console.error('Error fetching monthly data:', error);
      setMonthlyData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleExport = () => {
    if (monthlyData.length === 0) {
      alert('No data to export');
      return;
    }

    // Report generation timestamp (unchangeable proof)
    const generatedAt = new Date();
    const reportTimestamp = `Report Generated: ${generatedAt.toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })} at ${generatedAt.toLocaleTimeString('en-IN')}`;
    const reportInfo = `Monthly Report: ${months[selectedMonth - 1]} ${selectedYear}`;

    // Create CSV content
    const headers = ['Date', 'Present', 'Absent', 'Total', 'Attendance %'];
    const rows = monthlyData.map(day => {
      const present = day.attendance?.find(a => a.status === 'present')?.count || 0;
      const absent = day.attendance?.find(a => a.status === 'absent')?.count || 0;
      const total = day.total || 1;
      const rate = Math.round((present / total) * 100);
      return [`"${day._id}"`, present, absent, total, `${rate}%`];
    });

    const csvContent = [
      `"${reportTimestamp}"`,
      `"${reportInfo}"`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly_report_${months[selectedMonth - 1]}_${selectedYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Monthly Summary</h1>
        <p className="text-gray-600">Monthly attendance overview and trends</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <select
            className="p-2 border rounded-lg"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          >
            {months.map((month, index) => (
              <option key={month} value={index + 1}>{month} {selectedYear}</option>
            ))}
          </select>
          <select
            className="p-2 border rounded-lg"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">All Classes</option>
            {classes.map(cls => (
              <option key={cls._id} value={cls._id}>{cls.name}</option>
            ))}
          </select>
        </div>
        <Button onClick={handleExport} icon={Download}>
          Export
        </Button>
      </div>

      {/* Chart */}
      <Card className="mb-6 p-6">
        <h3 className="font-bold mb-4 flex items-center">
          <TrendingUp className="mr-2" /> Attendance Trend
        </h3>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-gray-500">Loading...</div>
        ) : monthlyData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400">
            <TrendingUp size={48} className="mb-3" />
            <p className="text-gray-500">No attendance data for this month</p>
            <p className="text-sm text-gray-400 mt-1">Take attendance to see trends</p>
          </div>
        ) : (
          <div className="h-64">
            {/* Y-axis labels */}
            <div className="flex h-full">
              <div className="flex flex-col justify-between text-xs text-gray-400 pr-2">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0%</span>
              </div>
              {/* Bars */}
              <div className="flex-1 flex items-end gap-1 border-l border-b border-gray-200 pl-2 pb-6">
                {monthlyData.map((day, index) => {
                  const present = day.attendance?.find(a => a.status === 'present')?.count || 0;
                  const total = day.total || 1;
                  const rate = Math.round((present / total) * 100);
                  const barColor = rate >= 90 ? 'from-green-500 to-green-400'
                    : rate >= 70 ? 'from-yellow-500 to-yellow-400'
                      : 'from-red-500 to-red-400';
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center group cursor-pointer">
                      <div className="relative w-full">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {day._id}: {rate}% ({present} present)
                        </div>
                        <div
                          className={`w-full bg-gradient-to-t ${barColor} rounded-t-lg transition-all hover:opacity-80`}
                          style={{ height: `${Math.max(rate * 2, 4)}px` }}
                        />
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1">{day._id?.slice(-2)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Monthly Table */}
      <Card>
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : monthlyData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No monthly data available</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Present</th>
                <th className="p-3 text-left">Absent</th>
                <th className="p-3 text-left">Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((day, index) => {
                const present = day.attendance?.find(a => a.status === 'present')?.count || 0;
                const absent = day.attendance?.find(a => a.status === 'absent')?.count || 0;
                const total = day.total || 1;
                const rate = Math.round((present / total) * 100);
                return (
                  <tr key={index} className="border-t">
                    <td className="p-3">{day._id}</td>
                    <td className="p-3">{present}</td>
                    <td className="p-3">{absent}</td>
                    <td className="p-3">
                      <div className="flex items-center">
                        <div className="w-24 h-2 bg-gray-200 rounded-full mr-2">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                        {rate}%
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export default MonthlySummary;