import React, { useState, useEffect } from 'react';
import { usePermission } from '../contexts/PermissionContext';
import usePageTitle from '../hooks/usePageTitle';
import DocumentsSection from '../components/profile/DocumentsSection';
import NotificationsPreferences from '../components/profile/NotificationsPreferences';

const ProfilePage = () => {
  const { roles, user } = usePermission();
  const [activeTab, setActiveTab] = useState('employee'); // Changed default to employee
  const [profileData, setProfileData] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Set page title for accessibility
  usePageTitle('My Profile');

  // Handle keyboard navigation for tabs
  const handleTabKeyDown = (e, tabName) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveTab(tabName);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const tabs = ['employee', 'account'];
      const currentIndex = tabs.indexOf(activeTab);
      let newIndex;
      
      if (e.key === 'ArrowLeft') {
        newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
      } else {
        newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
      }
      
      setActiveTab(tabs[newIndex]);
    }
  };

  // Fetch user profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        // Fetch user profile
        const profileResponse = await fetch('http://localhost:8000/api/auth/me/', {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (profileResponse.ok) {
          const data = await profileResponse.json();
          setProfileData(data);
          
          // If user has an employee record, fetch it
          if (data.employee_id) {
            const employeeResponse = await fetch(`http://localhost:8000/api/employees/${data.employee_id}/`, {
              headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (employeeResponse.ok) {
              const empData = await employeeResponse.json();
              setEmployeeData(empData);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);
  
  // Helper function to get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Super Admin':
        return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700';
      case 'HR Manager':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700';
      case 'Department Head':
        return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700';
      case 'Employee':
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Super Admin':
        return 'admin_panel_settings';
      case 'HR Manager':
        return 'manage_accounts';
      case 'Department Head':
        return 'supervisor_account';
      case 'Employee':
        return 'person';
      default:
        return 'person';
    }
  };

  // Get display name from employee data or user data
  const displayName = employeeData 
    ? `${employeeData.firstName} ${employeeData.lastName}`
    : profileData?.username || user?.username || 'User';
  
  const displayEmail = user?.email || profileData?.email || '';
  const displayImage = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName) + '&background=3b82f6&color=fff&size=128';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-subtext-light dark:text-subtext-dark">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-card-light dark:bg-card-dark p-6 border-b border-border-light dark:border-border-dark flex-shrink-0">
        <h1 className="text-3xl font-bold text-heading-light dark:text-heading-dark">My Profile</h1>
        <p className="text-sm text-subtext-light dark:text-subtext-dark mt-1">
          Manage your account settings and view your employee information
        </p>
      </header>

      <div className="p-4 md:p-8 space-y-6">
        {/* Profile Header Card */}
        <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-sm flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
          <img 
            className="w-24 h-24 rounded-full ring-4 ring-primary/20" 
            src={displayImage} 
            alt={displayName} 
          />
          <div className="flex-grow text-center md:text-left">
            <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">{displayName}</h2>
            <p className="text-subtext-light dark:text-subtext-dark">{displayEmail}</p>
            
            {/* Role Badges */}
            {roles && roles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                {roles.map((role, index) => (
                  <span 
                    key={index}
                    className={`px-3 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor(role)}`}
                  >
                    <span className="material-icons text-xs mr-1" style={{ fontSize: '12px', verticalAlign: 'middle' }}>
                      {getRoleIcon(role)}
                    </span>
                    {role}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabbed Interface */}
        <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-border-light dark:border-border-dark" role="tablist">
            <button
              onClick={() => setActiveTab('employee')}
              onKeyDown={(e) => handleTabKeyDown(e, 'employee')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'employee'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
              aria-selected={activeTab === 'employee'}
              role="tab"
              aria-controls="employee-tab-panel"
              id="employee-tab"
              tabIndex={activeTab === 'employee' ? 0 : -1}
            >
              <span className="material-icons text-sm mr-2" style={{ fontSize: '16px', verticalAlign: 'middle' }}>
                badge
              </span>
              Employee Profile
            </button>
            <button
              onClick={() => setActiveTab('account')}
              onKeyDown={(e) => handleTabKeyDown(e, 'account')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'account'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
              aria-selected={activeTab === 'account'}
              role="tab"
              aria-controls="account-tab-panel"
              id="account-tab"
              tabIndex={activeTab === 'account' ? 0 : -1}
            >
              <span className="material-icons text-sm mr-2" style={{ fontSize: '16px', verticalAlign: 'middle' }}>
                security
              </span>
              Account Settings
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <div
              role="tabpanel"
              id="employee-tab-panel"
              aria-labelledby="employee-tab"
              hidden={activeTab !== 'employee'}
            >
              {activeTab === 'employee' && <EmployeeProfileTab employeeData={employeeData} />}
            </div>
            <div
              role="tabpanel"
              id="account-tab-panel"
              aria-labelledby="account-tab"
              hidden={activeTab !== 'account'}
            >
              {activeTab === 'account' && <AccountSettingsTab />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Account Settings Tab Component
const AccountSettingsTab = () => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock login history for now - can be fetched from backend later
  const loginHistory = [
    { id: 1, ip: '103.48.19.122', location: 'Local', time: 'Today', status: 'Success' },
  ];

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    setPasswordError('');
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!passwordData.currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }

    if (!passwordData.newPassword) {
      setPasswordError('Please enter a new password');
      return;
    }

    const validationError = validatePassword(passwordData.newPassword);
    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Implement actual password change API call
      // const token = localStorage.getItem('authToken');
      // await axios.post('http://127.0.0.1:8000/api/auth/change-password/', passwordData, {
      //   headers: { 'Authorization': `Token ${token}` }
      // });
      
      setPasswordSuccess('Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => setPasswordSuccess(''), 5000);
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Change Password Card */}
        <div className="bg-background-light dark:bg-background-dark p-6 rounded-lg border border-border-light dark:border-border-dark">
          <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4 flex items-center">
            <span className="material-icons text-primary mr-2">lock</span>
            Change Password
          </h3>

          {/* Success Message */}
          {passwordSuccess && (
            <div 
              className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-3 py-2 rounded-lg flex items-center text-sm"
              role="alert"
              aria-live="polite"
            >
              <span className="material-icons text-green-600 dark:text-green-400 mr-2 text-sm">check_circle</span>
              {passwordSuccess}
            </div>
          )}

          {/* Error Message */}
          {passwordError && (
            <div 
              className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-3 py-2 rounded-lg flex items-center text-sm"
              role="alert"
              aria-live="assertive"
            >
              <span className="material-icons text-red-600 dark:text-red-400 mr-2 text-sm">error</span>
              {passwordError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-subtext-light dark:text-subtext-dark mb-1">
                Current Password <span className="text-red-500">*</span>
              </label>
              <input 
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
                disabled={isSubmitting}
                placeholder="••••••••" 
                className="w-full px-3 py-2 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-md shadow-sm text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50" 
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-subtext-light dark:text-subtext-dark mb-1">
                New Password <span className="text-red-500">*</span>
              </label>
              <input 
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                disabled={isSubmitting}
                placeholder="••••••••" 
                className="w-full px-3 py-2 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-md shadow-sm text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50" 
              />
              <p className="text-xs text-subtext-light dark:text-subtext-dark mt-1">
                Must be at least 8 characters with uppercase, lowercase, and numbers
              </p>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-subtext-light dark:text-subtext-dark mb-1">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <input 
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
                disabled={isSubmitting}
                placeholder="••••••••" 
                className="w-full px-3 py-2 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-md shadow-sm text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50" 
              />
            </div>
            <div>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin material-icons text-sm">refresh</span>
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Two-Factor Authentication Card */}
        <div className="bg-background-light dark:bg-background-dark p-6 rounded-lg border border-border-light dark:border-border-dark">
          <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4 flex items-center">
            <span className="material-icons text-primary mr-2">verified_user</span>
            Two-Factor Authentication
          </h3>
          <div className="flex items-start space-x-4">
            <span className="material-icons text-green-500 text-3xl">check_circle</span>
            <div>
              <p className="font-semibold text-text-light dark:text-text-dark">2FA is currently enabled</p>
              <p className="text-sm text-subtext-light dark:text-subtext-dark mt-1">
                You are using an authenticator app to protect your account.
              </p>
              <button className="text-sm font-medium text-red-500 hover:text-red-600 hover:underline mt-4 transition-colors">
                Disable 2FA
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications & Preferences Section */}
      <NotificationsPreferences />

      {/* Login History Card */}
      <div className="bg-background-light dark:bg-background-dark p-6 rounded-lg border border-border-light dark:border-border-dark">
        <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4 flex items-center">
          <span className="material-icons text-primary mr-2">history</span>
          Recent Login Activity
        </h3>
        <ul className="space-y-2">
          {loginHistory.map(entry => (
            <li 
              key={entry.id} 
              className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 rounded-lg hover:bg-card-light dark:hover:bg-card-dark transition-colors border border-transparent hover:border-border-light dark:hover:border-border-dark"
            >
              <div>
                <p className="text-sm font-medium text-text-light dark:text-text-dark">
                  <span className="material-icons text-xs mr-1" style={{ fontSize: '14px', verticalAlign: 'middle' }}>
                    computer
                  </span>
                  IP Address: {entry.ip} ({entry.location})
                </p>
                <p className="text-xs text-subtext-light dark:text-subtext-dark mt-1">{entry.time}</p>
              </div>
              <span 
                className={`text-xs font-bold px-2 py-1 rounded-full mt-2 md:mt-0 ${
                  entry.status === 'Success' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}
              >
                {entry.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Employee Profile Tab Component
const EmployeeProfileTab = ({ employeeData }) => {
  if (!employeeData) {
    return (
      <div className="text-center py-12">
        <span className="material-icons text-6xl text-subtext-light dark:text-subtext-dark mb-4">person_off</span>
        <p className="text-subtext-light dark:text-subtext-dark">No employee record found for this account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin-Only Fields (Locked) */}
      <InfoCard title="Core HR Information" icon="admin_panel_settings" subtitle="(Admin Only - Read Only)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LockedInfoRow icon="person" label="Full Name" value={`${employeeData.firstName} ${employeeData.lastName}`} />
          <LockedInfoRow icon="badge" label="Employee ID" value={employeeData.employeeId || 'N/A'} />
          <LockedInfoRow icon="email" label="Work Email" value={employeeData.workEmail || 'Not Set'} />
          <LockedInfoRow icon="work" label="Job Title" value={employeeData.designation || 'N/A'} />
          <LockedInfoRow icon="school" label="Department" value={employeeData.department || 'N/A'} />
          <LockedInfoRow icon="business" label="School/Faculty" value={employeeData.schoolFaculty || 'Not Set'} />
          <LockedInfoRow icon="verified" label="Employment Status" value={employeeData.employmentStatus || 'Active'} />
          <LockedInfoRow icon="calendar_today" label="Start Date" value={employeeData.joiningDate || 'N/A'} />
          <LockedInfoRow icon="supervisor_account" label="Reporting Manager" value={employeeData.reportingManager || 'Not Assigned'} />
        </div>
      </InfoCard>

      {/* Shared Fields (Admin + Employee Editable) */}
      <InfoCard title="Work Contact" icon="contact_phone" subtitle="(Editable)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EditableInfoRow icon="location_on" label="Office Location" value={employeeData.officeLocation || 'Not Set'} />
          <EditableInfoRow icon="phone" label="Work Phone" value={employeeData.workPhone || 'Not Set'} />
        </div>
      </InfoCard>

      {/* Employee-Only Fields */}
      <InfoCard title="Personal Information" icon="person" subtitle="(Your Information - Editable)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EditableInfoRow icon="badge" label="Preferred Name" value={employeeData.preferredName || 'Not Set'} />
          <EditableInfoRow icon="phone_android" label="Personal Mobile" value={employeeData.mobileNumber || 'N/A'} />
          <EditableInfoRow icon="email" label="Personal Email" value={employeeData.personalEmail || 'N/A'} />
        </div>
      </InfoCard>

      {/* Emergency Contact */}
      <InfoCard title="Emergency Contact" icon="emergency" subtitle="(Your Information - Editable)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EditableInfoRow icon="person" label="Contact Name" value={employeeData.emergencyContactName || 'Not Set'} />
          <EditableInfoRow icon="family_restroom" label="Relationship" value={employeeData.emergencyContactRelationship || 'Not Set'} />
          <EditableInfoRow icon="phone" label="Contact Phone" value={employeeData.emergencyContactPhone || 'Not Set'} />
          <EditableInfoRow icon="email" label="Contact Email" value={employeeData.emergencyContactEmail || 'Not Set'} />
        </div>
      </InfoCard>

      {/* Documents Section */}
      <DocumentsSection employeeId={employeeData.id} />
    </div>
  );
};

// Helper components
const InfoCard = ({ title, icon, subtitle, children }) => (
  <div className="bg-background-light dark:bg-background-dark p-6 rounded-lg border border-border-light dark:border-border-dark">
    <div className="mb-4 pb-2 border-b border-border-light dark:border-border-dark">
      <h3 className="text-lg font-semibold text-text-light dark:text-text-dark flex items-center">
        {icon && <span className="material-icons text-primary mr-2">{icon}</span>}
        {title}
      </h3>
      {subtitle && (
        <p className="text-xs text-subtext-light dark:text-subtext-dark mt-1 ml-8">{subtitle}</p>
      )}
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start">
    <span className="material-icons text-primary text-lg mr-3 mt-1">{icon}</span>
    <div className="flex-1">
      <p className="text-sm text-subtext-light dark:text-subtext-dark">{label}</p>
      <p className="font-medium text-text-light dark:text-text-dark mt-1">{value}</p>
    </div>
  </div>
);

const LockedInfoRow = ({ icon, label, value }) => (
  <div className="flex items-start">
    <span className="material-icons text-primary text-lg mr-3 mt-1">{icon}</span>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <p className="text-sm text-subtext-light dark:text-subtext-dark">{label}</p>
        <span className="material-icons text-xs text-gray-400" title="Admin Only - Cannot Edit">lock</span>
      </div>
      <p className="font-medium text-text-light dark:text-text-dark mt-1">{value}</p>
    </div>
  </div>
);

const EditableInfoRow = ({ icon, label, value }) => (
  <div className="flex items-start">
    <span className="material-icons text-primary text-lg mr-3 mt-1">{icon}</span>
    <div className="flex-1">
      <div className="flex items-center justify-between">
        <p className="text-sm text-subtext-light dark:text-subtext-dark">{label}</p>
        <button 
          className="text-xs text-primary hover:text-primary-dark flex items-center gap-1"
          title="Click to edit"
        >
          <span className="material-icons text-sm">edit</span>
          Edit
        </button>
      </div>
      <p className="font-medium text-text-light dark:text-text-dark mt-1">{value}</p>
    </div>
  </div>
);

export default ProfilePage;