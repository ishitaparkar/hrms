import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermission } from '../contexts/PermissionContext';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { roles, clearAuthData } = usePermission();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleLogout = () => {
    clearAuthData();
    navigate('/');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
      <div className="w-full max-w-md p-8 space-y-6 bg-card-light dark:bg-card-dark rounded-lg shadow-lg text-center">
        <div className="flex justify-center">
          <svg
            className="w-20 h-20 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">
          Access Denied
        </h1>

        <p className="text-subtext-light dark:text-subtext-dark">
          You do not have permission to access this page.
        </p>

        {roles && roles.length > 0 && (
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
            <p className="text-sm text-subtext-light dark:text-subtext-dark mb-2">
              Your current role{roles.length > 1 ? 's' : ''}:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {roles.map((role, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm font-medium"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3 pt-4">
          <button
            onClick={handleGoBack}
            className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-text-light dark:text-text-dark rounded-md font-medium transition-colors"
          >
            Go Back
          </button>

          <button
            onClick={handleGoToDashboard}
            className="w-full px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-md font-medium transition-colors"
          >
            Go to Dashboard
          </button>

          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium transition-colors"
          >
            Logout
          </button>
        </div>

        <p className="text-xs text-subtext-light dark:text-subtext-dark pt-4">
          If you believe you should have access to this page, please contact your system administrator.
        </p>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
