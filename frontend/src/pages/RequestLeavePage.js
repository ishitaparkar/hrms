import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { usePermission } from '../contexts/PermissionContext';

const RequestLeavePage = () => {
  const navigate = useNavigate();
  const { hasRole } = usePermission();
  const isEmployee = hasRole('Employee');
  const isHRManager = hasRole('HR Manager');
  const isSuperAdmin = hasRole('Super Admin');

  // State for the form data
  const [formData, setFormData] = useState({
    employee_id: '', // This will hold the NUMERIC database ID (e.g., 1, 2)
    leave_type: 'Casual Leave',
    start_date: '',
    end_date: '',
    reason: '',
  });
  
  // State to manage the user-typed Staff ID (e.g., 'CS101') - for HR/Admin only
  const [staffIdInput, setStaffIdInput] = useState('');
  // State to display the fetched employee's name for confirmation
  const [fetchedEmployeeName, setFetchedEmployeeName] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Auto-fetch logged-in employee's details on page load
  useEffect(() => {
    const fetchOwnProfile = async () => {
      if (isEmployee && !isHRManager && !isSuperAdmin) {
        setIsLoadingProfile(true);
        try {
          const token = localStorage.getItem('authToken');
          
          // Get current user info
          const userResponse = await axios.get('http://127.0.0.1:8000/api/auth/me/', {
            headers: { 'Authorization': `Token ${token}` }
          });
          const employeeId = userResponse.data.employee_id;
          
          // Get employee details
          const empResponse = await axios.get(`http://127.0.0.1:8000/api/employees/${employeeId}/`, {
            headers: { 'Authorization': `Token ${token}` }
          });
          
          const employee = empResponse.data;
          
          // Auto-fill employee details
          setFormData(prev => ({ ...prev, employee_id: employee.id }));
          setFetchedEmployeeName(`${employee.firstName} ${employee.lastName} - ${employee.department}`);
          setStaffIdInput(employee.employeeId);
        } catch (error) {
          console.error("Failed to fetch own profile:", error);
          alert('Failed to load your profile. Please try again.');
        } finally {
          setIsLoadingProfile(false);
        }
      } else {
        setIsLoadingProfile(false);
      }
    };
    
    fetchOwnProfile();
  }, [isEmployee, isHRManager, isSuperAdmin]);

  // This function is called when the "Fetch Details" button is clicked (HR/Admin only)
  const handleFetchEmployee = async () => {
    if (!staffIdInput) {
      alert('Please enter a Staff ID.');
      return;
    }
    setIsFetching(true);
    setFetchedEmployeeName(''); // Clear previous results
    setFormData(prev => ({ ...prev, employee_id: '' })); // Clear the stored numeric ID

    try {
      // We make an API call to a special endpoint to find the employee by their staffId
      // (Your friend will need to build this on the backend)
      // For now, we simulate by fetching the whole list and finding the match.
      const response = await axios.get(`http://127.0.0.1:8000/api/employees/`);
      const employee = response.data.find(emp => emp.employeeId === staffIdInput);

      if (employee) {
        setFetchedEmployeeName(`${employee.firstName} ${employee.lastName} - ${employee.department}`);
        // CRUCIAL: Store the numeric database ID for submission
        setFormData(prev => ({ ...prev, employee_id: employee.id }));
      } else {
        setFetchedEmployeeName('Employee not found.');
      }
    } catch (error) {
      console.error("Failed to fetch employee details:", error);
      setFetchedEmployeeName('Error fetching data.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employee_id) {
      alert('Please fetch and confirm employee details before submitting.');
      return;
    }
    try {
      await axios.post('http://127.0.0.1:8000/api/leave-requests/', formData);
      alert('Leave request submitted successfully!');
      navigate('/leave-tracker');
    } catch (error) {
      console.error('Error submitting leave request:', error.response.data);
      alert(`Failed to submit request: ${JSON.stringify(error.response.data)}`);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex flex-col h-full">
        <header className="bg-card-light dark:bg-card-dark p-4 border-b border-border-light">
          <h1 className="text-2xl font-semibold">Submit a New Leave Request</h1>
        </header>
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-subtext-light">Loading your profile...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="bg-card-light dark:bg-card-dark p-4 border-b border-border-light">
        <h1 className="text-2xl font-semibold">Submit a New Leave Request</h1>
      </header>
      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto bg-card-light p-8 rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Employee Input - Auto-filled for employees, manual for HR/Admin */}
            <div>
              <label htmlFor="staffIdInput" className="block text-sm font-medium text-subtext-light">
                Employee Staff ID
              </label>
              <div className="flex items-center space-x-2 mt-1">
                <input 
                  type="text" 
                  id="staffIdInput" 
                  value={staffIdInput} 
                  onChange={(e) => setStaffIdInput(e.target.value)} 
                  required 
                  disabled={isEmployee && !isHRManager && !isSuperAdmin}
                  className={`w-full bg-background-light dark:bg-gray-800 border-border-light rounded-md ${
                    isEmployee && !isHRManager && !isSuperAdmin ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                  placeholder="e.g., CS101"
                />
                {(isHRManager || isSuperAdmin) && (
                  <button 
                    type="button" 
                    onClick={handleFetchEmployee}
                    disabled={isFetching}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50"
                  >
                    {isFetching ? 'Fetching...' : 'Fetch Details'}
                  </button>
                )}
              </div>
              {/* Display the employee name */}
              {fetchedEmployeeName && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md text-sm flex items-center">
                  <span className="material-icons text-sm mr-2">check_circle</span>
                  {fetchedEmployeeName}
                  {isEmployee && !isHRManager && !isSuperAdmin && (
                    <span className="ml-2 text-xs">(Auto-filled from your profile)</span>
                  )}
                </div>
              )}
            </div>

            {/* Rest of the form remains the same */}
            <div>
              <label htmlFor="leave_type" className="block text-sm font-medium text-subtext-light">Leave Type</label>
              <select name="leave_type" id="leave_type" value={formData.leave_type} onChange={handleChange} className="w-full bg-background-light dark:bg-gray-800 border-border-light rounded-md">
                <option>Casual Leave</option><option>Sick Leave</option><option>Earned Leave</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="start_date">Start Date</label>
                <input type="date" name="start_date" id="start_date" value={formData.start_date} onChange={handleChange} required className="w-full bg-background-light dark:bg-gray-800 border-border-light rounded-md" />
              </div>
              <div>
                <label htmlFor="end_date">End Date</label>
                <input type="date" name="end_date" id="end_date" value={formData.end_date} onChange={handleChange} required className="w-full bg-background-light dark:bg-gray-800 border-border-light rounded-md" />
              </div>
            </div>
            <div>
              <label htmlFor="reason">Reason for Leave</label>
              <textarea name="reason" id="reason" rows="4" value={formData.reason} onChange={handleChange} className="w-full bg-background-light dark:bg-gray-800 border-border-light rounded-md" placeholder="Briefly explain..."></textarea>
            </div>
            <div className="flex justify-end gap-4 border-t border-border-light pt-6">
              <button type="button" onClick={() => navigate('/leave-tracker')}>Cancel</button>
              <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-600">Submit Request</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
export default RequestLeavePage;