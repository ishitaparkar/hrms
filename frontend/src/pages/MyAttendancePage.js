import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import AttendanceSummary from '../components/attendance/AttendanceSummary';
import AttendanceCalendar from '../components/attendance/AttendanceCalendar';
import RecentCheckInOut from '../components/attendance/RecentCheckInOut';

const MyAttendancePage = () => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('authToken');
        const response = await axios.get(
          `http://127.0.0.1:8000/api/attendance/my-attendance/?month=${selectedMonth}`,
          {
            headers: { 'Authorization': `Token ${token}` }
          }
        );
        setAttendanceData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching attendance data:', err);
        setError('Failed to load attendance information. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendanceData();
  }, [selectedMonth]);

  if (isLoading) {
    return (
      <main className="flex-1 bg-background-light dark:bg-background-dark">
        <PageHeader 
          title="My Attendance" 
          description="Track your attendance records and work hours"
          icon="event_available"
        />
        <div className="px-4 md:px-10 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-subtext-light">Loading attendance information...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const handleRetry = () => {
    setError(null);
    // The useEffect will trigger a refetch when selectedMonth changes
    setSelectedMonth(selectedMonth);
  };

  if (error) {
    return (
      <main className="flex-1 bg-background-light dark:bg-background-dark">
        <PageHeader 
          title="My Attendance" 
          description="Track your attendance records and work hours"
          icon="event_available"
        />
        <div className="px-4 md:px-10 py-8">
          <Card>
            <div className="text-center py-8">
              <span className="material-icons text-red-500 text-5xl mb-4">error_outline</span>
              <p className="text-text-light dark:text-text-dark mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label="Retry loading attendance data"
              >
                <span className="material-icons" aria-hidden="true">refresh</span>
                Retry
              </button>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-background-light dark:bg-background-dark" role="main" aria-label="My Attendance">
      <PageHeader 
        title="My Attendance" 
        description="Track your attendance records and work hours"
        icon="event_available"
      />
      
      <div className="px-4 md:px-10 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Month Selector */}
          <Card>
            <div className="flex items-center justify-between">
              <label htmlFor="month-selector" className="text-sm font-medium text-text-light dark:text-text-dark">
                Select Month
              </label>
              <input
                id="month-selector"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Select month to view attendance"
              />
            </div>
          </Card>

          {/* Attendance Summary */}
          <AttendanceSummary summary={attendanceData?.summary} />

          {/* Attendance Calendar */}
          <AttendanceCalendar 
            records={attendanceData?.records} 
            month={selectedMonth}
          />

          {/* Recent Check-In/Out */}
          <RecentCheckInOut records={attendanceData?.records} />
        </div>
      </div>
    </main>
  );
};

export default MyAttendancePage;
