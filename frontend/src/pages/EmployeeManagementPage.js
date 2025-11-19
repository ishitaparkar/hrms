import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { usePermission } from '../contexts/PermissionContext';
import PermissionError from '../components/PermissionError';
import usePermissionError from '../hooks/usePermissionError';
import { PageHeader, Card, Button } from '../components/ui';

const EmployeeManagementPage = () => {
  const navigate = useNavigate();
  const { hasPermission, hasRole } = usePermission();
  const { permissionError, handleApiError, clearPermissionError } = usePermissionError();
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for selection
  const [selectedEmployees, setSelectedEmployees] = useState([]);

  // This is the function that fetches ALL employees. No pagination for now.
  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      // We will fetch all employees at once for simplicity, as pagination was causing issues.
      // We will re-add pagination correctly later if needed.
      const response = await axios.get('http://127.0.0.1:8000/api/employees/');
      
      // Ensure the response is an array before setting it
      if (Array.isArray(response.data)) {
        setEmployees(response.data);
      } else if (response.data && Array.isArray(response.data.results)) {
        // Handle paginated response just in case the backend has it
        setEmployees(response.data.results);
      } else {
        setEmployees([]); // Default to empty array if data is not in expected format
      }

    } catch (error) {
      console.error("Error fetching employees:", error);
      // Handle permission errors
      if (!handleApiError(error)) {
        // If not a permission error, show generic error
        setEmployees([]); // Set to empty array on error to prevent crashes
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Handlers for checkbox selection
  const handleSelectAll = (e) => {
    if (e.target.checked && Array.isArray(employees)) {
      setSelectedEmployees(employees.map(emp => emp.id));
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleSelectOne = (e, id) => {
    if (e.target.checked) {
      setSelectedEmployees([...selectedEmployees, id]);
    } else {
      setSelectedEmployees(selectedEmployees.filter(empId => empId !== id));
    }
  };

  // Handler for the "Run Payroll" action
  const handleRunPayroll = () => {
    if (selectedEmployees.length === 0) {
      alert("Please select at least one employee to run payroll.");
      return;
    }
    console.log("Running payroll for employee IDs:", selectedEmployees);
    navigate('/run-payroll');
  };
  
  // Handler for deleting an employee
  const handleDelete = async (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
        try {
            await axios.delete(`http://127.0.0.1:8000/api/employees/${employeeId}/`);
            alert('Employee deleted successfully.');
            fetchEmployees(); // Re-fetch the list to show the change
        } catch (error) {
            console.error('Error deleting employee:', error);
            // Handle permission errors
            if (!handleApiError(error)) {
                alert('Failed to delete employee.');
            }
        }
    }
  };

  // Check if user can manage employees (HR Manager or Super Admin)
  const canManageEmployees = hasPermission('authentication.manage_employees') || 
                              hasRole('HR Manager') || 
                              hasRole('Super Admin');
  
  // Check if user can manage payroll
  const canManagePayroll = hasPermission('authentication.manage_payroll') || 
                           hasRole('HR Manager') || 
                           hasRole('Super Admin');

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Permission Error Modal */}
      <PermissionError error={permissionError} onClose={clearPermissionError} />
      
      {/* Page Header */}
      <PageHeader
        title="Staff & Faculty Directory"
        description={`${selectedEmployees.length} employee(s) selected`}
        icon="people"
        actions={
          <>
            {canManagePayroll && (
              <Button
                variant="primary"
                size="md"
                icon="play_arrow"
                onClick={handleRunPayroll}
                disabled={selectedEmployees.length === 0}
              >
                Run Payroll
              </Button>
            )}
            {canManageEmployees && (
              <Button
                variant="secondary"
                size="md"
                icon="person_add"
                to="/add-employee"
              >
                Add New Staff
              </Button>
            )}
          </>
        }
      />

      {/* Main Content */}
      <div className="p-4 md:p-6 lg:p-8">
        <Card noPadding className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-12 text-subtext-light dark:text-subtext-dark">
              <span className="material-icons text-4xl mb-2 animate-spin">refresh</span>
              <p>Loading staff data from the server...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-12 text-subtext-light dark:text-subtext-dark">
              <span className="material-icons text-4xl mb-2">people_outline</span>
              <p>No employees found</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left min-w-[640px]">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800 text-subtext-light dark:text-subtext-dark border-b border-border-light dark:border-border-dark">
                <tr>
                  <th className="p-4">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-primary rounded focus:ring-primary"
                      onChange={handleSelectAll}
                      checked={Array.isArray(employees) && employees.length > 0 && selectedEmployees.length === employees.length}
                    />
                  </th>
                  <th className="px-6 py-3">Staff ID</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Designation</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(employees) && employees.map((employee) => (
                  <tr 
                    key={employee.id} 
                    className="border-b border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="w-4 p-4">
                      <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-primary rounded focus:ring-primary"
                        onChange={(e) => handleSelectOne(e, employee.id)}
                        checked={selectedEmployees.includes(employee.id)}
                      />
                    </td>
                    <td className="px-6 py-4 text-text-light dark:text-text-dark">
                      {employee.employeeId}
                    </td>
                    <td className="px-6 py-4 font-medium text-text-light dark:text-text-dark">
                      <Link 
                        to={`/employees/${employee.id}`} 
                        className="hover:text-primary transition-colors"
                      >
                        {employee.firstName} {employee.lastName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-text-light dark:text-text-dark">
                      {employee.designation}
                    </td>
                    <td className="px-6 py-4 text-text-light dark:text-text-dark">
                      {employee.department}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        {canManageEmployees ? (
                          <>
                            <Link 
                              to={`/employees/edit/${employee.id}`} 
                              className="text-primary hover:text-blue-600 dark:hover:text-blue-400 text-xs font-medium transition-colors"
                            >
                              Edit
                            </Link>
                            <button 
                              onClick={() => handleDelete(employee.id)} 
                              className="text-red-500 hover:text-red-600 dark:hover:text-red-400 text-xs font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <Link 
                            to={`/employees/${employee.id}`} 
                            className="text-primary hover:text-blue-600 dark:hover:text-blue-400 text-xs font-medium transition-colors"
                          >
                            View
                          </Link>
                        )}
                      </div>
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

export default EmployeeManagementPage;