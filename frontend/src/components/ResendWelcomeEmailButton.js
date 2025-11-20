import React, { useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

/**
 * ResendWelcomeEmailButton Component
 * 
 * Allows Super Admins to resend the welcome email to an employee.
 * Useful when employees didn't receive the original email or need to restart onboarding.
 * 
 * @param {number} employeeId - The ID of the employee
 * @param {string} employeeEmail - The email address of the employee
 * @param {string} employeeName - The name of the employee
 * @param {function} onSuccess - Optional callback when email is sent successfully
 * @param {function} onError - Optional callback when email sending fails
 */
const ResendWelcomeEmailButton = ({
  employeeId,
  employeeEmail,
  employeeName,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const handleResend = async () => {
    // Confirm action
    const confirmed = window.confirm(
      `Are you sure you want to resend the welcome email to ${employeeName} (${employeeEmail})?`
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.post(
        `http://127.0.0.1:8000/api/auth/resend-welcome-email/${employeeId}/`,
        {},
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        const successMessage = `Welcome email sent successfully to ${employeeEmail}`;
        setMessage(successMessage);
        setMessageType('success');

        // Call success callback if provided
        if (onSuccess) {
          onSuccess(response.data);
        }

        // Clear message after 5 seconds
        setTimeout(() => {
          setMessage('');
          setMessageType('');
        }, 5000);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message ||
        'Failed to send email';

      setMessage(errorMessage);
      setMessageType('error');

      // Call error callback if provided
      if (onError) {
        onError(error);
      }

      // Clear message after 7 seconds
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 7000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-block">
      <button
        onClick={handleResend}
        disabled={loading}
        className={`
          px-4 py-2 rounded-md text-sm font-medium
          transition-colors duration-200
          ${
            loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
          }
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `}
        title="Resend welcome email to employee"
      >
        {loading ? (
          <span className="flex items-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Sending...
          </span>
        ) : (
          <span className="flex items-center">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Resend Email
          </span>
        )}
      </button>

      {/* Message display */}
      {message && (
        <div
          className={`
            mt-2 p-3 rounded-md text-sm
            ${
              messageType === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }
          `}
        >
          <div className="flex items-start">
            {messageType === 'success' ? (
              <svg
                className="w-5 h-5 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span>{message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

ResendWelcomeEmailButton.propTypes = {
  employeeId: PropTypes.number.isRequired,
  employeeEmail: PropTypes.string.isRequired,
  employeeName: PropTypes.string.isRequired,
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
};

export default ResendWelcomeEmailButton;
