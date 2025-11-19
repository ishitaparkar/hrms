import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { usePermission } from '../contexts/PermissionContext';
import { PageHeader, Card } from '../components/ui';

const EmployeeAssetsPage = () => {
  const [allAssets, setAllAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const { hasRole } = usePermission();
  
  const isEmployee = hasRole('Employee');

  useEffect(() => {
    const fetchAndPrepareAssets = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        let employeesData = [];
        
        if (isEmployee) {
          // Employee: Fetch only own data
          const response = await axios.get('http://127.0.0.1:8000/api/auth/me/', {
            headers: { Authorization: `Token ${token}` }
          });
          const userData = response.data;
          
          // Get employee details
          const empResponse = await axios.get(`http://127.0.0.1:8000/api/employees/${userData.employee_id}/`, {
            headers: { Authorization: `Token ${token}` }
          });
          employeesData = [empResponse.data];
        } else {
          // HR Manager & Super Admin: Fetch all employees
          const response = await axios.get('http://127.0.0.1:8000/api/employees/', {
            headers: { Authorization: `Token ${token}` }
          });
          employeesData = response.data.results || response.data || [];
        }

        // Generate multiple assets per employee
        const simulatedAssets = [];
        employeesData.forEach((employee) => {
          // Each employee gets 2-4 assets
          const assetTypes = [
            { type: 'Laptop', model: 'MacBook Pro 16"', status: 'Assigned' },
            { type: 'Monitor', model: 'Dell UltraSharp U27', status: 'Assigned' },
            { type: 'Phone', model: 'iPhone 14 Pro', status: 'Assigned' },
            { type: 'ID Card', model: 'Faculty Access Card', status: 'Assigned' },
          ];
          
          // For employees, show 2-3 assets; for admins, show varied assets
          const numAssets = isEmployee ? 3 : (employee.id % 3) + 2;
          
          for (let i = 0; i < numAssets; i++) {
            const asset = assetTypes[i % assetTypes.length];
            simulatedAssets.push({
              id: `ASSET-${employee.id}-${i}`,
              assetId: `${asset.type.substring(0, 2).toUpperCase()}-${1000 + employee.id * 10 + i}`,
              type: asset.type,
              model: asset.model,
              status: i === 0 ? 'Assigned' : (i === 1 ? 'Assigned' : 'In Repair'),
              custodian: `${employee.firstName} ${employee.lastName}`,
              department: employee.department,
              date: employee.joiningDate,
            });
          }
        });

        setAllAssets(simulatedAssets);
      } catch (error) {
        console.error("Error fetching data for assets:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAndPrepareAssets();
  }, [isEmployee]);

  // Filtered assets are now derived from the status filter state
  const filteredAssets = allAssets.filter(asset => {
    if (statusFilter === 'All') {
      return true; // Show all assets
    }
    return asset.status === statusFilter; // Show only assets with the selected status
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Assigned': 
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Assigned
          </span>
        );
      case 'In Stock': 
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            In Stock
          </span>
        );
      case 'In Repair': 
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            In Repair
          </span>
        );
      case 'Retired': 
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            Retired
          </span>
        );
      default: 
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Page Header */}
      <PageHeader
        title={isEmployee ? 'My Assets' : 'Asset Management'}
        description={isEmployee ? 'View your assigned assets and equipment.' : 'Filter and view all university assets.'}
        icon="inventory_2"
        actions={
          !isEmployee && (
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg bg-card-light dark:bg-gray-800 border border-border-light dark:border-border-dark text-sm text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="All">All Status</option>
              <option value="Assigned">Assigned</option>
              <option value="In Stock">In Stock</option>
              <option value="In Repair">In Repair</option>
              <option value="Retired">Retired</option>
            </select>
          )
        }
      />

      {/* Main Content */}
      <div className="p-8">
        {/* Assets Table Card */}
        <Card noPadding className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-12 text-subtext-light dark:text-subtext-dark">
              <span className="material-icons text-4xl mb-2 animate-spin">refresh</span>
              <p>Loading asset data...</p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-12 text-subtext-light dark:text-subtext-dark">
              <span className="material-icons text-4xl mb-2">inventory_2</span>
              <p>No assets found</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800 text-subtext-light dark:text-subtext-dark border-b border-border-light dark:border-border-dark">
                <tr>
                  <th scope="col" className="px-6 py-3">Asset ID</th>
                  <th scope="col" className="px-6 py-3">Type</th>
                  <th scope="col" className="px-6 py-3">Model/Name</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Current Custodian</th>
                  <th scope="col" className="px-6 py-3">Department</th>
                  <th scope="col" className="px-6 py-3">Purchase Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map(asset => (
                  <tr 
                    key={asset.id} 
                    className="border-b border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-text-light dark:text-text-dark">{asset.assetId}</td>
                    <td className="px-6 py-4 text-text-light dark:text-text-dark">{asset.type}</td>
                    <td className="px-6 py-4 text-text-light dark:text-text-dark">{asset.model}</td>
                    <td className="px-6 py-4">{getStatusBadge(asset.status)}</td>
                    <td className="px-6 py-4 font-semibold text-text-light dark:text-text-dark">{asset.custodian}</td>
                    <td className="px-6 py-4 text-text-light dark:text-text-dark">{asset.department}</td>
                    <td className="px-6 py-4 text-text-light dark:text-text-dark">{asset.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
};

export default EmployeeAssetsPage;