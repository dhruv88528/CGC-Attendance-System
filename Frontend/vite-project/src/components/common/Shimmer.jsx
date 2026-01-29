import React from 'react';

/**
 * Shimmer/Skeleton Loading Component
 * Modern loading UI for all pages
 */

// Single line shimmer
export const ShimmerLine = ({ width = 'w-full', height = 'h-4', className = '' }) => (
    <div
        className={`rounded shimmer ${width} ${height} ${className}`}
    />
);

// Circle shimmer (for avatars)
export const ShimmerCircle = ({ size = 'w-10 h-10', className = '' }) => (
    <div className={`rounded-full shimmer ${size} ${className}`} />
);

// Card shimmer
export const ShimmerCard = ({ className = '' }) => (
    <div className={`bg-white rounded-xl p-5 shadow-sm ${className}`}>
        <div className="flex items-center mb-4">
            <ShimmerCircle size="w-12 h-12" className="mr-3" />
            <div className="flex-1">
                <ShimmerLine width="w-3/4" height="h-4" className="mb-2" />
                <ShimmerLine width="w-1/2" height="h-3" />
            </div>
        </div>
        <ShimmerLine width="w-full" height="h-3" className="mb-2" />
        <ShimmerLine width="w-5/6" height="h-3" />
    </div>
);

// Table row shimmer
export const ShimmerTableRow = ({ columns = 5 }) => (
    <tr className="border-t">
        {Array(columns).fill(0).map((_, i) => (
            <td key={i} className="p-3">
                <ShimmerLine width={i === 0 ? 'w-8' : 'w-full'} height="h-4" />
            </td>
        ))}
    </tr>
);

// Table shimmer
export const ShimmerTable = ({ rows = 5, columns = 5, className = '' }) => (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden ${className}`}>
        <table className="w-full">
            <thead className="bg-gray-50">
                <tr>
                    {Array(columns).fill(0).map((_, i) => (
                        <th key={i} className="p-3 text-left">
                            <ShimmerLine width="w-20" height="h-4" />
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {Array(rows).fill(0).map((_, i) => (
                    <ShimmerTableRow key={i} columns={columns} />
                ))}
            </tbody>
        </table>
    </div>
);

// Stats card shimmer
export const ShimmerStats = ({ count = 4 }) => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array(count).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 text-center shadow-sm">
                <ShimmerLine width="w-16" height="h-8" className="mx-auto mb-3" />
                <ShimmerLine width="w-24" height="h-4" className="mx-auto" />
            </div>
        ))}
    </div>
);

// Grid cards shimmer
export const ShimmerGrid = ({ count = 6, columns = 3 }) => (
    <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-4`}>
        {Array(count).fill(0).map((_, i) => (
            <ShimmerCard key={i} />
        ))}
    </div>
);

// Students page shimmer
export const ShimmerStudentsPage = () => (
    <div className="space-y-6">
        <ShimmerStats count={4} />
        <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex gap-4">
                <ShimmerLine width="w-full" height="h-10" className="rounded-lg" />
                <ShimmerLine width="w-32" height="h-10" className="rounded-lg" />
                <ShimmerLine width="w-24" height="h-10" className="rounded-lg" />
            </div>
        </div>
        <ShimmerTable rows={8} columns={6} />
    </div>
);

// Teachers page shimmer
export const ShimmerTeachersPage = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array(2).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-5 text-center shadow-sm">
                    <ShimmerLine width="w-12" height="h-8" className="mx-auto mb-2" />
                    <ShimmerLine width="w-24" height="h-4" className="mx-auto" />
                </div>
            ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
                <ShimmerCard key={i} />
            ))}
        </div>
    </div>
);

// Classes page shimmer
export const ShimmerClassesPage = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array(3).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-5 text-center shadow-sm">
                    <ShimmerLine width="w-12" height="h-8" className="mx-auto mb-2" />
                    <ShimmerLine width="w-24" height="h-4" className="mx-auto" />
                </div>
            ))}
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
            <ShimmerLine width="w-full" height="h-10" className="rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
                <ShimmerCard key={i} />
            ))}
        </div>
    </div>
);

// Attendance page shimmer
export const ShimmerAttendancePage = () => (
    <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <ShimmerLine width="w-48" height="h-6" />
                <div className="flex gap-4">
                    <ShimmerLine width="w-20" height="h-8" className="rounded-full" />
                    <ShimmerLine width="w-32" height="h-8" className="rounded-full" />
                </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <ShimmerLine width="w-24" height="h-4" className="mb-2" />
                    <ShimmerLine width="w-full" height="h-10" className="rounded-lg" />
                </div>
                <div>
                    <ShimmerLine width="w-16" height="h-4" className="mb-2" />
                    <ShimmerLine width="w-full" height="h-10" className="rounded-lg" />
                </div>
            </div>
        </div>
    </div>
);

