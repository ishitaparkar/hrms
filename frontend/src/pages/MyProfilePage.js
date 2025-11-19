import React from 'react';
import { usePermission } from '../contexts/PermissionContext';

// Mock data for the logged-in admin's EMPLOYEE file.
// In a real app, the backend would provide this data for the authenticated user.
const myEmployeeData = {
  id: 'ADM001',
  name: 'Dr. Ananya Sharma',
  title: 'HR Administrator',
  department: 'Human Resources',
  email: 'ananya.sharma@university.edu',
  phone: '+91 99887 76655',
  joiningDate: '2018-05-20',
  status: 'Active',
  img: 'https://randomuser.me/api/portraits/women/75.jpg',
  address: 'B-456, University Admin Block, Pune, Maharashtra',
  assignedAssets: [
    { id: 'LP-00001', type: 'Laptop', model: 'Lenovo ThinkPad P1' },
    { id: 'ID-001', type: 'ID Card', model: 'Admin Access Card' },
  ]
};

const MyProfilePage = () => {
  const { roles, user } = usePermission();
  
  // Helper function to get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Super Admin':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'HR Manager':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Department Head':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Employee':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  return (
    <div className="flex flex-col h-full">
      <header className="bg-card-light dark:bg-card-dark p-4 border-b border-border-light dark:border-border-dark flex-shrink-0">
        <h1 className="text-2xl font-semibold text-text-light dark:text-text-dark">My Employee File</h1>
      </header>

      <div className="p-8 space-y-8">
        {/* Profile Header Card */}
        <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-md flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
          <img className="w-24 h-24 rounded-full" src={myEmployeeData.img} alt={myEmployeeData.name} />
          <div className="flex-grow text-center md:text-left">
            <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">{myEmployeeData.name}</h2>
            <p className="text-subtext-light dark:text-subtext-dark">{myEmployeeData.title}, {myEmployeeData.department}</p>
            <p className="text-xs text-subtext-light">Staff ID: {myEmployeeData.id}</p>
            
            {/* Role Badges */}
            {roles && roles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                {roles.map((role, index) => (
                  <span 
                    key={index}
                    className={`px-3 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor(role)}`}
                  >
                    <span className="material-icons text-xs mr-1" style={{ fontSize: '12px', verticalAlign: 'middle' }}>
                      {role === 'Super Admin' ? 'admin_panel_settings' : 
                       role === 'HR Manager' ? 'manage_accounts' : 
                       role === 'Department Head' ? 'supervisor_account' : 
                       'person'}
                    </span>
                    {role}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <InfoCard title="Contact Information">
              <InfoRow icon="email" label="Official Email" value={myEmployeeData.email} />
              <InfoRow icon="phone" label="Phone" value={myEmployeeData.phone} />
              <InfoRow icon="home" label="Address" value={myEmployeeData.address} />
            </InfoCard>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <InfoCard title="Job Information">
              <InfoRow icon="badge" label="Designation" value={myEmployeeData.title} />
              <InfoRow icon="school" label="Department" value={myEmployeeData.department} />
              <InfoRow icon="calendar_today" label="Date of Joining" value={myEmployeeData.joiningDate} />
              <InfoRow icon="work" label="Status" value={<span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">{myEmployeeData.status}</span>} />
            </InfoCard>

            <InfoCard title="My Assigned Assets">
              <ul>
                {myEmployeeData.assignedAssets.map(asset => (
                  <li key={asset.id} className="flex justify-between items-center py-2 border-b border-border-light dark:border-border-dark">
                    <div>
                      <p className="font-semibold text-text-light">{asset.type}</p>
                      <p className="text-sm text-subtext-light">{asset.model}</p>
                    </div>
                    <p className="text-xs text-subtext-light">{asset.id}</p>
                  </li>
                ))}
              </ul>
            </InfoCard>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper components (can be moved to a separate file later for reuse)
const InfoCard = ({ title, children }) => (
  <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-md">
    <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4 border-b border-border-light pb-2">{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
);

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start">
    <span className="material-icons text-primary text-lg mr-4 mt-1">{icon}</span>
    <div>
      <p className="text-sm text-subtext-light dark:text-subtext-dark">{label}</p>
      <p className="font-medium text-text-light dark:text-text-dark">{value}</p>
    </div>
  </div>
);

export default MyProfilePage;