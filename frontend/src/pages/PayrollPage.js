import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { usePermission } from '../contexts/PermissionContext';
import { PageHeader, Card, Button } from '../components/ui';

const PayrollPage = () => {
  const [payrollData, setPayrollData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('October 2025');
  const { hasRole } = usePermission();
  
  const isEmployee = hasRole('Employee');
  const isSuperAdmin = hasRole('Super Admin');
  const isHRManager = hasRole('HR Manager');

  // Fetch payroll data based on role
  useEffect(() => {
    const fetchAndPreparePayroll = async () => {
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

        // Generate payroll data for the selected month
        const simulatedPayroll = employeesData.map((employee, index) => {
          const grossSalary = employee.basicSalary ? parseFloat(employee.basicSalary) : 80000 + (employee.id * 5000);
          const deductions = grossSalary * 0.15; // Simulate 15% deductions
          const netSalary = grossSalary - deductions;
          
          // Different status based on month
          let status = 'Paid';
          if (activeTab === 'October 2025') {
            status = index % 4 === 3 ? 'Pending' : 'Paid';
          }
          
          return {
            ...employee,
            grossSalary: `₹${grossSalary.toLocaleString('en-IN')}`,
            deductions: `₹${deductions.toLocaleString('en-IN')}`,
            netSalary: `₹${netSalary.toLocaleString('en-IN')}`,
            status: status,
            month: activeTab,
          };
        });

        setPayrollData(simulatedPayroll);
      } catch (error) {
        console.error("Error fetching data for payroll:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAndPreparePayroll();
  }, [isEmployee, activeTab]); // Re-run when role or month changes

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid': 
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Paid
          </span>
        );
      case 'Pending': 
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Pending
          </span>
        );
      case 'Failed': 
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            Failed
          </span>
        );
      default: 
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Page Header */}
      <PageHeader
        title={isEmployee ? 'My Payroll' : 'Employee Payroll'}
        description={isEmployee ? 'View your salary slips and payment history.' : 'Manage and process monthly salary payments.'}
        icon="account_balance_wallet"
        actions={
          (isSuperAdmin || isHRManager) && (
            <Button
              variant="primary"
              size="md"
              icon="play_arrow"
              to="/run-payroll"
            >
              Run New Payroll
            </Button>
          )
        }
      />

      {/* Main Content */}
      <div className="p-4 md:p-6 lg:p-8">
        {/* Month Tabs */}
        <div className="mb-6 border-b border-border-light dark:border-border-dark overflow-x-auto">
          <nav className="flex space-x-4 min-w-max">
            <TabButton title="October 2025" activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabButton title="September 2025" activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabButton title="August 2025" activeTab={activeTab} setActiveTab={setActiveTab} />
          </nav>
        </div>

        {/* Payroll Table Card */}
        <Card noPadding className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-12 text-subtext-light dark:text-subtext-dark">
              <span className="material-icons text-4xl mb-2 animate-spin">refresh</span>
              <p>Loading payroll data...</p>
            </div>
          ) : payrollData.length === 0 ? (
            <div className="text-center py-12 text-subtext-light dark:text-subtext-dark">
              <span className="material-icons text-4xl mb-2">account_balance_wallet</span>
              <p>No payroll records found for {activeTab}</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left min-w-[900px]">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800 text-subtext-light dark:text-subtext-dark border-b border-border-light dark:border-border-dark">
                <tr>
                  <th scope="col" className="px-6 py-3">Employee Name</th>
                  <th scope="col" className="px-6 py-3">Staff ID</th>
                  <th scope="col" className="px-6 py-3">Department</th>
                  <th scope="col" className="px-6 py-3">Gross Salary</th>
                  <th scope="col" className="px-6 py-3">Deductions</th>
                  <th scope="col" className="px-6 py-3">Net Salary</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.map((employee) => (
                  <tr 
                    key={employee.id} 
                    className="border-b border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-text-light dark:text-text-dark">
                      {employee.firstName} {employee.lastName}
                    </td>
                    <td className="px-6 py-4 text-text-light dark:text-text-dark">{employee.employeeId}</td>
                    <td className="px-6 py-4 text-text-light dark:text-text-dark">{employee.department}</td>
                    <td className="px-6 py-4 text-text-light dark:text-text-dark">{employee.grossSalary}</td>
                    <td className="px-6 py-4 text-text-light dark:text-text-dark">{employee.deductions}</td>
                    <td className="px-6 py-4 font-semibold text-text-light dark:text-text-dark">{employee.netSalary}</td>
                    <td className="px-6 py-4">{getStatusBadge(employee.status)}</td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-primary hover:text-blue-600 dark:hover:text-blue-400 text-xs font-medium transition-colors">
                        View Payslip
                      </button>
                    </td>
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

// Helper component for Tab Buttons
const TabButton = ({ title, activeTab, setActiveTab }) => (
  <button 
    onClick={() => setActiveTab(title)}
    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
      activeTab === title 
        ? 'border-primary text-primary' 
        : 'border-transparent text-subtext-light dark:text-subtext-dark hover:border-gray-300 dark:hover:border-gray-600'
    }`}
  >
    {title}
  </button>
);

export default PayrollPage;