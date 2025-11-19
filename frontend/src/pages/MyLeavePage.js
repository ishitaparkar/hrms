import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LeaveBalanceCard from '../components/leave/LeaveBalanceCard';
import LeaveHistoryTable from '../components/leave/LeaveHistoryTable';
import LeaveRequestForm from '../components/leave/LeaveRequestForm';
import UpcomingHolidays from '../components/leave/UpcomingHolidays';

const MyLeavePage = () => {
  const [leaveData, setLeaveData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const fetchLeaveData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        'http://127.0.0.1:8000/api/my-leave/',
        {
          headers: { 'Authorization': `Token ${token}` }
        }
      );
      
      // Transform snake_case to camelCase for balances
      const transformedData = {
        ...response.data,
        balances: response.data.balances?.map(balance => ({
          ...balance,
          leaveType: balance.leave_type || balance.leaveType
        }))
      };
      
      setLeaveData(transformedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching leave data:', err);
      setError('Failed to load leave information. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitLeaveRequest = async (requestData) => {
    try {
      setActionError(null);
      const token = localStorage.getItem('authToken');
      await axios.post(
        'http://127.0.0.1:8000/api/leave-requests/',
        requestData,
        {
          headers: { 'Authorization': `Token ${token}` }
        }
      );
      
      // Refresh leave data after successful submission
      await fetchLeaveData();
      
      // Show success message
      setActionSuccess('Leave request submitted successfully!');
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      console.error('Error submitting leave request:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to submit leave request';
      throw new Error(errorMsg);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) {
      return;
    }

    try {
      setActionError(null);
      const token = localStorage.getItem('authToken');
      await axios.delete(
        `http://127.0.0.1:8000/api/leave-requests/${requestId}/`,
        {
          headers: { 'Authorization': `Token ${token}` }
        }
      );
      
      // Refresh leave data after cancellation
      await fetchLeaveData();
      
      setActionSuccess('Leave request cancelled successfully!');
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      console.error('Error cancelling leave request:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to cancel leave request. Please try again.';
      setActionError(errorMsg);
      setTimeout(() => setActionError(null), 5000);
    }
  };

  if (isLoading) {
    return (
      <main className="flex-1 bg-background-light dark:bg-background-dark">
        <PageHeader 
          title="My Leave" 
          description="Manage your leave requests and track your leave balance"
          icon="event_busy"
        />
        <div className="px-4 md:px-10 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-subtext-light">Loading leave information...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 bg-background-light dark:bg-background-dark">
        <PageHeader 
          title="My Leave" 
          description="Manage your leave requests and track your leave balance"
          icon="event_busy"
        />
        <div className="px-4 md:px-10 py-8">
          <Card>
            <div className="text-center py-8">
              <span className="material-icons text-red-500 text-5xl mb-4">error_outline</span>
              <p className="text-text-light dark:text-text-dark mb-4">{error}</p>
              <button
                onClick={fetchLeaveData}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label="Retry loading leave data"
              >
                <span className="material-icons" aria-hidden="true">refresh</span>
                Retry
              </button>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  // Extract leave types from balances for the form
  const leaveTypes = leaveData?.balances?.map(b => b.leaveType) || ['Casual Leave', 'Sick Leave', 'Vacation Leave'];

  // Separate pending requests from history
  const pendingRequests = leaveData?.requests?.filter(r => r.status.toLowerCase() === 'pending') || [];
  const allRequests = leaveData?.requests || [];

  return (
    <main className="flex-1 bg-background-light dark:bg-background-dark" role="main" aria-label="My Leave">
      <PageHeader 
        title="My Leave" 
        description="Manage your leave requests and track your leave balance"
        icon="event_busy"
        actions={
          <Button
            onClick={() => setShowRequestForm(true)}
            icon="add"
            variant="primary"
            aria-label="Open leave request form"
          >
            Request Leave
          </Button>
        }
      />
      
      <div className="px-4 md:px-10 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Success Message */}
          {actionSuccess && (
            <div 
              className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-4 py-3 rounded-lg flex items-center"
              role="alert"
              aria-live="polite"
            >
              <span className="material-icons text-green-600 dark:text-green-400 mr-2">check_circle</span>
              <span className="text-sm font-medium">{actionSuccess}</span>
            </div>
          )}

          {/* Error Message */}
          {actionError && (
            <div 
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg flex items-center"
              role="alert"
              aria-live="assertive"
            >
              <span className="material-icons text-red-600 dark:text-red-400 mr-2">error</span>
              <span className="text-sm font-medium">{actionError}</span>
            </div>
          )}

          {/* Leave Balance Cards */}
          {leaveData?.balances && leaveData.balances.length > 0 ? (
            <section aria-labelledby="leave-balance-heading">
              <h3 id="leave-balance-heading" className="text-lg font-semibold text-heading-light dark:text-heading-dark mb-4">
                Leave Balance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="Leave balance by type">
                {leaveData.balances.map((balance, index) => (
                  <LeaveBalanceCard key={index} balance={balance} />
                ))}
              </div>
            </section>
          ) : (
            <Card title="Leave Balance" icon="account_balance_wallet">
              <div className="text-center py-8" role="status" aria-label="No leave balance information">
                <span className="material-icons text-subtext-light text-5xl mb-3" aria-hidden="true">account_balance_wallet</span>
                <p className="text-text-light dark:text-text-dark font-medium mb-1">
                  No leave balance information
                </p>
                <p className="text-sm text-subtext-light">
                  Your leave balance will appear here once configured.
                </p>
              </div>
            </Card>
          )}

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <section aria-labelledby="pending-requests-heading">
            <Card title="Pending Requests" icon="pending_actions">
              <div className="space-y-3" role="list" aria-label="Pending leave requests">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                    role="listitem"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-heading-light dark:text-heading-dark">
                          {request.leaveType}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200" role="status">
                          <span className="material-icons text-xs" aria-hidden="true">schedule</span>
                          Pending
                        </span>
                      </div>
                      <p className="text-sm text-text-light dark:text-text-dark">
                        {new Date(request.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(request.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ({request.days} day{request.days !== 1 ? 's' : ''})
                      </p>
                    </div>
                    <button
                      onClick={() => handleCancelRequest(request.id)}
                      className="ml-4 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                      aria-label={`Cancel ${request.leaveType} request from ${new Date(request.startDate).toLocaleDateString()} to ${new Date(request.endDate).toLocaleDateString()}`}
                    >
                      <span className="material-icons text-sm" aria-hidden="true">close</span>
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </Card>
            </section>
          )}

          {/* Upcoming Holidays */}
          <UpcomingHolidays holidays={leaveData?.holidays} />

          {/* Leave History */}
          <LeaveHistoryTable 
            requests={allRequests} 
            onCancelRequest={handleCancelRequest}
          />
        </div>
      </div>

      {/* Leave Request Form Modal */}
      <LeaveRequestForm
        isOpen={showRequestForm}
        onClose={() => setShowRequestForm(false)}
        onSubmit={handleSubmitLeaveRequest}
        leaveTypes={leaveTypes}
      />
    </main>
  );
};

export default MyLeavePage;
