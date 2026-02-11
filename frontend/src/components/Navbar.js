import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { usePermission } from '../contexts/PermissionContext';
import logoImage from '../assets/logo_main.jpg';

const Navbar = () => {
  const navigate = useNavigate();
  const { clearAuthData, roles, hasRole } = usePermission();

  // Style for active NavLink
  const activeLinkStyle = {
    color: '#1173d4', // primary color
    fontWeight: '500',
  };

  // Handle logout
  const handleLogout = (e) => {
    e.preventDefault();
    clearAuthData();
    navigate('/');
  };

  // Get primary role for display (highest priority role)
  const getPrimaryRole = () => {
    if (hasRole('Super Admin')) return 'Super Admin';
    if (hasRole('HR Manager')) return 'HR Manager';
    if (hasRole('Department Head')) return 'Department Head';
    if (hasRole('Employee')) return 'Employee';
    return null;
  };

  const primaryRole = getPrimaryRole();

  // Helper function to get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Super Admin':
        return 'bg-purple-100 text-purple-800';
      case 'HR Manager':
        return 'bg-blue-100 text-blue-800';
      case 'Department Head':
        return 'bg-green-100 text-green-800';
      case 'Employee':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 dark:border-gray-700 px-10 py-3 bg-white dark:bg-background-dark">
      <div className="flex items-center gap-4 text-[#0d141b] dark:text-white">
        <div className="size-8 flex items-center justify-center">
          <img src={logoImage} alt="University HRMS Logo" className="w-full h-full object-contain" />
        </div>
        <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">University HRMS</h2>
      </div>
      <div className="flex flex-1 justify-end gap-8">
        <nav className="flex items-center gap-9 text-sm font-medium leading-normal" aria-label="Secondary navigation">
          <NavLink
            to="/dashboard"
            style={({ isActive }) => isActive ? activeLinkStyle : undefined}
            aria-current={({ isActive }) => isActive ? "page" : undefined}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/employees"
            style={({ isActive }) => isActive ? activeLinkStyle : undefined}
            aria-current={({ isActive }) => isActive ? "page" : undefined}
          >
            Staff Directory
          </NavLink>
          <button
            onClick={handleLogout}
            className="hover:text-primary cursor-pointer bg-transparent border-0 text-sm font-medium"
            aria-label="Logout from application"
          >
            Logout
          </button>
        </nav>
        <div className="flex items-center gap-3">
          {primaryRole && (
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(primaryRole)}`}
              role="status"
              aria-label={`Current role: ${primaryRole}`}
            >
              {primaryRole}
            </span>
          )}
          <div
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
            style={{ backgroundImage: 'url("https://randomuser.me/api/portraits/men/75.jpg")' }}
            role="img"
            aria-label="User profile picture"
          ></div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;