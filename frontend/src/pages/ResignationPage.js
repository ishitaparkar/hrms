import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { usePermission } from '../contexts/PermissionContext';
import { PageHeader, Card, Button, InfoRow } from '../components/ui';

const ResignationPage = () => {
  const { hasRole } = usePermission();
  const isEmployee = hasRole('Employee');
  const isSuperAdmin = hasRole('Super Admin');
  const isHRManager = hasRole('HR Manager');
  
  // State management
  const [activeTab, setActiveTab] = useState('Pending');
  const [resignationRequests, setResignationRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [resignationData, setResignationData] = useState({
    resignationDate: '',
    lastWorkingDay: '',
    reason: '',
    comments: ''
  });

  // Fetch resignation data
  useEffect(() => {
    const fetchResignations = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        
        // Mock data for now (replace with actual API call)
        const allResignations = [
          { id: 1, employeeId: 1, name: 'Amit Desai', title: 'Lecturer', department: 'Engineering', resignationDate: '2025-10-20', lastWorkingDay: '2025-11-20', status: 'Pending', reason: 'Better opportunity' },
          { id: 2, employeeId: 2, name: 'Neha Gupta', title: 'Assistant Professor', department: 'Commerce', resignationDate: '2025-09-15', lastWorkingDay: '2025-10-15', status: 'Approved', reason: 'Personal reasons' },
          { id: 3, employeeId: 3, name: 'Dr. Michael Chen', title: 'Associate Professor', department: 'Physics', resignationDate: '2025-10-18', lastWorkingDay: '2025-11-18', status: 'Pending', reason: 'Relocation' },
        ];
        
        if (isEmployee && !isHRManager && !isSuperAdmin) {
          // Get current user's employee ID
          const userResponse = await axios.get('http://127.0.0.1:8000/api/auth/me/', {
            headers: { 'Authorization': `Token ${token}` }
          });
          const employeeId = userResponse.data.employee_id;
          
          // Filter to show only own resignation
          const ownResignation = allResignations.filter(r => r.employeeId === employeeId);
          setResignationRequests(ownResignation);
          setHasSubmitted(ownResignation.length > 0);
        } else {
          // HR Manager & Super Admin: Show all resignations
          setResignationRequests(allResignations);
        }
      } catch (error) {
        console.error("Error fetching resignations:", error);
        setResignationRequests([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResignations();
  }, [isEmployee, isHRManager, isSuperAdmin]);
  
  // Handle resignation submission
  const handleSubmitResignation = (e) => {
    e.preventDefault();
    
    // Here you would normally send to backend
    alert(`Resignation Submitted!\n\nResignation Date: ${resignationData.resignationDate}\nLast Working Day: ${resignationData.lastWorkingDay}\nReason: ${resignationData.reason}\n\nYour resignation has been submitted to HR for review.`);
    
    setShowSubmitModal(false);
    setHasSubmitted(true);
    
    // Add to local state (in real app, refetch from backend)
    const newResignation = {
      id: Date.now(),
      employeeId: 1, // Would come from user data
      name: 'Current User',
      title: 'Employee',
      department: 'Department',
      resignationDate: resignationData.resignationDate,
      lastWorkingDay: resignationData.lastWorkingDay,
      status: 'Pending',
      reason: resignationData.reason
    };
    setResignationRequests([...resignationRequests, newResignation]);
    
    // Reset form
    setResignationData({
      resignationDate: '',
      lastWorkingDay: '',
      reason: '',
      comments: ''
    });
  };

  // Filter the data based on the active tab
  const filteredRequests = resignationRequests.filter(req => {
    if (activeTab === 'All') return true;
    return req.status === activeTab;
  });

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      <PageHeader
        title={isEmployee && !isHRManager && !isSuperAdmin ? 'My Resignation' : 'Resignation Management'}
        description={isEmployee && !isHRManager && !isSuperAdmin 
          ? 'Submit and track your resignation request' 
          : 'Manage all employee resignation requests'}
        icon="assignment_return"
        actions={
          isEmployee && !isHRManager && !isSuperAdmin && !hasSubmitted && (
            <Button
              variant="primary"
              icon="assignment_return"
              onClick={() => setShowSubmitModal(true)}
            >
              Submit Resignation
            </Button>
          )
        }
      />

      <main className="flex-1 p-6 overflow-auto">
        {isLoading ? (
          <div className="text-center py-10 text-subtext-light dark:text-subtext-dark">
            Loading resignation data...
          </div>
        ) : (
          <>
            {/* Tab Navigation - Only show for HR/Admin */}
            {(isHRManager || isSuperAdmin) && (
              <div className="border-b border-border-light dark:border-border-dark mb-6">
                <nav className="flex space-x-4">
                  <TabButton title="Pending" activeTab={activeTab} setActiveTab={setActiveTab} />
                  <TabButton title="Approved" activeTab={activeTab} setActiveTab={setActiveTab} />
                  <TabButton title="All" activeTab={activeTab} setActiveTab={setActiveTab} />
                </nav>
              </div>
            )}

            {/* Resignation Cards Grid */}
            {filteredRequests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRequests.map((request) => (
                  <ResignationCard 
                    key={request.id} 
                    request={request} 
                    isEmployee={isEmployee && !isHRManager && !isSuperAdmin}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <span className="material-icons text-6xl text-subtext-light dark:text-subtext-dark mb-4">
                  assignment_return
                </span>
                <p className="text-subtext-light dark:text-subtext-dark text-lg mb-2">
                  {isEmployee && !isHRManager && !isSuperAdmin 
                    ? 'No resignation submitted yet' 
                    : 'No resignation requests in this category'}
                </p>
                {isEmployee && !isHRManager && !isSuperAdmin && !hasSubmitted && (
                  <Button
                    variant="primary"
                    icon="assignment_return"
                    onClick={() => setShowSubmitModal(true)}
                    className="mt-4"
                  >
                    Submit Resignation
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </main>
      
      {/* Resignation Submission Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-heading-light dark:text-heading-dark">
                Submit Resignation
              </h2>
              <button 
                onClick={() => setShowSubmitModal(false)}
                className="text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark transition-colors"
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center">
                <span className="material-icons text-base mr-2">info</span>
                Please ensure you provide adequate notice period as per your employment contract.
              </p>
            </div>
            
            <form onSubmit={handleSubmitResignation}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                  Resignation Date *
                </label>
                <input
                  type="date"
                  required
                  value={resignationData.resignationDate}
                  onChange={(e) => setResignationData({...resignationData, resignationDate: e.target.value})}
                  className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-text-light dark:text-text-dark"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                  Last Working Day *
                </label>
                <input
                  type="date"
                  required
                  value={resignationData.lastWorkingDay}
                  onChange={(e) => setResignationData({...resignationData, lastWorkingDay: e.target.value})}
                  className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-text-light dark:text-text-dark"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                  Reason for Resignation *
                </label>
                <select
                  required
                  value={resignationData.reason}
                  onChange={(e) => setResignationData({...resignationData, reason: e.target.value})}
                  className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-text-light dark:text-text-dark"
                >
                  <option value="">Select a reason</option>
                  <option value="Better Opportunity">Better Opportunity</option>
                  <option value="Personal Reasons">Personal Reasons</option>
                  <option value="Relocation">Relocation</option>
                  <option value="Health Issues">Health Issues</option>
                  <option value="Further Studies">Further Studies</option>
                  <option value="Career Change">Career Change</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                  Additional Comments (Optional)
                </label>
                <textarea
                  rows="4"
                  value={resignationData.comments}
                  onChange={(e) => setResignationData({...resignationData, comments: e.target.value})}
                  placeholder="Any additional information you'd like to share..."
                  className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-text-light dark:text-text-dark"
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowSubmitModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                >
                  Submit Resignation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for Tab Buttons
const TabButton = ({ title, activeTab, setActiveTab }) => (
  <button 
    onClick={() => setActiveTab(title)}
    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
      activeTab === title 
        ? 'border-primary text-primary' 
        : 'border-transparent text-subtext-light dark:text-subtext-dark hover:border-gray-300 dark:hover:border-gray-600 hover:text-text-light dark:hover:text-text-dark'
    }`}
  >
    {title}
  </button>
);

// Helper component for a single Resignation Card
const ResignationCard = ({ request, isEmployee }) => {
  const getStatusBadge = (status) => {
    const badges = {
      'Pending': 'px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
      'Approved': 'px-3 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
      'Rejected': 'px-3 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
    };
    return <span className={badges[status] || ''}>{status}</span>;
  };

  return (
    <Card className="flex flex-col h-full" hover>
      <div className="flex-grow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="font-bold text-lg text-heading-light dark:text-heading-dark">
              {request.name}
            </p>
            <p className="text-sm text-subtext-light dark:text-subtext-dark">
              {request.title}, {request.department}
            </p>
          </div>
          {getStatusBadge(request.status)}
        </div>
        <div className="space-y-3">
          <InfoRow icon="calendar_today" label="Resignation Date" value={request.resignationDate} />
          <InfoRow icon="event_busy" label="Last Working Day" value={request.lastWorkingDay} />
          {request.reason && <InfoRow icon="description" label="Reason" value={request.reason} />}
        </div>
      </div>
      <div className="border-t border-border-light dark:border-border-dark mt-4 pt-4 flex justify-end gap-2">
        <Button variant="outline" size="sm">
          View Details
        </Button>
        {!isEmployee && request.status === 'Pending' && (
          <>
            <Button variant="success" size="sm">
              Approve
            </Button>
            <Button variant="danger" size="sm">
              Reject
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};

export default ResignationPage;