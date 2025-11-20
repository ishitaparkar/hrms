import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import onboardingService from '../services/onboardingService';
import PasswordInput from '../components/ui/PasswordInput';

const PasswordSetupPage = () => {
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    // Check if user has completed previous steps
    const authToken = localStorage.getItem('setupAuthToken');
    const username = localStorage.getItem('setupUsername');

    if (!authToken || !username) {
      // Redirect to phone auth if no token or username
      navigate('/phone-auth');
      return;
    }
  }, [navigate]);

  // Real-time password validation
  const validatePassword = (password) => {
    const errors = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*)');
    }

    return errors;
  };

  // Update validation errors when password changes
  useEffect(() => {
    if (password) {
      const errors = validatePassword(password);
      setValidationErrors(errors);
    } else {
      setValidationErrors([]);
    }
  }, [password]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});

    // Validate passwords match
    if (password !== confirmPassword) {
      setErrors({ confirm_password: ['Passwords do not match'] });
      return;
    }

    // Validate password strength
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setErrors({ password: passwordErrors });
      return;
    }

    setIsLoading(true);

    try {
      const authToken = localStorage.getItem('setupAuthToken');
      const username = localStorage.getItem('setupUsername');

      const response = await onboardingService.completeSetup(authToken, username, password, confirmPassword);

      console.log('Account setup completed:', response);

      if (response.success) {
        // Store the authentication token (use 'authToken' to match the rest of the app)
        localStorage.setItem('authToken', response.token);

        // Store user data
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Store roles and permissions for permission context
        if (response.roles) {
          localStorage.setItem('userRoles', JSON.stringify(response.roles));
        }
        if (response.permissions) {
          localStorage.setItem('userPermissions', JSON.stringify(response.permissions));
        }

        // Clear setup-related data
        onboardingService.clearOnboardingData();

        // Redirect to dashboard
        navigate('/dashboard');
      }

    } catch (err) {
      console.error('Account setup failed:', err);

      // Handle token expiration or invalid token
      if (err.status === 401) {
        setErrors({
          general: ['Your session has expired. Please start the verification process again.']
        });
        // Clear expired tokens
        onboardingService.clearOnboardingData();
        // Redirect to phone auth after a delay
        setTimeout(() => {
          navigate('/phone-auth');
        }, 3000);
      } else if (err.errors) {
        setErrors(err.errors);
      } else {
        setErrors({ general: [err.message || 'Account setup failed. Please try again.'] });
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
            Create Your Password
          </h2>
          <p className="mt-2 text-sm text-subtext-light dark:text-subtext-dark">
            Choose a strong password to secure your account.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {errors.general.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          )}

          <div className="space-y-4">
            {/* Password Input */}
            <PasswordInput
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              label="Password"
              placeholder="Enter your password"
              required
              disabled={isLoading}
              showStrengthIndicator={true}
              error={errors.password ? errors.password.join(', ') : ''}
            />

            {/* Real-time validation errors */}
            {validationErrors.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-medium text-subtext-light dark:text-subtext-dark">
                  Password requirements:
                </p>
                <ul className="text-xs space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-red-500 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Confirm Password Input */}
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              label="Confirm Password"
              placeholder="Re-enter your password"
              required
              disabled={isLoading}
              error={errors.confirm_password ? errors.confirm_password.join(', ') : ''}
            />

            {/* Password match indicator */}
            {password && confirmPassword && (
              <div className="mt-2">
                {password === confirmPassword ? (
                  <p className="text-xs text-green-500 flex items-center">
                    <span className="material-icons text-sm mr-1">check_circle</span>
                    Passwords match
                  </p>
                ) : (
                  <p className="text-xs text-red-500 flex items-center">
                    <span className="material-icons text-sm mr-1">cancel</span>
                    Passwords do not match
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Password Requirements Info */}
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-md">
            <p className="text-xs font-medium text-subtext-light dark:text-subtext-dark mb-2">
              Your password must contain:
            </p>
            <ul className="text-xs text-subtext-light dark:text-subtext-dark space-y-1">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>At least 8 characters</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>At least one uppercase letter (A-Z)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>At least one lowercase letter (a-z)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>At least one number (0-9)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>At least one special character (!@#$%^&*)</span>
              </li>
            </ul>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || validationErrors.length > 0 || !password || !confirmPassword}
              className="w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Setting up your account...' : 'Complete Setup'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-subtext-light dark:text-subtext-dark">
              By completing setup, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordSetupPage;
