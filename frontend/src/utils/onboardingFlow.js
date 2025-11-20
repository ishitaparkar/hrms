/**
 * Utility functions for managing the employee onboarding flow
 */

/**
 * Get the current step in the onboarding flow based on stored data
 * @returns {string} The current step: 'phone-auth', 'account-setup', 'password-setup', or 'complete'
 */
export const getCurrentOnboardingStep = () => {
  const authToken = localStorage.getItem('setupAuthToken');
  const employeeData = localStorage.getItem('setupEmployeeData');
  const username = localStorage.getItem('setupUsername');
  const regularAuthToken = localStorage.getItem('authToken') || localStorage.getItem('token');

  // If user is already authenticated, they've completed onboarding
  if (regularAuthToken) {
    return 'complete';
  }

  // If they have username, they're on password setup
  if (authToken && employeeData && username) {
    return 'password-setup';
  }

  // If they have auth token and employee data, they're on account setup
  if (authToken && employeeData) {
    return 'account-setup';
  }

  // Otherwise, they need to start with phone auth
  return 'phone-auth';
};

/**
 * Clear all onboarding-related data from localStorage
 */
export const clearOnboardingData = () => {
  localStorage.removeItem('setupAuthToken');
  localStorage.removeItem('setupEmployeeData');
  localStorage.removeItem('setupUsername');
};

/**
 * Check if the user has a valid setup token
 * @returns {boolean} True if a valid setup token exists
 */
export const hasValidSetupToken = () => {
  const authToken = localStorage.getItem('setupAuthToken');
  return !!authToken;
};

/**
 * Get the next step in the onboarding flow
 * @param {string} currentStep - The current step
 * @returns {string} The next step path
 */
export const getNextOnboardingStep = (currentStep) => {
  const stepOrder = {
    'phone-auth': '/account-setup',
    'account-setup': '/password-setup',
    'password-setup': '/dashboard',
  };

  return stepOrder[currentStep] || '/phone-auth';
};

/**
 * Get the previous step in the onboarding flow
 * @param {string} currentStep - The current step
 * @returns {string} The previous step path
 */
export const getPreviousOnboardingStep = (currentStep) => {
  const stepOrder = {
    'account-setup': '/phone-auth',
    'password-setup': '/account-setup',
  };

  return stepOrder[currentStep] || '/phone-auth';
};

/**
 * Validate that the user can access a specific step
 * @param {string} step - The step to validate
 * @returns {boolean} True if the user can access this step
 */
export const canAccessStep = (step) => {
  const authToken = localStorage.getItem('setupAuthToken');
  const employeeData = localStorage.getItem('setupEmployeeData');
  const username = localStorage.getItem('setupUsername');

  switch (step) {
    case 'phone-auth':
      // Anyone can access phone auth
      return true;
    
    case 'account-setup':
      // Need auth token and employee data
      return !!(authToken && employeeData);
    
    case 'password-setup':
      // Need auth token, employee data, and username
      return !!(authToken && employeeData && username);
    
    default:
      return false;
  }
};

/**
 * Store setup authentication token
 * @param {string} token - The setup auth token
 */
export const setSetupAuthToken = (token) => {
  localStorage.setItem('setupAuthToken', token);
};

/**
 * Store employee data for the onboarding flow
 * @param {object} employeeData - The employee data object
 */
export const setSetupEmployeeData = (employeeData) => {
  localStorage.setItem('setupEmployeeData', JSON.stringify(employeeData));
};

/**
 * Store username for the onboarding flow
 * @param {string} username - The generated username
 */
export const setSetupUsername = (username) => {
  localStorage.setItem('setupUsername', username);
};

/**
 * Get stored employee data
 * @returns {object|null} The employee data or null if not found
 */
export const getSetupEmployeeData = () => {
  const data = localStorage.getItem('setupEmployeeData');
  try {
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Failed to parse employee data:', err);
    return null;
  }
};

/**
 * Get stored setup auth token
 * @returns {string|null} The setup auth token or null if not found
 */
export const getSetupAuthToken = () => {
  return localStorage.getItem('setupAuthToken');
};

/**
 * Get stored username
 * @returns {string|null} The username or null if not found
 */
export const getSetupUsername = () => {
  return localStorage.getItem('setupUsername');
};
