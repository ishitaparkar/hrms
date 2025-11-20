import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import onboardingService from '../services/onboardingService';

const PhoneAuthenticationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);

  // Handle URL parameters (e.g., from email link)
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }

    // Clear any existing setup tokens when starting fresh
    onboardingService.clearOnboardingData();
  }, [searchParams]);

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone number validation (basic check for country code)
  const validatePhoneNumber = (phone) => {
    // Must start with + and have 10-15 digits after country code
    // Allow spaces and hyphens for formatting
    const phoneRegex = /^\+\d{1,3}[\s-]?\d{3,15}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    // Validate email
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number with country code (e.g., +919876543210)');
      return;
    }

    setIsLoading(true);

    try {
      const response = await onboardingService.verifyPhone(email, phoneNumber);

      console.log('Phone authentication successful:', response);

      if (response.success) {
        // Store onboarding data
        onboardingService.storeOnboardingData({
          authToken: response.auth_token,
          employeeData: response.employee
        });

        // Navigate to account setup page
        navigate('/account-setup');
      }

    } catch (err) {
      console.error('Phone authentication failed:', err);

      setError(err.message || 'Authentication failed. Please try again.');

      // Update attempts remaining if provided
      if (err.attemptsRemaining !== undefined) {
        setAttemptsRemaining(err.attemptsRemaining);
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
            Verify Your Identity
          </h2>
          <p className="mt-2 text-sm text-subtext-light dark:text-subtext-dark">
            Please enter your email address and phone number to verify your identity and activate your account.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {attemptsRemaining !== null && attemptsRemaining === 0 && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
              <strong>Account Locked:</strong> Your account has been temporarily locked due to multiple failed attempts.
              Please contact HR for assistance.
            </div>
          )}

          {attemptsRemaining !== null && attemptsRemaining > 0 && (
            <div className="p-3 bg-yellow-100 text-yellow-700 rounded-md text-sm">
              <strong>Attempts Remaining:</strong> {attemptsRemaining}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-subtext-light dark:text-subtext-dark">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="your.email@example.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-subtext-light dark:text-subtext-dark">
                Phone Number
              </label>
              <div className="mt-1">
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="+91 9876543210"
                  disabled={isLoading}
                />
              </div>
              <p className="mt-1 text-xs text-subtext-light dark:text-subtext-dark">
                Include country code with space (e.g., +91 9876543210, +1 4155552671)
              </p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || (attemptsRemaining !== null && attemptsRemaining === 0)}
              className="w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Verify Identity'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-subtext-light dark:text-subtext-dark">
              Need help?{' '}
              <a
                href="mailto:hr@example.com"
                className="font-medium text-primary hover:text-blue-600"
              >
                Contact HR
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PhoneAuthenticationPage;
