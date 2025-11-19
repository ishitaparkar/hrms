import React, { useState } from 'react';

const SettingsPage = () => {
  // State to manage which tab is currently active
  const [activeTab, setActiveTab] = useState('General');

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      <header className="bg-card-light dark:bg-card-dark p-4 border-b border-border-light dark:border-border-dark flex-shrink-0">
        <h1 className="text-2xl font-semibold text-text-light dark:text-text-dark">System Settings</h1>
      </header>

      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Tab Navigation */}
          <div className="border-b border-border-light dark:border-border-dark mb-8">
            <nav className="flex space-x-6">
              <TabButton title="General" activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton title="Roles & Permissions" activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton title="Policies" activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton title="Integrations" activeTab={activeTab} setActiveTab={setActiveTab} />
            </nav>
          </div>

          {/* Content for the active tab will be rendered here */}
          <div>
            {activeTab === 'General' && <GeneralSettings />}
            {activeTab === 'Roles & Permissions' && <RolesSettings />}
            {activeTab === 'Policies' && <PoliciesSettings />}
            {activeTab === 'Integrations' && <div className="text-subtext-light">Integrations settings are under construction.</div>}
          </div>
        </div>
      </main>
    </div>
  );
};

// Helper component for Tab Buttons
const TabButton = ({ title, activeTab, setActiveTab }) => (
  <button 
    onClick={() => setActiveTab(title)}
    className={`pb-2 px-1 border-b-2 font-semibold text-sm ${activeTab === title ? 'border-primary text-primary' : 'border-transparent text-subtext-light hover:border-gray-300'}`}
  >
    {title}
  </button>
);

// Component for General Settings Form
const GeneralSettings = () => (
  <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-md">
    <h2 className="text-xl font-bold text-text-light dark:text-text-dark mb-6">General University Information</h2>
    <form className="space-y-6">
      <FormInput label="University Name" type="text" id="universityName" defaultValue="My University" />
      <FormInput label="Official Website" type="url" id="universityWebsite" defaultValue="https://myuniversity.edu" />
      <div className="border-t border-border-light dark:border-border-dark pt-6 flex justify-end">
        <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600">Save Changes</button>
      </div>
    </form>
  </div>
);

// Component for Roles & Permissions Settings
const RolesSettings = () => (
  <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-md">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-bold text-text-light dark:text-text-dark">Manage User Roles</h2>
      <button className="text-sm bg-primary text-white px-3 py-1 rounded-md flex items-center"><span className="material-icons mr-1 text-base">add</span> New Role</button>
    </div>
    <div className="space-y-4">
      <RoleCard roleName="Super Administrator" description="Has full access to all modules and settings." />
      <RoleCard roleName="HR Manager" description="Can manage employees, recruitment, and leave, but cannot change system settings." />
      <RoleCard roleName="Department Head" description="Can view employees in their department and approve initial leave requests." />
    </div>
  </div>
);

// Component for Policies Settings
const PoliciesSettings = () => {
  const [uploadedPolicies, setUploadedPolicies] = useState([
    { id: 1, name: 'Faculty Handbook 2025.pdf', size: '2.5 MB', lastUpdated: '2025-08-15' },
    { id: 2, name: 'Code of Conduct.pdf', size: '800 KB', lastUpdated: '2025-01-10' },
    { id: 3, name: 'IT & Network Usage Policy.pdf', size: '1.2 MB', lastUpdated: '2025-06-01' },
  ]);

  // Function to handle file uploads.  (Placeholder, for now)
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // In a real app, you'd upload to a server here
      const newPolicy = {
        id: Date.now(), // Simple unique ID
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB', // Size in KB, rounded to 1 decimal
        lastUpdated: new Date().toLocaleDateString(),
      };
      setUploadedPolicies([...uploadedPolicies, newPolicy]); // Add to state
    }
  };

  return (
    <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-text-light dark:text-text-dark mb-6">Manage University Policies</h2>
      {/* Upload Section */}
      <div className="mb-8 p-6 border-2 border-dashed border-border-light dark:border-border-dark rounded-lg text-center">
        <label htmlFor="policy-upload" className="cursor-pointer">
          <span className="material-icons text-5xl text-subtext-light dark:text-gray-400">cloud_upload</span>
          <p className="mt-2 text-sm text-subtext-light dark:text-gray-400">Drag & drop a file here or browse to upload</p>
          <input type="file" id="policy-upload" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>

      {/* List of Uploaded Policies */}
      <div>
        <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">Uploaded Documents</h3>
        <ul className="space-y-3">
          {uploadedPolicies.map(policy => (
            <li key={policy.id} className="p-3 rounded-lg border border-border-light dark:border-border-dark flex justify-between items-center">
              <div className="flex items-center">
                <span className="material-icons text-red-500 mr-3">picture_as_pdf</span>
                <div>
                  <p className="font-semibold text-text-light dark:text-text-dark">{policy.name}</p>
                  <p className="text-xs text-subtext-light dark:text-gray-400">Size: {policy.size} | Last Updated: {policy.lastUpdated}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-1 text-subtext-light dark:text-gray-400 hover:text-primary dark:hover:text-primary"><span className="material-icons text-base">download</span></button>
                <button className="p-1 text-subtext-light dark:text-gray-400 hover:text-red-500 dark:hover:text-red-500"><span className="material-icons text-base">delete</span></button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Reusable Form Field Components
const FormInput = ({ label, id, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-subtext-light dark:text-subtext-dark mb-1">{label}</label>
    <input id={id} {...props} className="w-full bg-background-light dark:bg-gray-800 border-border-light dark:border-border-dark rounded-md shadow-sm" />
  </div>
);

const FormSelect = ({ label, id, options, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-subtext-light dark:text-subtext-dark mb-1">{label}</label>
    <select id={id} {...props} className="w-full bg-background-light dark:bg-gray-800 border-border-light dark:border-border-dark rounded-md shadow-sm appearance-none pr-8">
      {options.map(opt => <option key={opt}>{opt}</option>)}
    </select>
  </div>
);

const RoleCard = ({ roleName, description }) => (
  <div className="p-4 rounded-lg border border-border-light dark:border-border-dark flex justify-between items-center">
    <div>
      <p className="font-semibold text-text-light dark:text-text-dark">{roleName}</p>
      <p className="text-sm text-subtext-light">{description}</p>
    </div>
    <button className="text-primary hover:underline text-sm font-medium">Edit Permissions</button>
  </div>
);

export default SettingsPage;