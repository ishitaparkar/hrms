import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Route guard for onboarding flow pages
 * Ensures users follow the correct sequence and have required tokens
 */
const OnboardingRouteGuard = ({ children, requiredStep }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const setupAuthToken = localStorage.getItem('setupAuthToken');
    const username = localStorage.getItem('setupUsername');
    const employeeData = localStorage.getItem('setupEmployeeData');
    const regularAuthToken = localStorage.getItem('authToken') || localStorage.getItem('token');

    // Define the required data for each step
    const stepRequirements = {
      'phone-auth': {
        // Phone auth is the entry point, no requirements
        // Allow access even if user is authenticated (they might be starting onboarding)
        required: [],
        redirectTo: null,
        allowAuthenticated: true,
      },
      'account-setup': {
        // Account setup requires auth token and employee data from phone auth
        required: ['authToken', 'employeeData'],
        redirectTo: '/phone-auth',
        allowAuthenticated: false,
      },
      'password-setup': {
        // Password setup requires auth token, employee data, and username from account setup
        required: ['authToken', 'employeeData', 'username'],
        redirectTo: '/phone-auth',
        allowAuthenticated: false,
      },
    };

    const requirements = stepRequirements[requiredStep];

    if (!requirements) {
      // Unknown step, allow access
      return;
    }

    // For phone-auth, always allow access (it's the entry point)
    if (requiredStep === 'phone-auth') {
      return;
    }

    // Check if user is already authenticated with a regular token
    // If so, they shouldn't be in the onboarding flow (except phone-auth)
    if (regularAuthToken && !requirements.allowAuthenticated) {
      console.log('OnboardingRouteGuard: User already authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
      return;
    }

    // Check if all required onboarding data is present
    const hasAuthToken = requirements.required.includes('authToken') ? !!setupAuthToken : true;
    const hasEmployeeData = requirements.required.includes('employeeData') ? !!employeeData : true;
    const hasUsername = requirements.required.includes('username') ? !!username : true;

    // If any required data is missing, redirect to the appropriate page
    if (!hasAuthToken || !hasEmployeeData || !hasUsername) {
      console.log(`OnboardingRouteGuard: Missing required data for ${requiredStep}, redirecting to ${requirements.redirectTo}`);
      
      if (requirements.redirectTo) {
        navigate(requirements.redirectTo, { replace: true });
      }
    }

  }, [navigate, requiredStep, location.pathname]);

  return <>{children}</>;
};

export default OnboardingRouteGuard;
