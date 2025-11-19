import { useState, useCallback } from 'react';

/**
 * Custom hook for handling permission errors from API responses.
 * 
 * Usage:
 * const { permissionError, handleApiError, clearPermissionError } = usePermissionError();
 * 
 * // In your API call catch block:
 * .catch(error => handleApiError(error));
 * 
 * // In your component JSX:
 * <PermissionError error={permissionError} onClose={clearPermissionError} />
 */
const usePermissionError = () => {
  const [permissionError, setPermissionError] = useState(null);

  /**
   * Handle API errors and extract permission error details
   */
  const handleApiError = useCallback((error) => {
    // Check if this is a 403 Forbidden error
    if (error.response && error.response.status === 403) {
      const errorData = error.response.data;
      
      // Set the permission error with all available details
      setPermissionError({
        status: 403,
        status_code: 403,
        detail: errorData.detail || 'You do not have permission to perform this action.',
        message: errorData.message,
        error_type: errorData.error_type || 'PermissionDenied',
        required_roles: errorData.required_roles,
        required_permissions: errorData.required_permissions,
        user_roles: errorData.user_roles,
        user_department: errorData.user_department,
      });
      
      return true; // Indicates this was a permission error
    }
    
    return false; // Not a permission error
  }, []);

  /**
   * Clear the current permission error
   */
  const clearPermissionError = useCallback(() => {
    setPermissionError(null);
  }, []);

  /**
   * Check if there is an active permission error
   */
  const hasPermissionError = permissionError !== null;

  return {
    permissionError,
    handleApiError,
    clearPermissionError,
    hasPermissionError,
  };
};

export default usePermissionError;
