import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import logoImage from '../assets/logo.png';
import { usePermission } from '../contexts/PermissionContext';
import SidebarProfile from './SidebarProfile';

const Sidebar = () => {
  const [isEmployeeOpen, setIsEmployeeOpen] = useState(true);
  const [isMySpaceOpen, setIsMySpaceOpen] = useState(true);
  const navigate = useNavigate();
  const { hasRole, clearAuthData } = usePermission();

  // --- INTERNAL STYLES FOR SCROLLBAR ---
  // This injects the scrollbar styling directly without an external CSS file
  const scrollbarStyles = `
    .custom-scroll::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scroll::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scroll::-webkit-scrollbar-thumb {
      background-color: #f3f4f6;
      border-radius: 10px;
    }
    .custom-scroll:hover::-webkit-scrollbar-thumb {
      background-color: #d1d5db;
    }
  `;

  // Active Link Styling
  const activeStyle = {
    backgroundColor: '#EFF6FF', // Light Blue
    color: '#2563EB',           // Blue Text
    fontWeight: '600',
  };

  const navLinkClass = "flex items-center px-4 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 mb-1";
  const subNavLinkClass = "flex items-center px-4 py-2 text-sm font-medium text-gray-500 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 ml-2";

  const handleLogout = () => {
    clearAuthData();
    navigate('/');
  };

  // Permission Logic
  const isSuperAdmin = hasRole('Super Admin');
  const isHRManager = hasRole('HR Manager');
  const isEmployee = hasRole('Employee');
  
  const canViewEmployees = isSuperAdmin || isHRManager || isEmployee;
  const canViewRecruitment = isSuperAdmin || isHRManager || isEmployee;
  const canViewAnnouncements = true;
  const canViewResignation = isSuperAdmin || isHRManager || isEmployee;
  
  const canManageRoles = isSuperAdmin;
  const canViewAuditLogs = isSuperAdmin;
  const canViewSettings = isSuperAdmin;

  return (
    <aside className="w-64 bg-white flex flex-col h-screen shadow-xl border-r border-gray-100 font-sans z-50">
      {/* Inject Scrollbar CSS */}
      <style>{scrollbarStyles}</style>

      {/* 1. FIXED HEADER (Logo) */}
      <div className="p-6 flex items-center space-x-3 flex-shrink-0 bg-white">
        <img src={logoImage} alt="Logo" className="w-9 h-9 object-contain" />
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">University HRMS</h1>
      </div>

      {/* 2. SCROLLABLE NAVIGATION AREA */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto custom-scroll">
        
        {/* Dashboard */}
        <NavLink to="/dashboard" className={navLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>
          <span className="material-icons mr-3 text-[20px]">dashboard</span> Dashboard
        </NavLink>

        {/* My Space Dropdown */}
        {canViewEmployees && (
          <div className="mb-1">
            <button 
              onClick={() => setIsMySpaceOpen(!isMySpaceOpen)} 
              className={`${navLinkClass} w-full justify-between`}
            >
              <div className="flex items-center">
                <span className="material-icons mr-3 text-[20px]">person</span> 
                My Space
              </div>
              <span className="material-icons text-lg text-gray-400 transition-transform duration-200" style={{ transform: isMySpaceOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
            </button>
            
            {isMySpaceOpen && (
              <div className="pl-7 space-y-1 border-l-2 border-gray-100 ml-4 my-1">
                <NavLink to="/profile" className={subNavLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>Profile</NavLink>
                <NavLink to="/my-attendance" className={subNavLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>Attendance</NavLink>
                <NavLink to="/my-leave" className={subNavLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>Leaves</NavLink>
                <NavLink to="/time-tracker" className={subNavLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>Time Tracker</NavLink>
                <NavLink to="/employee-assets" className={subNavLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>Assets</NavLink>
                <NavLink to="/my-performance" className={subNavLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>Performance</NavLink>
                <NavLink to="/payroll" className={subNavLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>Payroll</NavLink>
              </div>
            )}
          </div>
        )}

        {/* Core Links */}
        <NavLink to="/my-team" className={navLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>
          <span className="material-icons mr-3 text-[20px]">groups</span> My Team
        </NavLink>

        {canViewRecruitment && (
          <NavLink to="/recruitment" className={navLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>
            <span className="material-icons mr-3 text-[20px]">work</span> Job Opportunities
          </NavLink>
        )}

        {canViewAnnouncements && (
          <NavLink to="/announcement" className={navLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>
            <span className="material-icons mr-3 text-[20px]">campaign</span> Company News
          </NavLink>
        )}

        {canViewResignation && (
          <NavLink to="/resignation" className={navLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>
            <span className="material-icons mr-3 text-[20px]">assignment_return</span> Resignation
          </NavLink>
        )}

        {/* HR & Admin Management Tools */}
        {(isSuperAdmin || isHRManager) && (
          <>
            <div className="my-2 mx-4 border-t border-gray-100"></div> {/* Subtle Separator */}

            <NavLink to="/requirement-raising" className={navLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>
              <span className="material-icons mr-3 text-[20px]">trending_up</span> Requirement Raising
            </NavLink>

            <NavLink to="/notes-approvals" className={navLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>
              <span className="material-icons mr-3 text-[20px]">approval</span> Notes & Approvals
            </NavLink>

            <div className="mb-1">
              <button 
                onClick={() => setIsEmployeeOpen(!isEmployeeOpen)} 
                className={`${navLinkClass} w-full justify-between`}
              >
                <div className="flex items-center">
                  <span className="material-icons mr-3 text-[20px]">business_center</span> 
                  Employee Mgmt
                </div>
                <span className="material-icons text-lg text-gray-400 transition-transform duration-200" style={{ transform: isEmployeeOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
              </button>
              {isEmployeeOpen && (
                <div className="pl-7 space-y-1 border-l-2 border-gray-100 ml-4 my-1">
                  <NavLink to="/employees" className={subNavLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>Directory</NavLink>
                  <NavLink to="/add-employee" className={subNavLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>Add Staff</NavLink>
                </div>
              )}
            </div>
          </>
        )}

        {/* Super Admin Settings (Scrollable) */}
        {(canManageRoles || canViewAuditLogs || canViewSettings) && (
          <>
            <div className="my-2 mx-4 border-t border-gray-100"></div>

            {canManageRoles && (
              <NavLink to="/role-management" className={navLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>
                <span className="material-icons mr-3 text-[20px]">admin_panel_settings</span> Role Mgmt
              </NavLink>
            )}
            {canViewAuditLogs && (
              <NavLink to="/audit-logs" className={navLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>
                <span className="material-icons mr-3 text-[20px]">history</span> Audit Logs
              </NavLink>
            )}
            {canViewSettings && (
              <NavLink to="/settings" className={navLinkClass} style={({ isActive }) => isActive ? activeStyle : undefined}>
                <span className="material-icons mr-3 text-[20px]">settings</span> Settings
              </NavLink>
            )}
          </>
        )}
      </nav>

      {/* 3. FIXED BOTTOM SECTION (Profile & Logout) */}
      <div className="mt-auto p-4 border-t border-gray-100 bg-white">
        
        <SidebarProfile />

        <button 
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2.5 mt-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group"
        >
          <span className="material-icons mr-3 text-[20px] group-hover:translate-x-1 transition-transform">logout</span> 
          Logout
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;