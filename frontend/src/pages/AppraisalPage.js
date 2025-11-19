import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PageHeader, Card, Button } from '../components/ui';

const AppraisalPage = () => {
  const [allEmployees, setAllEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Upcoming');

  // Fetch ALL employees from the backend when the page loads
  useEffect(() => {
    const fetchAllEmployees = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/employees/');
        let employeesData = [];
        if (response.data && Array.isArray(response.data.results)) {
          employeesData = response.data.results;
        } else if (Array.isArray(response.data)) {
          employeesData = response.data;
        }
        setAllEmployees(employeesData);
      } catch (error) {
        console.error("Error fetching employees for appraisals:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllEmployees();
  }, []);

  // Simulate appraisal status for each real employee
  const appraisalData = allEmployees.map((employee, index) => {
    const statuses = ['Completed', 'In Progress', 'Not Started'];
    const lastReviewDates = ['2024-11-05', '2024-11-10', '2024-12-01'];
    return {
      ...employee,
      status: statuses[index % statuses.length],
      lastReview: lastReviewDates[index % lastReviewDates.length],
    };
  });

  // Filter the live, augmented data based on the active tab
  const filteredAppraisals = appraisalData.filter(employee => {
    if (activeTab === 'Upcoming') {
      return employee.status === 'In Progress' || employee.status === 'Not Started';
    }
    if (activeTab === 'Completed') {
      return employee.status === 'Completed';
    }
    return false;
  });

  // Helper function for status badge classes
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed': 
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'In Progress': 
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Not Started': 
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: 
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <PageHeader
        title="Performance Appraisals"
        description="Annual Review Cycle: 2025"
        icon="assessment"
        actions={
          <Button
            variant="primary"
            size="md"
            icon="add_circle"
            onClick={() => console.log('Start New Cycle')}
          >
            Start New Cycle
          </Button>
        }
      />

      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <div className="border-b border-border-light dark:border-border-dark">
            <nav className="flex flex-wrap space-x-2 md:space-x-4">
              <button 
                onClick={() => setActiveTab('Upcoming')} 
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'Upcoming' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-subtext-light dark:text-subtext-dark hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Upcoming Reviews
              </button>
              <button 
                onClick={() => setActiveTab('Completed')} 
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'Completed' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-subtext-light dark:text-subtext-dark hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Completed Reviews
              </button>
            </nav>
          </div>
        </div>

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
                    <th className="px-6 py-3">Employee</th>
                    <th className="px-6 py-3">Designation</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Last Review Date</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                  {filteredAppraisals.map((employee) => (
                    <tr 
                      key={employee.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-text-light dark:text-text-dark">
                        {employee.firstName} {employee.lastName}
                      </td>
                      <td className="px-6 py-4 text-text-light dark:text-text-dark">
                        {employee.designation}
                      </td>
                      <td className="px-6 py-4 text-text-light dark:text-text-dark">
                        {employee.department}
                      </td>
                      <td className="px-6 py-4 text-text-light dark:text-text-dark">
                        {employee.lastReview}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(employee.status)}`}>
                          {employee.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {employee.status === 'Completed' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            to={`/appraisal/report/${employee.id}`}
                          >
                            View Report
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            to={`/appraisal/start/${employee.id}`}
                          >
                            Start Review
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredAppraisals.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-subtext-light dark:text-subtext-dark">
                        No performance reviews found for this category.
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

export default AppraisalPage;