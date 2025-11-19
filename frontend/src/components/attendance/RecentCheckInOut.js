import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import Card from '../ui/Card';

/**
 * AttendanceRecord Component - Memoized individual record row
 */
const AttendanceRecord = React.memo(({ record, formatDate, getStatusBadge, getStatusIcon }) => {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-background-light dark:bg-background-dark hover:shadow-sm transition-shadow">
      {/* Date and Status */}
      <div className="flex items-center gap-4 flex-1">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-icons text-primary">
              {getStatusIcon(record.status)}
            </span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-heading-light dark:text-heading-dark">
              {formatDate(record.date)}
            </p>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(record.status)}`}>
              {record.status}
            </span>
          </div>
          <p className="text-xs text-subtext-light">
            {new Date(record.date).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>
      
      {/* Check-In/Out Times */}
      <div className="flex items-center gap-6 text-sm">
        <div className="text-center">
          <p className="text-xs text-subtext-light mb-1">Check In</p>
          <p className="font-semibold text-text-light dark:text-text-dark">
            {record.checkIn || '--:--'}
          </p>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-subtext-light mb-1">Check Out</p>
          <p className="font-semibold text-text-light dark:text-text-dark">
            {record.checkOut || '--:--'}
          </p>
        </div>
        
        {record.workHours !== undefined && (
          <div className="text-center">
            <p className="text-xs text-subtext-light mb-1">Hours</p>
            <p className="font-semibold text-primary">
              {record.workHours}h
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

AttendanceRecord.displayName = 'AttendanceRecord';

AttendanceRecord.propTypes = {
  record: PropTypes.object.isRequired,
  formatDate: PropTypes.func.isRequired,
  getStatusBadge: PropTypes.func.isRequired,
  getStatusIcon: PropTypes.func.isRequired
};

/**
 * RecentCheckInOut Component
 * 
 * Displays check-in and check-out times with pagination
 * 
 * @param {Array} records - Array of attendance records
 */
const RecentCheckInOut = React.memo(({ records = [] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Sort records by date descending
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [records]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const recentRecords = sortedRecords.slice(startIndex, endIndex);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);
  
  // Memoize helper functions to prevent recreation
  const getStatusBadge = useCallback((status) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Absent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'Late':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Half Day':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  }, []);
  
  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case 'Present':
        return 'check_circle';
      case 'Absent':
        return 'cancel';
      case 'Late':
        return 'schedule';
      case 'Half Day':
        return 'timelapse';
      default:
        return 'help_outline';
    }
  }, []);
  
  const formatDate = useCallback((dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  }, []);
  
  if (recentRecords.length === 0) {
    return (
      <Card title="Recent Check-In/Out" icon="access_time">
        <div className="text-center py-8">
          <span className="material-icons text-subtext-light text-5xl mb-4">event_busy</span>
          <p className="text-text-light dark:text-text-dark">
            No recent attendance records available.
          </p>
        </div>
      </Card>
    );
  }
  
  return (
    <Card title="Recent Check-In/Out" icon="access_time">
      <div className="space-y-3">
        {recentRecords.map((record) => (
          <AttendanceRecord
            key={record.date}
            record={record}
            formatDate={formatDate}
            getStatusBadge={getStatusBadge}
            getStatusIcon={getStatusIcon}
          />
        ))}
      </div>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark flex items-center justify-between">
          <div className="text-sm text-subtext-light">
            Showing {startIndex + 1} to {Math.min(endIndex, sortedRecords.length)} of {sortedRecords.length} records
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg border border-border-light dark:border-border-dark text-text-light dark:text-text-dark hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <span className="material-icons text-sm">chevron_left</span>
            </button>
            
            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              // Show first page, last page, current page, and pages around current
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded-lg border transition-colors ${
                      currentPage === page
                        ? 'bg-primary text-white border-primary'
                        : 'border-border-light dark:border-border-dark text-text-light dark:text-text-dark hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    aria-label={`Page ${page}`}
                    aria-current={currentPage === page ? 'page' : undefined}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <span key={page} className="px-2 text-subtext-light">...</span>;
              }
              return null;
            })}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-lg border border-border-light dark:border-border-dark text-text-light dark:text-text-dark hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <span className="material-icons text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </Card>
  );
});

RecentCheckInOut.displayName = 'RecentCheckInOut';

RecentCheckInOut.propTypes = {
  records: PropTypes.arrayOf(PropTypes.shape({
    date: PropTypes.string.isRequired,
    checkIn: PropTypes.string,
    checkOut: PropTypes.string,
    status: PropTypes.oneOf(['Present', 'Absent', 'Late', 'Half Day']).isRequired,
    workHours: PropTypes.number
  }))
};

export default RecentCheckInOut;
