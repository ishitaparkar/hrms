import React from 'react';
import './PermissionError.css';

/**
 * PermissionError Component
 * 
 * Displays user-friendly error messages for authorization failures (403 Forbidden).
 * Shows detailed information about required permissions, roles, and department scope.
 */
const PermissionError = ({ error, onClose }) => {
  if (!error) return null;

  // Extract error details from the response
  const {
    detail = 'You do not have permission to perform this action.',
    message,
    required_roles,
    required_permissions,
    user_roles,
    user_department,
    error_type
  } = error;

  // Determine if this is a permission error
  const isPermissionError = error_type === 'PermissionDenied' || 
                           error.status === 403 || 
                           error.status_code === 403;

  if (!isPermissionError) return null;

  return (
    <div className="permission-error-overlay" onClick={onClose}>
      <div className="permission-error-modal" onClick={(e) => e.stopPropagation()}>
        <div className="permission-error-header">
          <div className="permission-error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#dc3545" strokeWidth="2"/>
              <path d="M12 8V12" stroke="#dc3545" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="16" r="1" fill="#dc3545"/>
            </svg>
          </div>
          <h2>Access Denied</h2>
          <button className="permission-error-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="permission-error-body">
          <p className="permission-error-message">
            {message || detail}
          </p>

          {user_roles && user_roles.length > 0 && (
            <div className="permission-error-section">
              <h3>Your Current Role(s):</h3>
              <div className="permission-error-badges">
                {user_roles.map((role, index) => (
                  <span key={index} className="permission-badge user-role">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}

          {required_roles && required_roles.length > 0 && (
            <div className="permission-error-section">
              <h3>Required Role(s):</h3>
              <div className="permission-error-badges">
                {required_roles.map((role, index) => (
                  <span key={index} className="permission-badge required-role">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}

          {required_permissions && required_permissions.length > 0 && (
            <div className="permission-error-section">
              <h3>Required Permission(s):</h3>
              <ul className="permission-error-list">
                {required_permissions.map((permission, index) => (
                  <li key={index}>{permission}</li>
                ))}
              </ul>
            </div>
          )}

          {user_department && (
            <div className="permission-error-section">
              <h3>Your Department:</h3>
              <p className="permission-error-department">{user_department}</p>
            </div>
          )}

          <div className="permission-error-help">
            <p>
              If you believe you should have access to this resource, please contact your system administrator 
              or HR department to request the appropriate permissions.
            </p>
          </div>
        </div>

        <div className="permission-error-footer">
          <button className="permission-error-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionError;
