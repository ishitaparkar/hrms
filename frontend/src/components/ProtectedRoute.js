import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { usePermission } from '../contexts/PermissionContext';

/**
 * ProtectedRoute component acts as a gatekeeper for protected routes.
 * 
 * It checks:
 * 1. If the user is authenticated (has a token)
 * 2. If user needs to change password on first login
 * 3. If requiredRole is specified, checks if user has that role
 * 4. If requiredPermission is specified, checks if user has that permission
 * 
 * Props:
 * - requiredRole: (optional) Role name that user must have to access the route
 * - requiredPermission: (optional) Permission that user must have to access the route
 */
const ProtectedRoute = ({ requiredRole, requiredPermission }) => {
  const token = localStorage.getItem('authToken');
  const location = useLocation();
  const { hasRole, hasPermission, loading, userData } = usePermission();

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/" />;
  }

  // Show loading state while permissions are being fetched
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Check if user needs to change password on first login
  // Allow access only to the password change page if password change is required
  if (userData.requiresPasswordChange && location.pathname !== '/first-login-password-change') {
    return <Navigate to="/first-login-password-change" replace />;
  }

  // Role-based access control
  const isSuperAdmin = hasRole('Super Admin');
  const isHRManager = hasRole('HR Manager');
  const isEmployee = hasRole('Employee');
  
  if (isSuperAdmin) {
    // Super Admin has access to everything
    return <Outlet />;
  }

  // Check role requirement (strict check)
  if (requiredRole) {
    if (requiredRole === 'Super Admin' && !isSuperAdmin) {
      // Only Super Admin can access Super Admin routes
      return <Navigate to="/unauthorized" />;
    }
    if (requiredRole === 'HR Manager' && !isHRManager && !isSuperAdmin) {
      // Only HR Manager and Super Admin can access HR Manager routes
      return <Navigate to="/unauthorized" />;
    }
    if (!hasRole(requiredRole)) {
      return <Navigate to="/unauthorized" />;
    }
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    // Allow HR Manager to access HR-related permissions
    if (isHRManager && (
      requiredPermission.includes('manage_employees') ||
      requiredPermission.includes('view_all') ||
      requiredPermission.includes('approve')
    )) {
      return <Outlet />;
    }
    
    // Allow Employee to access self-service permissions
    if (isEmployee && (
      requiredPermission.includes('view_own') ||
      requiredPermission.includes('manage_own') ||
      requiredPermission.includes('submit')
    )) {
      return <Outlet />;
    }
    
    return <Navigate to="/unauthorized" />;
  }

  // User is authenticated and has required role/permission
  return <Outlet />;
};

export default ProtectedRoute;