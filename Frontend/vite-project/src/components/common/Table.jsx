import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  Filter,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  User
} from 'lucide-react'

const Table = ({
  columns = [],
  data = [],
  onRowClick,
  onSort,
  onFilter,
  onSearch,
  onExport,
  onAction,
  loading = false,
  emptyMessage = "No data available",
  selectable = false,
  selectedRows = [],
  onSelectAll,
  onSelectRow,
  pagination,
  onPageChange,
  className = '',
  striped = true,
  hoverable = true,
  compact = false,
  bordered = false
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    setSortConfig({ key, direction })
    if (onSort) onSort(key, direction)
  }

  const handleSearch = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    if (onSearch) onSearch(value)
  }

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronsUpDown size={16} />
    }
    return sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
  }

  const renderCell = (row, column) => {
    const value = column.accessor ? column.accessor(row) : row[column.key]

    if (column.render) {
      return column.render(value, row)
    }

    if (column.type === 'status') {
      const statusConfig = {
        active: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
        inactive: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
        pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: CheckCircle },
        completed: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: CheckCircle }
      }

      const config = statusConfig[value] || statusConfig.active
      const Icon = config.icon

      return (
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
          <Icon size={12} className="mr-1" />
          {column.format ? column.format(value) : value}
        </div>
      )
    }

    if (column.type === 'avatar') {
      return (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-school-purple flex items-center justify-center">
            {typeof value === 'string' && value.includes('http') ? (
              <img src={value} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User size={16} className="text-white" />
            )}
          </div>
          <span>{value}</span>
        </div>
      )
    }

    if (column.type === 'actions') {
      return (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onAction && onAction('view', row)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="View"
          >
            <Eye size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
          <button
            onClick={() => onAction && onAction('edit', row)}
            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            aria-label="Edit"
          >
            <Edit size={16} className="text-blue-500" />
          </button>
          <button
            onClick={() => onAction && onAction('delete', row)}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            aria-label="Delete"
          >
            <Trash2 size={16} className="text-red-500" />
          </button>
        </div>
      )
    }

    if (column.format) {
      return column.format(value, row)
    }

    return value || '-'
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md ${bordered ? 'border border-gray-200 dark:border-gray-700' : ''} ${className}`}>
      {/* Table Controls */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          {/* Search */}
          {onSearch && (
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {onFilter && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 rounded-lg flex items-center space-x-2 ${showFilters
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  } transition-colors`}
              >
                <Filter size={16} />
                <span>Filter</span>
              </button>
            )}

            {onExport && (
              <button
                onClick={onExport}
                className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2"
              >
                <Download size={16} />
                <span>Export</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && onFilter && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {columns
                .filter(col => col.filterable)
                .map(col => (
                  <div key={col.key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {col.header}
                    </label>
                    <input
                      type="text"
                      placeholder={`Filter by ${col.header.toLowerCase()}...`}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      onChange={(e) => onFilter(col.key, e.target.value)}
                    />
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className={`w-full ${compact ? 'text-sm' : 'text-base'}`}>
          {/* Table Header */}
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50">
              {selectable && (
                <th className={`px-6 py-3 text-left ${compact ? 'text-xs' : 'text-sm'} font-semibold text-gray-700 dark:text-gray-300`}>
                  <input
                    type="checkbox"
                    checked={selectedRows.length === data.length && data.length > 0}
                    onChange={onSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
              )}

              {columns.map(column => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left ${compact ? 'text-xs' : 'text-sm'} font-semibold text-gray-700 dark:text-gray-300 ${column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''
                    }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                  style={{ width: column.width }}
                >
                  <div className="flex items-center space-x-2">
                    <span>{column.header}</span>
                    {column.sortable && (
                      <span className="text-gray-400">
                        {getSortIcon(column.key)}
                      </span>
                    )}
                  </div>
                </th>
              ))}

              {onAction && (
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              // Loading Skeleton
              [...Array(5)].map((_, rowIndex) => (
                <tr key={rowIndex} className={striped && rowIndex % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-800/50' : ''}>
                  {selectable && (
                    <td className="px-6 py-4">
                      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded loading-shimmer" />
                    </td>
                  )}

                  {columns.map((_, colIndex) => (
                    <td key={colIndex} className="px-6 py-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded loading-shimmer" />
                    </td>
                  ))}

                  {onAction && (
                    <td className="px-6 py-4">
                      <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded loading-shimmer" />
                    </td>
                  )}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty State
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (onAction ? 1 : 0)}
                  className="px-6 py-12 text-center"
                >
                  <div className="text-gray-500 dark:text-gray-400">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                      <Search size={24} className="text-gray-400" />
                    </div>
                    <p className="text-lg font-medium mb-2">No results found</p>
                    <p className="text-sm">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              // Data Rows
              data.map((row, rowIndex) => (
                <motion.tr
                  key={row.id || rowIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: rowIndex * 0.05 }}
                  className={`
                    ${hoverable ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''}
                    ${striped && rowIndex % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-800/50' : ''}
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {selectable && (
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id)}
                        onChange={() => onSelectRow && onSelectRow(row.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                  )}

                  {columns.map(column => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 ${compact ? 'py-3' : 'py-4'} ${column.className || ''
                        }`}
                    >
                      {renderCell(row, column)}
                    </td>
                  ))}

                  {onAction && (
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onAction('view', row)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          aria-label="View"
                        >
                          <Eye size={16} className="text-gray-500 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => onAction('edit', row)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                          aria-label="Edit"
                        >
                          <Edit size={16} className="text-blue-500" />
                        </button>
                        <button
                          onClick={() => onAction('delete', row)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer - Pagination - Only show if more than 1 page */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700">
          {/* Mobile: Stacked layout */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Info text - hidden on very small screens */}
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
              <span className="hidden sm:inline">Showing {pagination.from} to {pagination.to} of </span>
              <span className="sm:hidden">{pagination.from}-{pagination.to} / </span>
              {pagination.total} <span className="hidden sm:inline">entries</span>
            </div>

            {/* Pagination controls */}
            <div className="flex items-center justify-center sm:justify-end space-x-1 sm:space-x-2">
              {/* Previous button */}
              <button
                onClick={() => onPageChange && onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-2 sm:px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">←</span>
              </button>

              {/* Page numbers - show fewer on mobile */}
              <div className="flex items-center space-x-1">
                {/* Mobile: Show max 3 pages, Desktop: Show max 5 */}
                {[...Array(Math.min(window.innerWidth < 640 ? 3 : 5, pagination.totalPages))].map((_, i) => {
                  // Calculate which pages to show
                  let pageNum;
                  const maxVisible = window.innerWidth < 640 ? 3 : 5;

                  if (pagination.totalPages <= maxVisible) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage <= Math.ceil(maxVisible / 2)) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage >= pagination.totalPages - Math.floor(maxVisible / 2)) {
                    pageNum = pagination.totalPages - maxVisible + i + 1;
                  } else {
                    pageNum = pagination.currentPage - Math.floor(maxVisible / 2) + i;
                  }

                  if (pageNum < 1 || pageNum > pagination.totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange && onPageChange(pageNum)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm ${pagination.currentPage === pageNum
                          ? 'bg-primary-500 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        } transition-colors`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              {/* Next button */}
              <button
                onClick={() => onPageChange && onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-2 sm:px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Table