// Dashboard page shimmer
export const ShimmerDashboard = () => (
    <div className="space-y-6">
        <ShimmerStats count={4} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
                <ShimmerLine width="w-32" height="h-6" className="mb-4" />
                <ShimmerLine width="w-full" height="h-48" className="rounded-lg" />
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
                <ShimmerLine width="w-32" height="h-6" className="mb-4" />
                <div className="space-y-3">
                    {Array(5).fill(0).map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <ShimmerCircle size="w-10 h-10" />
                            <div className="flex-1">
                                <ShimmerLine width="w-3/4" height="h-4" className="mb-1" />
                                <ShimmerLine width="w-1/2" height="h-3" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// Reports page shimmer
export const ShimmerReportsPage = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                    <ShimmerCircle size="w-10 h-10" className="mb-3" />
                    <ShimmerLine width="w-20" height="h-5" className="mb-2" />
                    <ShimmerLine width="w-full" height="h-3" />
                </div>
            ))}
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
            <ShimmerLine width="w-48" height="h-6" className="mb-4" />
            <div className="grid md:grid-cols-3 gap-4">
                <ShimmerLine width="w-full" height="h-10" className="rounded-lg" />
                <ShimmerLine width="w-full" height="h-10" className="rounded-lg" />
                <ShimmerLine width="w-full" height="h-10" className="rounded-lg" />
            </div>
        </div>
    </div>
);

// Settings page shimmer
export const ShimmerSettingsPage = () => (
    <div className="space-y-6">
        {Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                <ShimmerLine width="w-32" height="h-6" className="mb-4" />
                <div className="space-y-4">
                    {Array(3).fill(0).map((_, j) => (
                        <div key={j} className="flex items-center justify-between">
                            <div>
                                <ShimmerLine width="w-40" height="h-4" className="mb-1" />
                                <ShimmerLine width="w-64" height="h-3" />
                            </div>
                            <ShimmerLine width="w-12" height="h-6" className="rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        ))}
    </div>
);

// Login Form shimmer
export const ShimmerLoginForm = () => (
    <div className="bg-white rounded-2xl p-8 shadow-xl w-full max-w-md mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
            <ShimmerCircle size="w-16 h-16" className="mx-auto mb-4" />
            <ShimmerLine width="w-48" height="h-6" className="mx-auto mb-2" />
            <ShimmerLine width="w-32" height="h-4" className="mx-auto" />
        </div>

        {/* User Type Selector */}
        <div className="flex gap-2 mb-6">
            <ShimmerLine width="w-1/2" height="h-12" className="rounded-xl" />
            <ShimmerLine width="w-1/2" height="h-12" className="rounded-xl" />
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
            <div>
                <ShimmerLine width="w-16" height="h-4" className="mb-2" />
                <ShimmerLine width="w-full" height="h-12" className="rounded-lg" />
            </div>
            <div>
                <ShimmerLine width="w-20" height="h-4" className="mb-2" />
                <ShimmerLine width="w-full" height="h-12" className="rounded-lg" />
            </div>
            <div>
                <ShimmerLine width="w-24" height="h-4" className="mb-2" />
                <ShimmerLine width="w-full" height="h-12" className="rounded-lg" />
            </div>
        </div>

        {/* Button */}
        <ShimmerLine width="w-full" height="h-12" className="rounded-lg mt-6" />

        {/* Link */}
        <ShimmerLine width="w-48" height="h-4" className="mx-auto mt-4" />
    </div>
);

// Signup Form shimmer
export const ShimmerSignupForm = () => (
    <div className="bg-white rounded-2xl p-8 shadow-xl w-full max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
            <ShimmerCircle size="w-16 h-16" className="mx-auto mb-4" />
            <ShimmerLine width="w-56" height="h-6" className="mx-auto mb-2" />
            <ShimmerLine width="w-40" height="h-4" className="mx-auto" />
        </div>

        {/* Steps */}
        <div className="flex justify-center gap-4 mb-8">
            {Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                    <ShimmerCircle size="w-8 h-8" />
                    <ShimmerLine width="w-16" height="h-4" />
                </div>
            ))}
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <ShimmerLine width="w-24" height="h-4" className="mb-2" />
                    <ShimmerLine width="w-full" height="h-12" className="rounded-lg" />
                </div>
                <div>
                    <ShimmerLine width="w-20" height="h-4" className="mb-2" />
                    <ShimmerLine width="w-full" height="h-12" className="rounded-lg" />
                </div>
            </div>
            <div>
                <ShimmerLine width="w-16" height="h-4" className="mb-2" />
                <ShimmerLine width="w-full" height="h-12" className="rounded-lg" />
            </div>
            <div>
                <ShimmerLine width="w-20" height="h-4" className="mb-2" />
                <ShimmerLine width="w-full" height="h-12" className="rounded-lg" />
            </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 mt-6">
            <ShimmerLine width="w-1/3" height="h-12" className="rounded-lg" />
            <ShimmerLine width="w-2/3" height="h-12" className="rounded-lg" />
        </div>
    </div>
);

// Default export with all components
const Shimmer = {
    Line: ShimmerLine,
    Circle: ShimmerCircle,
    Card: ShimmerCard,
    Table: ShimmerTable,
    TableRow: ShimmerTableRow,
    Stats: ShimmerStats,
    Grid: ShimmerGrid,
    StudentsPage: ShimmerStudentsPage,
    TeachersPage: ShimmerTeachersPage,
    ClassesPage: ShimmerClassesPage,
    AttendancePage: ShimmerAttendancePage,
    Dashboard: ShimmerDashboard,
    ReportsPage: ShimmerReportsPage,
    SettingsPage: ShimmerSettingsPage,
    LoginForm: ShimmerLoginForm,
    SignupForm: ShimmerSignupForm
};

export default Shimmer;