import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { usePermission } from '../contexts/PermissionContext';
import { PageHeader, Card, Button } from '../components/ui';

const LeaveTrackerPage = () => {
  const { hasPermission, hasRole } = usePermission();
  
  // State to hold the list of leave requests, fetched from the API
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch leave requests from the backend
  const fetchLeaveRequests = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const isEmployee = hasRole('Employee');
      
      // If employee, fetch only own leave requests
      if (isEmployee && !hasRole('HR Manager') && !hasRole('Super Admin')) {
        // First get current user info
        const userResponse = await axios.get('http://127.0.0.1:8000/api/auth/me/', {
          headers: { 'Authorization': `Token ${token}` }
        });
        const employeeId = userResponse.data.employee_id;
        
        // Fetch all leave requests and filter by employee ID
        const response = await axios.get('http://127.0.0.1:8000/api/leave-requests/', {
          headers: { 'Authorization': `Token ${token}` }
        });
        
        console.log("Leave requests fetched from backend:", response.data);
        
        // Filter to show only own leave requests
        if (Array.isArray(response.data)) {
          const ownLeaves = response.data.filter(leave => leave.employee.id === employeeId);
          setLeaveRequests(ownLeaves);
        } else {
          console.error("API response is not an array:", response.data);
          setLeaveRequests([]);
        }
      } else {
        // HR Manager & Super Admin: Fetch all leave requests
        const response = await axios.get('http://127.0.0.1:8000/api/leave-requests/', {
          headers: { 'Authorization': `Token ${token}` }
        });
        
        console.log("Leave requests fetched from backend:", response.data);
        
        if (Array.isArray(response.data)) {
          setLeaveRequests(response.data);
        } else {
          console.error("API response is not an array:", response.data);
          setLeaveRequests([]);
        }
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      if (error.response?.status === 401) {
        alert('Your session has expired. Please log in again.');
      } else if (error.response?.status === 403) {
        alert('You do not have permission to view leave requests.');
      }
      setLeaveRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect hook to call the fetch function once when the component first loads
  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  // This function is called when an "Approve" or "Deny" button is clicked
  const handleStatusUpdate = async (requestId, newStatus) => {
    console.log(`Sending update for request ${requestId} to set status to ${newStatus}`);
    try {
      const token = localStorage.getItem('authToken');
      await axios.patch(`http://127.0.0.1:8000/api/leave-requests/${requestId}/`, {
        status: newStatus
      }, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      fetchLeaveRequests();
    } catch (error) {
      console.error(`Error updating status for request ${requestId}:`, error);
      const errorMsg = error.response?.data?.detail || 'Failed to update the leave request status.';
      alert(errorMsg);
    }
  };
  
  // Helper function to get the correct CSS class for the status badge
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Denied': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  // Check if user can approve leaves (HR Manager or Super Admin)
  const canApproveLeaves = hasPermission('authentication.approve_leaves') || 
                           hasRole('HR Manager') || 
                           hasRole('Super Admin');

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Page Header */}
      <PageHeader
        title={hasRole('Employee') && !hasRole('HR Manager') && !hasRole('Super Admin') ? 'My Leaves' : 'Leave Management'}
        description={hasRole('Employee') && !hasRole('HR Manager') && !hasRole('Super Admin') 
          ? 'View and manage your leave requests' 
          : 'Manage all employee leave requests'}
        icon="event_available"
        actions={
          <Button
            variant="primary"
            size="md"
            icon="add"
            to="/request-leave"
          >
            Request Leave
          </Button>
        }
      />

      {/* Main Content */}
      <div className="p-4 md:p-6 lg:p-8">
        <Card noPadding className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-12 text-subtext-light dark:text-subtext-dark">
              <span className="material-icons text-4xl mb-2 animate-spin">refresh</span>
              <p>Loading leave requests from the server...</p>
            </div>
          ) : leaveRequests.length === 0 ? (
            <div className="text-center py-12 text-subtext-light dark:text-subtext-dark">
              <span className="material-icons text-4xl mb-2">event_busy</span>
              <p>No leave requests found.</p>
              {hasRole('Employee') && !hasRole('HR Manager') && !hasRole('Super Admin') && (
                <p className="mt-2">Click "Request Leave" to submit your first request.</p>
              )}
            </div>
          ) : (
            <table className="w-full text-sm text-left min-w-[768px]">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800 text-subtext-light dark:text-subtext-dark border-b border-border-light dark:border-border-dark">
                <tr>
                  <th className="px-6 py-3">Employee Name</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Leave Type</th>
                  <th className="px-6 py-3">Start Date</th>
                  <th className="px-6 py-3">End Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((request) => (
                  <tr 
                    key={request.id} 
                    className="border-b border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-text-light dark:text-text-dark">
                      {request.employee.firstName} {request.employee.lastName}
                    </td>
                    <td className="px-6 py-4 text-text-light dark:text-text-dark">
                      {request.employee.department}
                    </td>
                    <td className="px-6 py-4 text-text-light dark:text-text-dark">
                      {request.leave_type}
                    </td>
                    <td className="px-6 py-4 text-text-light dark:text-text-dark">
                      {request.start_date}
                    </td>
                    <td className="px-6 py-4 text-text-light dark:text-text-dark">
                      {request.end_date}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        {request.status === 'Pending' && canApproveLeaves ? (
                          <>
                            <button 
                              onClick={() => handleStatusUpdate(request.id, 'Approved')}
                              className="text-green-600 hover:text-green-700 dark:hover:text-green-400 text-xs font-medium transition-colors"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(request.id, 'Denied')}
                              className="text-red-500 hover:text-red-600 dark:hover:text-red-400 text-xs font-medium transition-colors"
                            >
                              Deny
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-subtext-light dark:text-subtext-dark">No actions available</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
};

export default LeaveTrackerPage;