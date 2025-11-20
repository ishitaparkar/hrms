import axios from 'axios';

// API base URL - centralized configuration
// API base URL - centralized configuration
const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api') + '/auth';

/**
 * Onboarding Service
 * 
 * Provides API methods for the employee onboarding and authentication flow.
 * Includes error handling and retry logic for network resilience.
 */

/**
 * Verify phone number for employee authentication
 * 
 * @param {string} email - Employee's email address
 * @param {string} phoneNumber - Employee's phone number with country code
 * @returns {Promise<Object>} Response containing success status, auth token, and employee data
 * @throws {Error} If verification fails or network error occurs
 */
export const verifyPhone = async (email, phoneNumber) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/verify-phone/`, {
      email: email.trim(),
      phone_number: phoneNumber.trim(), // Keep formatting as entered
    });

    return response.data;
  } catch (error) {
    // Enhanced error handling
    if (error.response) {
      // Server responded with error status
      throw {
        message: error.response.data.error || 'Authentication failed. Please try again.',
        attemptsRemaining: error.response.data.attempts_remaining,
        status: error.response.status,
        data: error.response.data,
      };
    } else if (error.request) {
      // Request made but no response received
      throw {
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        status: 0,
      };
    } else {
      // Error in request setup
      throw {
        message: 'An unexpected error occurred. Please try again.',
        status: -1,
      };
    }
  }
};

/**
 * Generate username for employee account
 * 
 * @param {string} authToken - Temporary authentication token from phone verification
 * @returns {Promise<Object>} Response containing generated username and employee details
 * @throws {Error} If generation fails or token is invalid
 */
export const generateUsername = async (authToken) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/generate-username/`,
      {},
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    // Enhanced error handling
    if (error.response) {
      // Handle token expiration specifically
      if (error.response.status === 401) {
        throw {
          message: 'Your session has expired. Please start the verification process again.',
          status: 401,
          expired: true,
        };
      }

      throw {
        message: error.response.data.error || 'Failed to generate username. Please try again.',
        status: error.response.status,
        data: error.response.data,
      };
    } else if (error.request) {
      throw {
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        status: 0,
      };
    } else {
      throw {
        message: 'An unexpected error occurred. Please try again.',
        status: -1,
      };
    }
  }
};

/**
 * Complete account setup with username and password
 * 
 * @param {string} authToken - Temporary authentication token from phone verification
 * @param {string} username - Generated username for the account
 * @param {string} password - User's chosen password
 * @param {string} confirmPassword - Password confirmation
 * @returns {Promise<Object>} Response containing success status, user data, and auth token
 * @throws {Error} If setup fails or validation errors occur
 */
export const completeSetup = async (authToken, username, password, confirmPassword) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/complete-setup/`,
      {
        username: username,
        password: password,
        confirm_password: confirmPassword,
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    // Enhanced error handling
    if (error.response) {
      // Handle token expiration specifically
      if (error.response.status === 401) {
        throw {
          message: 'Your session has expired. Please start the verification process again.',
          status: 401,
          expired: true,
        };
      }

      // Handle validation errors
      if (error.response.status === 400 && error.response.data.errors) {
        throw {
          message: 'Please correct the validation errors.',
          status: 400,
          errors: error.response.data.errors,
          data: error.response.data,
        };
      }

      throw {
        message: error.response.data.error || 'Failed to complete account setup. Please try again.',
        status: error.response.status,
        data: error.response.data,
      };
    } else if (error.request) {
      throw {
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        status: 0,
      };
    } else {
      throw {
        message: 'An unexpected error occurred. Please try again.',
        status: -1,
      };
    }
  }
};

/**
 * Retry wrapper for API calls with exponential backoff
 * 
 * @param {Function} apiCall - The API function to retry
 * @param {number} maxRetries - Maximum number of retry attempts (default: 2)
 * @param {number} initialDelay - Initial delay in milliseconds (default: 1000)
 * @returns {Promise<any>} Result from the API call
 */
export const withRetry = async (apiCall, maxRetries = 2, initialDelay = 1000) => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx) except for 408 (timeout) and 429 (rate limit)
      if (error.status >= 400 && error.status < 500 && error.status !== 408 && error.status !== 429) {
        throw error;
      }

      // Don't retry if this was the last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = initialDelay * Math.pow(2, attempt);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
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
 * Store onboarding data in localStorage
 * 
 * @param {Object} data - Data to store
 * @param {string} data.authToken - Authentication token
 * @param {Object} data.employeeData - Employee details
 * @param {string} data.username - Generated username
 */
export const storeOnboardingData = ({ authToken, employeeData, username }) => {
  if (authToken) {
    localStorage.setItem('setupAuthToken', authToken);
  }
  if (employeeData) {
    localStorage.setItem('setupEmployeeData', JSON.stringify(employeeData));
  }
  if (username) {
    localStorage.setItem('setupUsername', username);
  }
};

/**
 * Retrieve onboarding data from localStorage
 * 
 * @returns {Object} Onboarding data
 */
export const getOnboardingData = () => {
  const authToken = localStorage.getItem('setupAuthToken');
  const employeeDataStr = localStorage.getItem('setupEmployeeData');
  const username = localStorage.getItem('setupUsername');

  return {
    authToken,
    employeeData: employeeDataStr ? JSON.parse(employeeDataStr) : null,
    username,
  };
};

export default {
  verifyPhone,
  generateUsername,
  completeSetup,
  withRetry,
  clearOnboardingData,
  storeOnboardingData,
  getOnboardingData,
};
