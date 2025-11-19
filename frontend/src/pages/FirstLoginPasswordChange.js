import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { usePermission } from '../contexts/PermissionContext';

const FirstLoginPasswordChange = () => {
  const navigate = useNavigate();
  const { refreshPermissions } = usePermission();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Password validation function
  const validatePassword = (password) => {
    const errors = {};
    
    if (password.length < 8) {
      errors.length = 'Password must be at least 8 characters long';
    }
    
    if (!/[a-zA-Z]/.test(password)) {
      errors.letters = 'Password must contain at least one letter';
    }
    
    if (!/[0-9]/.test(password)) {
      errors.numbers = 'Password must contain at least one number';
    }
    
    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setValidationErrors({});

    // Validate new password
    const passwordErrors = validatePassword(newPassword);
    
    if (Object.keys(passwordErrors).length > 0) {
      setValidationErrors(passwordErrors);
      return;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    // Check if new password is different from old password
    if (oldPassword === newPassword) {
      setError('New password must be different from the temporary password');
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await axios.post(
        'http://127.0.0.1:8000/api/auth/first-login-password-change/',
        {
          old_password: oldPassword,
          new_password: newPassword,
        },
        {
          headers: {
            'Authorization': `Token ${token}`,
          },
        }
      );

      console.log('Password changed successfully:', response.data);
      
      // Refresh permissions to update requiresPasswordChange flag
      await refreshPermissions();
      
      // Redirect to dashboard
      navigate('/dashboard');

    } catch (err) {
      console.error('Password change failed:', err.response);
      
      if (err.response && err.response.data) {
        if (err.response.data.old_password) {
          setError('The temporary password you entered is incorrect');
        } else if (err.response.data.new_password) {
          setError(err.response.data.new_password[0] || 'Invalid new password');
        } else if (err.response.data.error) {
          setError(err.response.data.error);
        } else {
          setError('Failed to change password. Please try again.');
        }
      } else {
        setError('Failed to change password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
      <div className="w-full max-w-md p-8 space-y-8 bg-card-light dark:bg-card-dark rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">
            Change Your Password
          </h2>
          <p className="mt-2 text-sm text-subtext-light dark:text-subtext-dark">
            For security reasons, you must change your temporary password before accessing the system.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="oldPassword" className="block text-sm font-medium text-subtext-light dark:text-subtext-dark">
                Temporary Password
              </label>
              <div className="mt-1">
                <input
                  id="oldPassword"
                  name="oldPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Enter your temporary password"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-subtext-light dark:text-subtext-dark">
                New Password
              </label>
              <div className="mt-1">
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Enter your new password"
                />
              </div>
              {validationErrors.length && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.length}</p>
              )}
              {validationErrors.letters && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.letters}</p>
              )}
              {validationErrors.numbers && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.numbers}</p>
              )}
              <p className="mt-1 text-xs text-subtext-light dark:text-subtext-dark">
                Password must be at least 8 characters and contain both letters and numbers
              </p>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-subtext-light dark:text-subtext-dark">
                Confirm New Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Confirm your new password"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-600 disabled:bg-gray-400"
            >
              {isLoading ? 'Changing Password...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FirstLoginPasswordChange;
