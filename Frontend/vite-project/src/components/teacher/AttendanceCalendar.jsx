
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Users,
    UserCheck,
    UserX,
    Clock,
    X,
    Loader2
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import { apiMethods } from '../../utils/api';
import toast from 'react-hot-toast';

const AttendanceCalendar = ({ onClose }) => {
    const [selectedClass, setSelectedClass] = useState('');
    const [classes, setClasses] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [attendanceData, setAttendanceData] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [classStudentCount, setClassStudentCount] = useState(0);

    // Fetch classes on mount
    useEffect(() => {
        fetchClasses();
    }, []);

    // Fetch attendance when class or month changes
    useEffect(() => {
        if (selectedClass) {
            fetchMonthlyAttendance();
        }
    }, [selectedClass, currentMonth]);

    const fetchClasses = async () => {
        try {
            const response = await apiMethods.getClasses();
            if (response.success && response.data) {
                setClasses(response.data);
                // Auto-select first class
                if (response.data.length > 0) {
                    setSelectedClass(response.data[0]._id);
                }
            }
        } catch (error) {
            console.error('Failed to fetch classes:', error);
            toast.error('Failed to load classes');
        }
    };

    const fetchMonthlyAttendance = async () => {
        setIsLoading(true);
        try {
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth() + 1;

            // Fetch attendance for the month
            const response = await apiMethods.getMonthlyAttendance({
                classId: selectedClass,
                year,
                month
            });

            // Fetch students count for the class
            const studentsRes = await apiMethods.getStudentsByClass(selectedClass);
            let studentCount = 0;
            if (studentsRes.success && studentsRes.data) {
                studentCount = Array.isArray(studentsRes.data) ? studentsRes.data.length :
                    studentsRes.data.students ? studentsRes.data.students.length : 0;
            }
            setClassStudentCount(studentCount);

            // Process attendance data by date
            const attendanceByDate = {};
            if (response.success && response.data) {
                const records = response.data.attendance || response.data || [];
                records.forEach(record => {
                    const dateKey = new Date(record.date).toISOString().split('T')[0];
                    if (!attendanceByDate[dateKey]) {
                        attendanceByDate[dateKey] = { present: 0, absent: 0, leave: 0, total: studentCount };
                    }
                    if (record.status === 'present') {
                        attendanceByDate[dateKey].present++;
                    } else if (record.status === 'absent') {
                        attendanceByDate[dateKey].absent++;
                    } else if (record.status === 'leave') {
                        attendanceByDate[dateKey].leave++;
                    }
                });
            }

            setAttendanceData(attendanceByDate);
        } catch (error) {
            console.error('Failed to fetch attendance:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Calendar helpers
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        return { daysInMonth, startingDay };
    };

    const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);

    const goToPrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const getDateKey = (day) => {
        const year = currentMonth.getFullYear();
        const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        return `${year}-${month}-${dayStr}`;
    };

    const getAttendanceForDay = (day) => {
        const dateKey = getDateKey(day);
        return attendanceData[dateKey] || null;
    };

    const getDayColor = (day) => {
        const data = getAttendanceForDay(day);
        if (!data) return 'bg-gray-50 hover:bg-gray-100';

        const rate = data.present / (data.present + data.absent + data.leave);
        if (rate >= 0.9) return 'bg-green-100 hover:bg-green-200 border-green-300';
        if (rate >= 0.7) return 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300';
        return 'bg-red-100 hover:bg-red-200 border-red-300';
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const selectedClassName = classes.find(c => c._id === selectedClass)?.name || 'Select Class';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 rounded-t-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Calendar size={24} />
                        <div>
                            <h2 className="text-xl font-bold">Attendance Calendar</h2>
                            <p className="text-orange-100 text-sm">View past attendance records</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-4 md:p-6">
                    {/* Class Selector */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Class
                        </label>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="w-full md:w-64 p-3 border rounded-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-none"
                        >
                            <option value="">Choose a class</option>
                            {classes.map((cls) => (
                                <option key={cls._id} value={cls._id}>
                                    {cls.name || `Class ${cls.grade}`} - Section {cls.section}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-4">
                        <Button variant="outline" size="sm" onClick={goToPrevMonth}>
                            <ChevronLeft size={20} />
                        </Button>
                        <h3 className="text-lg font-bold text-gray-800">
                            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </h3>
                        <Button variant="outline" size="sm" onClick={goToNextMonth}>
                            <ChevronRight size={20} />
                        </Button>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 mb-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-green-200 border border-green-300"></div>
                            <span>90%+ Present</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-yellow-200 border border-yellow-300"></div>
                            <span>70-90% Present</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-red-200 border border-red-300"></div>
                            <span>&lt;70% Present</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200"></div>
                            <span>No Data</span>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin text-orange-500" size={40} />
                        </div>
                    ) : (
                        <>
                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1 md:gap-2">
                                {/* Day Headers */}
                                {dayNames.map(day => (
                                    <div key={day} className="text-center text-xs md:text-sm font-medium text-gray-500 py-2">
                                        {day}
                                    </div>
                                ))}

                                {/* Empty cells for starting day */}
                                {Array.from({ length: startingDay }).map((_, i) => (
                                    <div key={`empty-${i}`} className="aspect-square"></div>
                                ))}

                                {/* Days */}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const data = getAttendanceForDay(day);
                                    const isToday = new Date().toISOString().split('T')[0] === getDateKey(day);
                                    const isFuture = new Date(getDateKey(day)) > new Date();

                                    return (
                                        <motion.div
                                            key={day}
                                            whileHover={{ scale: 1.05 }}
                                            onClick={() => data && setSelectedDate({ day, data })}
                                            className={`aspect-square p-1 md:p-2 rounded-lg border cursor-pointer transition-all ${isFuture ? 'bg-gray-50 opacity-50 cursor-not-allowed' :
                                                    isToday ? 'ring-2 ring-orange-500 ' + getDayColor(day) :
                                                        getDayColor(day)
                                                }`}
                                        >
                                            <div className="text-xs md:text-sm font-medium text-gray-700">{day}</div>
                                            {data && !isFuture && (
                                                <div className="hidden md:flex flex-col text-[10px] mt-1">
                                                    <span className="text-green-600">P: {data.present}</span>
                                                    <span className="text-red-600">A: {data.absent}</span>
                                                </div>
                                            )}
                                            {data && !isFuture && (
                                                <div className="md:hidden text-[8px] mt-0.5">
                                                    <span className="text-green-600">{data.present}</span>/
                                                    <span className="text-red-600">{data.absent}</span>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Selected Date Details */}
                            {selectedDate && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-bold text-gray-800">
                                            {monthNames[currentMonth.getMonth()]} {selectedDate.day}, {currentMonth.getFullYear()}
                                        </h4>
                                        <button
                                            onClick={() => setSelectedDate(null)}
                                            className="text-gray-500 hover:text-gray-700"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <Card className="p-3 text-center bg-blue-50">
                                            <Users className="mx-auto text-blue-500 mb-1" size={20} />
                                            <div className="text-xl font-bold text-blue-600">{classStudentCount}</div>
                                            <div className="text-xs text-gray-600">Total Students</div>
                                        </Card>
                                        <Card className="p-3 text-center bg-green-50">
                                            <UserCheck className="mx-auto text-green-500 mb-1" size={20} />
                                            <div className="text-xl font-bold text-green-600">{selectedDate.data.present}</div>
                                            <div className="text-xs text-gray-600">Present</div>
                                        </Card>
                                        <Card className="p-3 text-center bg-red-50">
                                            <UserX className="mx-auto text-red-500 mb-1" size={20} />
                                            <div className="text-xl font-bold text-red-600">{selectedDate.data.absent}</div>
                                            <div className="text-xs text-gray-600">Absent</div>
                                        </Card>
                                        <Card className="p-3 text-center bg-yellow-50">
                                            <Clock className="mx-auto text-yellow-500 mb-1" size={20} />
                                            <div className="text-xl font-bold text-yellow-600">{selectedDate.data.leave || 0}</div>
                                            <div className="text-xs text-gray-600">On Leave</div>
                                        </Card>
                                    </div>

                                    {/* Attendance Rate */}
                                    <div className="mt-4 p-3 bg-white rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700">Attendance Rate</span>
                                            <span className="text-sm font-bold text-orange-600">
                                                {Math.round((selectedDate.data.present / classStudentCount) * 100)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full transition-all"
                                                style={{ width: `${(selectedDate.data.present / classStudentCount) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Class Info */}
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Users size={18} />
                                    <span className="text-sm">
                                        <strong>{selectedClassName}</strong> • {classStudentCount} students enrolled
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default AttendanceCalendar;
