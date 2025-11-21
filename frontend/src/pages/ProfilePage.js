import React, { useState, useEffect, useRef } from 'react';
import { usePermission } from '../contexts/PermissionContext';
import usePageTitle from '../hooks/usePageTitle';
import DocumentsSection from '../components/profile/DocumentsSection';
import NotificationsPreferences from '../components/profile/NotificationsPreferences';
import axios from 'axios';

const ProfilePage = () => {
  const { roles, user } = usePermission();
  const [activeTab, setActiveTab] = useState('employee');
  const [profileData, setProfileData] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // --- STATE FOR PROFILE IMAGE UPLOAD ---
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Set page title
  usePageTitle('My Profile');

  // --- HELPER: Fix Image URLs & Cache Busting ---
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    let url = imagePath;
    // If it's a local path, prepend backend URL
    if (!imagePath.startsWith('http')) {
        url = `http://localhost:8000${imagePath}`; 
    }
    // Add timestamp to force browser to reload image after upload
    return `${url}?t=${new Date().getTime()}`; 
  };

  // Handle tab navigation
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

  // Fetch Data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        // 1. Fetch User Auth Data
        const profileResponse = await fetch('http://localhost:8000/api/auth/me/', {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (profileResponse.ok) {
          const data = await profileResponse.json();
          setProfileData(data);
          
          // 2. If Employee ID exists, fetch Employee Data
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

  // --- IMAGE UPLOAD HANDLERS ---

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !employeeData) return;

    // Validation
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG, PNG).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB Limit
      alert('File size should be less than 5MB.');
      return;
    }

    setImageUploading(true);
    const formData = new FormData();
    formData.append('profile_picture', file); 

    try {
      const token = localStorage.getItem('authToken');
      
      // --- FIX APPLIED: REMOVED 'Content-Type' HEADER ---
      // Axios/Browser sets the correct multipart boundary automatically
      const response = await axios.patch(
        `http://localhost:8000/api/employees/${employeeData.id}/`, 
        formData, 
        {
          headers: {
            'Authorization': `Token ${token}`,
          }
        }
      );

      // Update UI immediately
      setEmployeeData(prev => ({
        ...prev,
        profile_picture: response.data.profile_picture
      }));
      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      if (error.response) {
        alert(`Upload Failed: ${JSON.stringify(error.response.data)}`);
      } else {
        alert('Failed to upload profile picture. Please try again.');
      }
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove the profile picture? Only an Admin can restore it.')) return;

    setImageUploading(true);
    try {
      const token = localStorage.getItem('authToken');
      await axios.patch(
        `http://localhost:8000/api/employees/${employeeData.id}/`, 
        { profile_picture: null }, 
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );

      setEmployeeData(prev => ({
        ...prev,
        profile_picture: null
      }));
      alert('Profile picture removed.');
    } catch (error) {
      console.error('Error removing image:', error);
      if (error.response?.status === 403) {
          alert("Permission Denied: Only Super Admins can remove profile pictures.");
      } else {
          alert('Failed to remove image.');
      }
    } finally {
      setImageUploading(false);
    }
  };

  // --- PERMISSIONS ---
  const isSuperAdmin = roles.includes('Super Admin');
  
  // Check ownership (compare emails)
  const isOwnProfile = user?.email && (
      user.email === employeeData?.personalEmail || 
      user.email === employeeData?.workEmail || 
      user.email === employeeData?.officialEmail
  );

  // RULE 1: Employee (Owner) OR Super Admin can UPLOAD
  const canUpload = isSuperAdmin || isOwnProfile;
  
  // RULE 2: ONLY Super Admin can REMOVE
  const canRemove = isSuperAdmin;

  // --- DISPLAY HELPERS ---
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Super Admin': return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700';
      case 'HR Manager': return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700';
      case 'Department Head': return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700';
      default: return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
  };

  const displayName = employeeData 
    ? `${employeeData.firstName} ${employeeData.lastName}`
    : profileData?.username || user?.username || 'User';
  
  const displayEmail = user?.email || profileData?.email || '';
  
  // Determine Image Source
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff&size=128`;
  const finalDisplayImage = getImageUrl(employeeData?.profile_picture) || defaultAvatar;

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
          
          {/* === IMAGE UPLOAD SECTION START === */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-full ring-4 ring-primary/20 overflow-hidden bg-gray-100 relative">
                <img 
                    className="w-full h-full object-cover" 
                    src={finalDisplayImage} 
                    alt={displayName} 
                    onError={(e) => { e.target.src = defaultAvatar; }}
                />
                
                {/* Loading Overlay */}
                {imageUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    </div>
                )}

                {/* Edit Overlay - Visible if user has Upload Permission */}
                {canUpload && !imageUploading && (
                    <button
                        onClick={handleImageClick}
                        className="absolute inset-0 bg-black/20 hover:bg-black/40 flex items-center justify-center transition-colors cursor-pointer z-10"
                        title="Change Profile Picture"
                    >
                        <span className="material-icons text-white text-2xl drop-shadow-md">photo_camera</span>
                    </button>
                )}
            </div>

            {/* Remove Button - Visible ONLY if Super Admin */}
            {canRemove && employeeData?.profile_picture && (
                <button
                    onClick={handleRemoveImage}
                    className="absolute -bottom-1 -right-1 bg-red-100 text-red-600 rounded-full p-1.5 shadow-md hover:bg-red-200 transition-colors z-20 border border-white dark:border-gray-700"
                    title="Remove Photo (Admin Only)"
                >
                    <span className="material-icons text-sm font-bold">delete</span>
                </button>
            )}

            {/* Hidden File Input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/png, image/jpeg, image/jpg"
                className="hidden"
            />
          </div>
          {/* === IMAGE UPLOAD SECTION END === */}

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
            >
              <span className="material-icons text-sm mr-2 align-middle">badge</span>
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
            >
              <span className="material-icons text-sm mr-2 align-middle">security</span>
              Account Settings
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'employee' && (
                <div role="tabpanel" id="employee-tab-panel">
                    <EmployeeProfileTab employeeData={employeeData} />
                </div>
            )}
            {activeTab === 'account' && (
                <div role="tabpanel" id="account-tab-panel">
                    <AccountSettingsTab />
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: Account Settings
// ==========================================
const AccountSettingsTab = () => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock login history
  const loginHistory = [
    { id: 1, ip: '103.48.19.122', location: 'Local', time: 'Today', status: 'Success' },
  ];

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setPasswordError('');
  };

  const validatePassword = (password) => {
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    return null;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

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
      // Simulate success for now (Replace with actual endpoint when ready)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPasswordSuccess('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(''), 5000);
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to update password.');
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

          {passwordSuccess && (
            <div className="mb-4 bg-green-50 text-green-800 p-2 rounded flex items-center text-sm">
              <span className="material-icons text-sm mr-2">check_circle</span> {passwordSuccess}
            </div>
          )}
          {passwordError && (
            <div className="mb-4 bg-red-50 text-red-800 p-2 rounded flex items-center text-sm">
              <span className="material-icons text-sm mr-2">error</span> {passwordError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-subtext-light dark:text-subtext-dark mb-1">Current Password</label>
              <input 
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-md shadow-sm focus:ring-2 focus:ring-primary" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-subtext-light dark:text-subtext-dark mb-1">New Password</label>
              <input 
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-md shadow-sm focus:ring-2 focus:ring-primary" 
              />
              <p className="text-xs text-subtext-light mt-1">Min 8 chars, 1 uppercase, 1 lowercase, 1 number</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-subtext-light dark:text-subtext-dark mb-1">Confirm Password</label>
              <input 
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-md shadow-sm focus:ring-2 focus:ring-primary" 
              />
            </div>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Two-Factor Auth Card */}
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
              <button className="text-sm font-medium text-red-500 hover:underline mt-4">Disable 2FA</button>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Preferences Component */}
      <NotificationsPreferences />

      {/* Login History */}
      <div className="bg-background-light dark:bg-background-dark p-6 rounded-lg border border-border-light dark:border-border-dark">
        <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4 flex items-center">
          <span className="material-icons text-primary mr-2">history</span>
          Recent Login Activity
        </h3>
        <ul className="space-y-2">
          {loginHistory.map(entry => (
            <li key={entry.id} className="flex justify-between items-center p-4 rounded-lg hover:bg-card-light dark:hover:bg-card-dark border border-transparent hover:border-border-light">
              <div>
                <p className="text-sm font-medium text-text-light dark:text-text-dark">IP: {entry.ip} ({entry.location})</p>
                <p className="text-xs text-subtext-light">{entry.time}</p>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-800">{entry.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: Employee Profile Tab
// ==========================================
const EmployeeProfileTab = ({ employeeData }) => {
  if (!employeeData) {
    return (
      <div className="text-center py-12">
        <span className="material-icons text-6xl text-subtext-light mb-4">person_off</span>
        <p className="text-subtext-light">No employee record found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin-Only Fields */}
      <InfoCard title="Core HR Information" icon="admin_panel_settings" subtitle="(Admin Only - Read Only)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LockedInfoRow icon="person" label="Full Name" value={`${employeeData.firstName} ${employeeData.lastName}`} />
          <LockedInfoRow icon="badge" label="Employee ID" value={employeeData.employeeId || 'N/A'} />
          <LockedInfoRow icon="email" label="Work Email" value={employeeData.workEmail || 'Not Set'} />
          <LockedInfoRow icon="work" label="Job Title" value={employeeData.designation || 'N/A'} />
          <LockedInfoRow icon="school" label="Department" value={employeeData.department || 'N/A'} />
          <LockedInfoRow icon="verified" label="Employment Status" value={employeeData.employmentStatus || 'Active'} />
          <LockedInfoRow icon="calendar_today" label="Start Date" value={employeeData.joiningDate || 'N/A'} />
          <LockedInfoRow icon="supervisor_account" label="Reporting Manager" value={employeeData.reportingManager || 'Not Assigned'} />
        </div>
      </InfoCard>

      {/* Work Contact */}
      <InfoCard title="Work Contact" icon="contact_phone" subtitle="(Editable)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EditableInfoRow icon="location_on" label="Office Location" value={employeeData.officeLocation || 'Not Set'} />
          <EditableInfoRow icon="phone" label="Work Phone" value={employeeData.workPhone || 'Not Set'} />
        </div>
      </InfoCard>

      {/* Personal Information */}
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

// ==========================================
// UI HELPER COMPONENTS
// ==========================================
const InfoCard = ({ title, icon, subtitle, children }) => (
  <div className="bg-background-light dark:bg-background-dark p-6 rounded-lg border border-border-light dark:border-border-dark">
    <div className="mb-4 pb-2 border-b border-border-light dark:border-border-dark">
      <h3 className="text-lg font-semibold text-text-light dark:text-text-dark flex items-center">
        {icon && <span className="material-icons text-primary mr-2">{icon}</span>}
        {title}
      </h3>
      {subtitle && <p className="text-xs text-subtext-light dark:text-subtext-dark mt-1 ml-8">{subtitle}</p>}
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

const LockedInfoRow = ({ icon, label, value }) => (
  <div className="flex items-start">
    <span className="material-icons text-primary text-lg mr-3 mt-1">{icon}</span>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <p className="text-sm text-subtext-light dark:text-subtext-dark">{label}</p>
        <span className="material-icons text-xs text-gray-400" title="Admin Only">lock</span>
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
        <button className="text-xs text-primary hover:text-primary-dark flex items-center gap-1" title="Click to edit">
          <span className="material-icons text-sm">edit</span> Edit
        </button>
      </div>
      <p className="font-medium text-text-light dark:text-text-dark mt-1">{value}</p>
    </div>
  </div>
);

export default ProfilePage;