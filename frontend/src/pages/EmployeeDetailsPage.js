import React from 'react';
import { Link, useParams } from 'react-router-dom';

// Mock data for a specific employee. In a real app, you would fetch this based on the ID from the URL.
const employeeData = {
  id: 'TCS101',
  name: 'Dr. Anjali Rao',
  title: 'Professor',
  department: 'Computer Science',
  email: 'arao@university.edu',
  phone: '+91 98765 43210',
  joiningDate: '2020-07-15',
  status: 'Active',
  img: 'https://randomuser.me/api/portraits/women/68.jpg',
  address: 'A-123, University Staff Quarters, Pune, Maharashtra',
  assignedAssets: [
    { id: 'LP-00123', type: 'Laptop', model: 'MacBook Pro 16"' },
    { id: 'ID-007', type: 'ID Card', model: 'Faculty Access Card' },
  ]
};

const EmployeeDetailsPage = () => {
  // In a real app, you'd use the ID from the URL to fetch data
  // const { employeeId } = useParams();
  
  return (
    <div className="flex flex-col h-full">
      {/* Header Section */}
      <header className="bg-card-light dark:bg-card-dark p-4 border-b border-border-light dark:border-border-dark flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-text-light dark:text-text-dark">Employee Profile</h1>
          </div>
        </div>
      </header>

      <div className="p-8 space-y-8">
        {/* Profile Header Card */}
        <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-md flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
          <img className="w-24 h-24 rounded-full" src={employeeData.img} alt={employeeData.name} />
          <div className="flex-grow text-center md:text-left">
            <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">{employeeData.name}</h2>
            <p className="text-subtext-light dark:text-subtext-dark">{employeeData.title}, {employeeData.department}</p>
            <p className="text-xs text-subtext-light">Staff ID: {employeeData.id}</p>
          </div>
          <div className="flex-shrink-0">
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center hover:bg-blue-600">
              <span className="material-icons mr-2 text-base">edit</span> Edit Profile
            </button>
          </div>
        </div>

        {/* Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Contact & Personal Info */}
          <div className="lg:col-span-1 space-y-8">
            <InfoCard title="Contact Information">
              <InfoRow icon="email" label="Email" value={employeeData.email} />
              <InfoRow icon="phone" label="Phone" value={employeeData.phone} />
              <InfoRow icon="home" label="Address" value={employeeData.address} />
            </InfoCard>
          </div>

          {/* Right Column: Job & Asset Info */}
          <div className="lg:col-span-2 space-y-8">
            <InfoCard title="Job Information">
              <InfoRow icon="badge" label="Designation" value={employeeData.title} />
              <InfoRow icon="school" label="Department" value={employeeData.department} />
              <InfoRow icon="calendar_today" label="Date of Joining" value={employeeData.joiningDate} />
              <InfoRow icon="work" label="Status" value={<span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">{employeeData.status}</span>} />
            </InfoCard>

            <InfoCard title="Assigned Assets">
              <ul>
                {employeeData.assignedAssets.map(asset => (
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

// Helper components to keep the main component clean
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

export default EmployeeDetailsPage;