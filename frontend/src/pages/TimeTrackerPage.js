import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { PageHeader, Card, Button } from '../components/ui';

const TimeTrackerPage = () => {
  const location = useLocation();
  const [allEmployees, setAllEmployees] = useState([]);
  const [employeesToDisplay, setEmployeesToDisplay] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // This useEffect hook handles fetching and filtering the data.
  useEffect(() => {
    const fetchAndFilterEmployees = async () => {
      setIsLoading(true);
      try {
        // 1. Always fetch the full list of employees from your live backend.
        const response = await axios.get('http://127.0.0.1:8000/api/employees/');
        let employeesData = [];
        if (response.data && Array.isArray(response.data.results)) {
          employeesData = response.data.results;
        } else if (Array.isArray(response.data)) {
          employeesData = response.data;
        }
        setAllEmployees(employeesData);

        // 2. Check if selected IDs were passed in the navigation state.
        const selectedIds = location.state?.selectedEmployeeIds;

        if (selectedIds && selectedIds.length > 0) {
          // If IDs were passed, filter the data for display.
          const filtered = employeesData.filter(employee => selectedIds.includes(employee.id));
          setEmployeesToDisplay(filtered);
        } else {
          // If no IDs were passed (direct navigation), display all employees.
          setEmployeesToDisplay(employeesData);
        }
      } catch (error) {
        console.error("Error fetching data for time tracker:", error);
        setEmployeesToDisplay([]); // Prevent crash on error.
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndFilterEmployees();
  }, [location.state]); // Re-run when navigation state changes.

  const handleDiscrepancy = (employeeId, action) => {
    console.log(`Action: ${action} for Employee ID: ${employeeId}`);
    alert(`Discrepancy for employee ${employeeId} has been marked as '${action}'. (Simulation)`);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Discrepancy': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'On Leave': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getDescription = () => {
    if (location.state?.selectedEmployeeIds) {
      return `Showing logs for ${location.state.selectedEmployeeIds.length} selected employee(s)`;
    }
    return 'Showing all entries for today';
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <PageHeader
        title="Daily Time Tracker"
        description={getDescription()}
        icon="schedule"
      />

      <div className="p-4 md:p-6 lg:p-8">
        <Card noPadding>
          {isLoading ? (
            <div className="text-center py-8 text-subtext-light dark:text-subtext-dark">
              Loading employee data...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[768px]">
                <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800 text-text-light dark:text-text-dark">
                  <tr>
                    <th className="px-6 py-3">Employee Name</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Clock In</th>
                    <th className="px-6 py-3">Clock Out</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                  {employeesToDisplay.map((employee, index) => {
                    // Simulating time and status data for each real employee
                    const isDiscrepancy = index % 3 === 1;
                    const isOnLeave = index % 4 === 2;
                    const status = isOnLeave ? 'On Leave' : isDiscrepancy ? 'Discrepancy' : 'Completed';
                    const clockIn = isOnLeave ? '--:--' : `09:${String(index).padStart(2, '0')} AM`;
                    const clockOut = isOnLeave || status === 'Working' ? '--:--' : `05:${String(index * 2).padStart(2, '0')} PM`;

                    return (
                      <tr 
                        key={employee.id} 
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-text-light dark:text-text-dark">
                          {employee.firstName} {employee.lastName}
                        </td>
                        <td className="px-6 py-4 text-text-light dark:text-text-dark">
                          {employee.department}
                        </td>
                        <td className={`px-6 py-4 text-text-light dark:text-text-dark ${isDiscrepancy ? 'text-red-500 dark:text-red-400 font-semibold' : ''}`}>
                          {clockIn}
                        </td>
                        <td className={`px-6 py-4 text-text-light dark:text-text-dark ${isDiscrepancy ? 'text-red-500 dark:text-red-400 font-semibold' : ''}`}>
                          {clockOut}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(status)}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isDiscrepancy ? (
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleDiscrepancy(employee.id, 'Accepted')}
                              >
                                Accept
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDiscrepancy(employee.id, 'Rejected')}
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-subtext-light dark:text-subtext-dark">--</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {employeesToDisplay.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-subtext-light dark:text-subtext-dark">
                        No time entries found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TimeTrackerPage;