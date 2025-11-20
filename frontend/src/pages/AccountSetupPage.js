import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import onboardingService from '../services/onboardingService';

const AccountSetupPage = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get auth token and employee data from localStorage
    const authToken = localStorage.getItem('setupAuthToken');
    const employeeData = localStorage.getItem('setupEmployeeData');

    if (!authToken || !employeeData) {
      // Redirect to phone auth if no token or data
      navigate('/phone-auth');
      return;
    }

    // Parse employee data
    try {
      const parsedEmployeeData = JSON.parse(employeeData);
      setEmployeeDetails(parsedEmployeeData);

      // Fetch generated username from API
      fetchUsername(authToken);
    } catch (err) {
      console.error('Failed to parse employee data:', err);
      setError('Failed to load employee data. Please try again.');
      setIsLoading(false);
    }
  }, [navigate]);

  const fetchUsername = async (authToken) => {
    try {
      const response = await onboardingService.generateUsername(authToken);

      console.log('Username generated:', response);
      setUsername(response.username);

      // Update employee details with full data from API if available
      if (response.employee_details) {
        setEmployeeDetails(response.employee_details);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to generate username:', err);

      // Handle token expiration or invalid token
      if (err.status === 401) {
        setError('Your session has expired. Please start the verification process again.');
        // Clear expired tokens
        onboardingService.clearOnboardingData();
        // Redirect to phone auth after a delay
        setTimeout(() => {
          navigate('/phone-auth');
        }, 3000);
      } else {
        setError(err.message || 'Failed to generate username. Please try again.');
      }

      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    // Store username for next step
    localStorage.setItem('setupUsername', username);

    // Navigate to password setup page
    navigate('/password-setup');
  };

  const handleRequestChanges = () => {
    // Open email client to contact HR
    window.location.href = 'mailto:hr@example.com?subject=Account Setup - Request Changes&body=I would like to request changes to my account details.';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="w-full max-w-md p-8 space-y-8 bg-card-light dark:bg-card-dark rounded-lg shadow-lg">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">
              Loading...
            </h2>
            <p className="mt-2 text-sm text-subtext-light dark:text-subtext-dark">
              Generating your account details
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
      <div className="w-full max-w-md p-8 space-y-8 bg-card-light dark:bg-card-dark rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">
            Verify Your Account Details
          </h2>
          <p className="mt-2 text-sm text-subtext-light dark:text-subtext-dark">
            Please review your account information before proceeding.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Username Display */}
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-md">
            <label className="block text-sm font-medium text-subtext-light dark:text-subtext-dark mb-2">
              Your Username
            </label>
            <div className="text-lg font-semibold text-text-light dark:text-text-dark">
              {username}
            </div>
            <p className="mt-1 text-xs text-subtext-light dark:text-subtext-dark">
              This username will be used to log in to the portal
            </p>
          </div>

          {/* Employee Details */}
          {employeeDetails && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-text-light dark:text-text-dark">
                Your Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-subtext-light dark:text-subtext-dark">
                    First Name
                  </label>
                  <div className="mt-1 text-text-light dark:text-text-dark">
                    {employeeDetails.first_name}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-subtext-light dark:text-subtext-dark">
                    Last Name
                  </label>
                  <div className="mt-1 text-text-light dark:text-text-dark">
                    {employeeDetails.last_name}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-subtext-light dark:text-subtext-dark">
                    Email
                  </label>
                  <div className="mt-1 text-text-light dark:text-text-dark">
                    {employeeDetails.email}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-subtext-light dark:text-subtext-dark">
                    Department
                  </label>
                  <div className="mt-1 text-text-light dark:text-text-dark">
                    {employeeDetails.department}
                  </div>
                </div>

                {employeeDetails.designation && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-subtext-light dark:text-subtext-dark">
                      Designation
                    </label>
                    <div className="mt-1 text-text-light dark:text-text-dark">
                      {employeeDetails.designation}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleConfirm}
              disabled={!username || error}
              className="w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Confirm and Continue
            </button>

            <button
              onClick={handleRequestChanges}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Request Changes
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-subtext-light dark:text-subtext-dark">
              If any information is incorrect, please click "Request Changes" to contact HR.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSetupPage;
