import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import Card from '../ui/Card';

/**
 * LeaveHistoryTable Component
 * 
 * Displays a table of leave requests with their status and pagination
 * 
 * @param {Array} requests - Array of leave request objects
 * @param {Function} onCancelRequest - Callback function to cancel a pending request
 */
const LeaveHistoryTable = ({ requests, onCancelRequest }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate pagination
  const totalPages = Math.ceil((requests?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = useMemo(() => {
    return requests?.slice(startIndex, endIndex) || [];
  }, [requests, startIndex, endIndex]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (!requests || requests.length === 0) {
    return (
      <Card title="Leave History" icon="history">
        <div className="text-center py-12">
          <span className="material-icons text-subtext-light text-6xl mb-4">event_note</span>
          <p className="text-text-light dark:text-text-dark font-medium mb-2">
            No leave requests yet
          </p>
          <p className="text-sm text-subtext-light">
            Your leave request history will appear here.
          </p>
        </div>
      </Card>
    );
  }

  // Get status badge styling
  const getStatusBadge = (status) => {
    const statusLower = status.toLowerCase();
    let bgColor, textColor, icon;

    if (statusLower === 'approved') {
      bgColor = 'bg-green-100 dark:bg-green-900/30';
      textColor = 'text-green-800 dark:text-green-200';
      icon = 'check_circle';
    } else if (statusLower === 'rejected') {
      bgColor = 'bg-red-100 dark:bg-red-900/30';
      textColor = 'text-red-800 dark:text-red-200';
      icon = 'cancel';
    } else {
      bgColor = 'bg-yellow-100 dark:bg-yellow-900/30';
      textColor = 'text-yellow-800 dark:text-yellow-200';
      icon = 'schedule';
    }

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        <span className="material-icons text-sm">{icon}</span>
        {status}
      </span>
    );
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Card title="Leave History" icon="history" noPadding>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-border-light dark:border-border-dark">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtext-light dark:text-subtext-dark uppercase tracking-wider">
                Leave Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtext-light dark:text-subtext-dark uppercase tracking-wider">
                Start Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtext-light dark:text-subtext-dark uppercase tracking-wider">
                End Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtext-light dark:text-subtext-dark uppercase tracking-wider">
                Days
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtext-light dark:text-subtext-dark uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtext-light dark:text-subtext-dark uppercase tracking-wider">
                Reason
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtext-light dark:text-subtext-dark uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light dark:divide-border-dark">
            {paginatedRequests.map((request) => (
              <tr 
                key={request.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-text-light dark:text-text-dark">
                    {request.leaveType}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text-light dark:text-text-dark">
                    {formatDate(request.startDate)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text-light dark:text-text-dark">
                    {formatDate(request.endDate)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-text-light dark:text-text-dark">
                    {request.days}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(request.status)}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-text-light dark:text-text-dark max-w-xs truncate" title={request.reason}>
                    {request.reason || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {request.status.toLowerCase() === 'pending' && onCancelRequest && (
                    <button
                      onClick={() => onCancelRequest(request.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium flex items-center gap-1"
                      aria-label={`Cancel leave request from ${formatDate(request.startDate)}`}
                    >
                      <span className="material-icons text-sm">close</span>
                      Cancel
                    </button>
                  )}
                  {request.status.toLowerCase() !== 'pending' && (
                    <span className="text-subtext-light dark:text-subtext-dark">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-border-light dark:border-border-dark flex items-center justify-between">
          <div className="text-sm text-subtext-light">
            Showing {startIndex + 1} to {Math.min(endIndex, requests.length)} of {requests.length} requests
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
};

LeaveHistoryTable.propTypes = {
  requests: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      leaveType: PropTypes.string.isRequired,
      startDate: PropTypes.string.isRequired,
      endDate: PropTypes.string.isRequired,
      days: PropTypes.number.isRequired,
      reason: PropTypes.string,
      status: PropTypes.string.isRequired,
      appliedDate: PropTypes.string,
      approvedBy: PropTypes.string,
    })
  ),
  onCancelRequest: PropTypes.func,
};

export default LeaveHistoryTable;
