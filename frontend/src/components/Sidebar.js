import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import logoImage from '../assets/logo.png';
import { usePermission } from '../contexts/PermissionContext';

const Sidebar = () => {
  const [isEmployeeOpen, setIsEmployeeOpen] = useState(true);
  const [isMySpaceOpen, setIsMySpaceOpen] = useState(true);
  const navigate = useNavigate();
  const { hasRole, clearAuthData } = usePermission();

  const activeStyle = {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    color: '#3B82F6',
    fontWeight: '500',
  };

  const navLinkClass = "flex items-center px-4 py-2 text-sm font-medium text-subtext-light dark:text-subtext-dark rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700";
  const subNavLinkClass = "flex items-center px-4 py-2 text-sm font-medium text-subtext-light dark:text-subtext-dark hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg";

  const handleLogout = () => {
    clearAuthData();
    console.log("Logged out and token cleared.");
    navigate('/');
  };

  // Permission checks for menu items
  const isSuperAdmin = hasRole('Super Admin');
  const isHRManager = hasRole('HR Manager');
  const isEmployee = hasRole('Employee');
  
  // Access control based on roles
  const canViewEmployees = isSuperAdmin || isHRManager || isEmployee;
  const canViewPayroll = isSuperAdmin || isHRManager || isEmployee; // Employee can view own
  const canViewRecruitment = isSuperAdmin || isHRManager || isEmployee; // Employee can apply
  const canViewPerformance = isSuperAdmin || isHRManager || isEmployee; // Employee can view own
  const canViewAnnouncements = true; // All roles can view
  const canViewAssets = isSuperAdmin || isHRManager || isEmployee; // Employee can view own
  const canViewResignation = isSuperAdmin || isHRManager || isEmployee; // Employee can submit own
  const canViewAttendance = isSuperAdmin || isHRManager || isEmployee; // Employee can view own
  const canViewLeaves = isSuperAdmin || isHRManager || isEmployee; // Employee can view own
  
  // Super Admin ONLY features
  const canManageRoles = isSuperAdmin;
  const canViewAuditLogs = isSuperAdmin;
  const canViewSettings = isSuperAdmin;
  
  // HR Management features (Super Admin + HR Manager)
  const canManageAllEmployees = isSuperAdmin || isHRManager;

  return (
    <aside className="w-64 bg-card-light dark:bg-card-dark flex-col hidden lg:flex shadow-lg overflow-y-auto">
      <div className="p-6 flex items-center space-x-3 border-b border-border-light dark:border-border-dark">
        <img 
          src={logoImage} 
          alt="University HRMS Logo" 
          className="w-10 h-10"
        />
        <h1 className="text-xl font-bold text-text-light dark:text-text-dark">University HRMS</h1>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1">
        {/* Dashboard */}
        <NavLink to="/dashboard" className={navLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>
          <span className="material-icons mr-3">dashboard</span> Dashboard
        </NavLink>

        {/* My Space dropdown - for all users */}
        {canViewEmployees && (
          <div>
            <button 
              onClick={() => setIsMySpaceOpen(!isMySpaceOpen)} 
              className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-subtext-light dark:text-subtext-dark rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <div className="flex items-center">
                <span className="material-icons mr-3">person</span> 
                My Space
              </div>
              <span className="material-icons transition-transform duration-200" style={{ transform: isMySpaceOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
            </button>
            {isMySpaceOpen && (
              <div className="pl-7 mt-1 space-y-1">
                <NavLink to="/profile" className={subNavLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>
                  <span className="material-icons mr-2 text-sm">account_circle</span>
                  Profile
                </NavLink>
                
                <NavLink to="/my-attendance" className={subNavLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>
                  <span className="material-icons mr-2 text-sm">event_available</span>
                  Attendance
                </NavLink>
                
                <NavLink to="/my-leave" className={subNavLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>
                  <span className="material-icons mr-2 text-sm">event_busy</span>
                  Leaves
                </NavLink>
                
                <NavLink to="/time-tracker" className={subNavLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>
                  <span className="material-icons mr-2 text-sm">schedule</span>
                  Time Tracker
                </NavLink>
                
                <NavLink to="/employee-assets" className={subNavLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>
                  <span className="material-icons mr-2 text-sm">inventory_2</span>
                  Assets
                </NavLink>
                
                <NavLink to="/my-performance" className={subNavLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>
                  <span className="material-icons mr-2 text-sm">trending_up</span>
                  Performance
                </NavLink>
                
                <NavLink to="/payroll" className={subNavLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>
                  <span className="material-icons mr-2 text-sm">payments</span>
                  Payroll
                </NavLink>
              </div>
            )}
          </div>
        )}

        {/* My Team */}
        <NavLink to="/my-team" className={navLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>
          <span className="material-icons mr-3">groups</span> My Team
        </NavLink>

        {/* Job Opportunities */}
        {canViewRecruitment && (
          <NavLink to="/recruitment" className={navLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>
            <span className="material-icons mr-3">work</span> Job Opportunities
          </NavLink>
        )}

        {/* Company News */}
        {canViewAnnouncements && (
          <NavLink to="/announcement" className={navLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>
            <span className="material-icons mr-3">campaign</span> Company News
          </NavLink>
        )}

        {/* Resignation */}
        {canViewResignation && (
          <NavLink to="/resignation" className={navLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>
            <span className="material-icons mr-3">assignment_return</span> Resignation
          </NavLink>
        )}

        {/* HR Manager and Super Admin specific items */}
        {(isSuperAdmin || isHRManager) && (
          <>
            <NavLink to="/requirement-raising" className={navLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>
              <span className="material-icons mr-3">trending_up</span> Requirement Raising
            </NavLink>

            <NavLink to="/notes-approvals" className={navLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>
              <span className="material-icons mr-3">approval</span> Notes & Approvals
            </NavLink>

            {/* Employee Management dropdown - for HR Manager and Super Admin */}
            <div>
              <button 
                onClick={() => setIsEmployeeOpen(!isEmployeeOpen)} 
                className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-subtext-light dark:text-subtext-dark rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <div className="flex items-center">
                  <span className="material-icons mr-3">business_center</span> 
                  Employee Management
                </div>
                <span className="material-icons transition-transform duration-200" style={{ transform: isEmployeeOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
              </button>
              {isEmployeeOpen && (
                <div className="pl-7 mt-1 space-y-1">
                  <NavLink to="/employees" className={subNavLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>
                    Staff Directory
                  </NavLink>
                  <NavLink to="/add-employee" className={subNavLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>
                    Add New Staff
                  </NavLink>
                </div>
              )}
            </div>
          </>
        )}
      </nav>

      <div className="p-4 mt-auto border-t border-border-light dark:border-border-dark space-y-1">
        {canManageRoles && (
          <NavLink to="/role-management" className={navLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>
            <span className="material-icons mr-3">admin_panel_settings</span> Role Management
          </NavLink>
        )}
        {canViewAuditLogs && (
          <NavLink to="/audit-logs" className={navLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>
            <span className="material-icons mr-3">history</span> Audit Logs
          </NavLink>
        )}
        {canViewSettings && (
          <NavLink to="/settings" className={navLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>
            <span className="material-icons mr-3">settings</span> Settings
          </NavLink>
        )}
        <button 
          onClick={handleLogout}
          className={`${navLinkClass} w-full text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20`}
        >
          <span className="material-icons mr-3">logout</span> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;