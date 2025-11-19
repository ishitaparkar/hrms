import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { usePermission } from '../contexts/PermissionContext';
import PermissionError from '../components/PermissionError';
import usePermissionError from '../hooks/usePermissionError';

const AuditLogPage = () => {
  const { hasRole } = usePermission();
  const { permissionError, handleApiError, clearPermissionError } = usePermissionError();
  
  // State management
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    action: '',
    start_date: '',
    end_date: '',
    user_id: '',
    target_user_id: '',
    resource_type: ''
  });
  
  // Available action types
  const actionTypes = [
    { value: '', label: 'All Actions' },
    { value: 'ROLE_ASSIGNED', label: 'Role Assigned' },
    { value: 'ROLE_REVOKED', label: 'Role Revoked' },
    { value: 'PERMISSION_CHANGED', label: 'Permission Changed' },
    { value: 'ACCESS_DENIED', label: 'Access Denied' }
  ];

  // Fetch audit logs with filters and pagination
  const fetchAuditLogs = async (page = 1) => {
    setIsLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page);
      
      // Add filters if they have values
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `http://127.0.0.1:8000/api/auth/audit-logs/?${params.toString()}`,
        {
          headers: {
            'Authorization': `Token ${token}`
          }
        }
      );
      
      // Handle paginated response
      if (response.data.results) {
        setAuditLogs(response.data.results);
        setTotalCount(response.data.count);
        setTotalPages(Math.ceil(response.data.count / 10)); // Assuming 10 items per page
      } else {
        // Handle non-paginated response
        setAuditLogs(response.data);
        setTotalCount(response.data.length);
        setTotalPages(1);
      }
      
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      if (!handleApiError(error)) {
        alert('Failed to fetch audit logs');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchAuditLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply filters
  const handleApplyFilters = () => {
    fetchAuditLogs(1);
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      action: '',
      start_date: '',
      end_date: '',
      user_id: '',
      target_user_id: '',
      resource_type: ''
    });
    // Fetch without filters
    setTimeout(() => fetchAuditLogs(1), 0);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchAuditLogs(newPage);
    }
  };

  // Export to CSV
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      // Build query parameters with filters
      const params = new URLSearchParams();
      params.append('export', 'csv');
      
      // Add filters if they have values
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `http://127.0.0.1:8000/api/auth/audit-logs/?${params.toString()}`,
        { 
          responseType: 'blob',
          headers: {
            'Authorization': `Token ${token}`
          }
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      link.setAttribute('download', `audit_logs_${timestamp}.csv`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      alert('Audit logs exported successfully');
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      if (!handleApiError(error)) {
        alert('Failed to export audit logs');
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Get action badge color
  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'ROLE_ASSIGNED':
        return 'bg-green-100 text-green-800';
      case 'ROLE_REVOKED':
        return 'bg-red-100 text-red-800';
      case 'PERMISSION_CHANGED':
        return 'bg-blue-100 text-blue-800';
      case 'ACCESS_DENIED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format details for display
  const formatDetails = (details) => {
    if (!details || typeof details !== 'object') return 'N/A';
    
    // Create a readable string from the details object
    const entries = Object.entries(details)
      .filter(([key, value]) => value !== null && value !== undefined)
      .map(([key, value]) => {
        // Format key to be more readable
        const readableKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        // Format value
        let formattedValue = value;
        if (typeof value === 'object') {
          formattedValue = JSON.stringify(value);
        }
        
        return `${readableKey}: ${formattedValue}`;
      });
    
    return entries.join(', ') || 'N/A';
  };

  // Check if user is Super Admin
  if (!hasRole('Super Admin')) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600">You must be a Super Admin to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Permission Error Modal */}
      <PermissionError error={permissionError} onClose={clearPermissionError} />
      
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">Audit Logs</h1>
        <p className="text-sm text-subtext-light mt-1">
          View and export system audit logs for security compliance
        </p>
      </div>

      {/* Filters Section */}
      <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-light dark:text-text-dark">Filters</h2>
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
          >
            <span className="material-icons text-sm mr-2">download</span>
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Action Type Filter */}
          <div>
            <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
              Action Type
            </label>
            <select
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-border-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              {actionTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Start Date Filter */}
          <div>
            <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
              Start Date
            </label>
            <input
              type="datetime-local"
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-border-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>

          {/* End Date Filter */}
          <div>
            <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
              End Date
            </label>
            <input
              type="datetime-local"
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-border-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>

          {/* Actor User ID Filter */}
          <div>
            <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
              Actor User ID
            </label>
            <input
              type="number"
              name="user_id"
              value={filters.user_id}
              onChange={handleFilterChange}
              placeholder="Enter user ID"
              className="w-full px-3 py-2 border border-border-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>

          {/* Target User ID Filter */}
          <div>
            <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
              Target User ID
            </label>
            <input
              type="number"
              name="target_user_id"
              value={filters.target_user_id}
              onChange={handleFilterChange}
              placeholder="Enter user ID"
              className="w-full px-3 py-2 border border-border-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>

          {/* Resource Type Filter */}
          <div>
            <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
              Resource Type
            </label>
            <input
              type="text"
              name="resource_type"
              value={filters.resource_type}
              onChange={handleFilterChange}
              placeholder="e.g., Role, Employee"
              className="w-full px-3 py-2 border border-border-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>

        {/* Filter Actions */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600 text-sm font-medium"
          >
            Apply Filters
          </button>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 border border-border-light rounded-md text-text-light hover:bg-gray-50 text-sm font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-subtext-light">Loading audit logs...</p>
        </div>
      ) : auditLogs.length === 0 ? (
        <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm p-12 text-center">
          <span className="material-icons text-6xl text-subtext-light mb-4">search_off</span>
          <p className="text-lg text-text-light dark:text-text-dark font-medium">No audit logs found</p>
          <p className="text-sm text-subtext-light mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          {/* Results Summary */}
          <div className="mb-4 text-sm text-subtext-light">
            Showing {auditLogs.length} of {totalCount} audit log{totalCount !== 1 ? 's' : ''}
          </div>

          {/* Table */}
          <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background-light dark:bg-gray-800 border-b border-border-light">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-text-light dark:text-text-dark">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-text-light dark:text-text-dark">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-text-light dark:text-text-dark">
                      Actor
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-text-light dark:text-text-dark">
                      Target User
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-text-light dark:text-text-dark">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-border-light hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-4 py-3 text-subtext-light whitespace-nowrap">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(log.action)}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-text-light dark:text-text-dark">
                          {log.actor_username || 'System'}
                        </div>
                        {log.actor && (
                          <div className="text-xs text-subtext-light">ID: {log.actor}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {log.target_user_username ? (
                          <>
                            <div className="text-text-light dark:text-text-dark">
                              {log.target_user_username}
                            </div>
                            <div className="text-xs text-subtext-light">ID: {log.target_user}</div>
                          </>
                        ) : (
                          <span className="text-subtext-light italic">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-md">
                          <div className="text-text-light dark:text-text-dark text-xs">
                            {formatDetails(log.details)}
                          </div>
                          {log.ip_address && (
                            <div className="text-xs text-subtext-light mt-1">
                              IP: {log.ip_address}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-subtext-light">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-border-light rounded-md text-text-light hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                <div className="flex gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = idx + 1;
                    } else if (currentPage <= 3) {
                      pageNum = idx + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + idx;
                    } else {
                      pageNum = currentPage - 2 + idx;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1.5 rounded-md text-sm ${
                          currentPage === pageNum
                            ? 'bg-primary text-white'
                            : 'border border-border-light text-text-light hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-border-light rounded-md text-text-light hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuditLogPage;
