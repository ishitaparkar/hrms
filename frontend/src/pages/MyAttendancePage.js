import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AttendancePage = () => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- 1. Helper to fix Image URLs ---
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `http://127.0.0.1:8000${imagePath}`;
  };

  // --- 2. Fetch Logged-In Employee Data ---
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        // Get User ID
        const authRes = await axios.get('http://127.0.0.1:8000/api/auth/me/', {
          headers: { 'Authorization': `Token ${token}` }
        });

        // Get Employee Details if linked
        if (authRes.data.employee_id) {
          const empRes = await axios.get(`http://127.0.0.1:8000/api/employees/${authRes.data.employee_id}/`, {
            headers: { 'Authorization': `Token ${token}` }
          });
          setEmployee(empRes.data);
        }
      } catch (error) {
        console.error("Error fetching employee data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, []);

  // --- Mock Attendance Log (Replace this with API call later) ---
  const attendanceLog = [
    { id: 1, date: "Oct 31, 2023", status: "Present", checkIn: "09:02 AM", checkOut: "05:05 PM", hours: "8h 3m" },
    { id: 2, date: "Oct 30, 2023", status: "Present", checkIn: "08:58 AM", checkOut: "05:01 PM", hours: "8h 3m" },
    { id: 3, date: "Oct 27, 2023", status: "Sick Leave", checkIn: "-", checkOut: "-", hours: "-" },
    { id: 4, date: "Oct 26, 2023", status: "Holiday", checkIn: "-", checkOut: "-", hours: "-" },
    { id: 5, date: "Oct 25, 2023", status: "Half-day", checkIn: "09:10 AM", checkOut: "01:15 PM", hours: "4h 5m" },
  ];

  const getStatusStyles = (status) => {
    switch (status) {
      case 'Present': return 'bg-green-100 text-green-700';
      case 'Sick Leave': return 'bg-red-100 text-red-700';
      case 'Holiday': return 'bg-purple-100 text-purple-700';
      case 'Half-day': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // --- Calendar Visual Generator ---
  const renderCalendarDays = () => {
    const days = [];
    for (let i = 0; i < 1; i++) days.push(<div key={`empty-${i}`} className="h-10 w-full"></div>);
    for (let i = 1; i <= 31; i++) {
        let style = "text-gray-500 dark:text-gray-400";
        // Mock styling for demo purposes
        if ([2, 3, 5, 9, 10, 11, 12, 16, 17, 19, 23, 24, 25, 26, 27, 30, 31].includes(i)) style = "bg-green-100 text-green-700 font-medium rounded-full";
        if ([4].includes(i)) style = "bg-yellow-100 text-yellow-700 font-medium rounded-full";
        if ([6].includes(i)) style = "bg-purple-100 text-purple-700 font-medium rounded-full";
        if ([20].includes(i)) style = "bg-red-100 text-red-700 font-medium rounded-full";
        if (i === 18) style = "bg-blue-600 text-white font-bold rounded-full shadow-md"; 

        days.push(<div key={i} className={`h-10 w-full text-sm flex items-center justify-center cursor-pointer ${style}`}>{i}</div>);
    }
    return days;
  };

  if (loading) {
    return <div className="p-8 flex justify-center text-gray-500">Loading attendance data...</div>;
  }

  // Prepare Display Names
  const displayName = employee ? `${employee.firstName} ${employee.lastName}` : "Employee";
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff&size=128`;
  const displayImage = employee ? (getImageUrl(employee.profile_picture) || defaultAvatar) : defaultAvatar;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 min-h-screen font-sans">
      <div className="p-8">
        
        {/* --- Page Header --- */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <img 
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" 
                src={displayImage} 
                alt="Profile" 
                onError={(e) => { e.target.src = defaultAvatar; }}
            />
            <div>
              <h1 className="text-gray-900 dark:text-white text-3xl font-bold leading-tight tracking-tight">
                {displayName}'s Attendance
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-base font-normal">
                Review and manage your attendance details.
              </p>
            </div>
          </div>
          <button className="flex items-center justify-center gap-2 h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm">
            <span className="material-symbols-outlined text-base">download</span>
            <span>Export Report</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* --- LEFT COLUMN: Calendar & Table --- */}
          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            
            {/* 1. Calendar Widget */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between mb-4">
                  <button className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full">
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <p className="text-gray-900 dark:text-white text-lg font-bold">October 2023</p>
                  <button className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full">
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                    <p key={day} className="text-gray-400 dark:text-gray-500 text-xs font-bold text-center">{day}</p>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {renderCalendarDays()}
                </div>
              </div>
            </div>

            {/* 2. Attendance Log Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <h3 className="text-gray-900 dark:text-white text-lg font-bold tracking-tight px-6 pt-6 pb-4">Attendance Log</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Check-in</th>
                      <th className="px-6 py-3">Check-out</th>
                      <th className="px-6 py-3">Total Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {attendanceLog.map((log) => (
                      <tr key={log.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                          {log.date}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusStyles(log.status)}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{log.checkIn}</td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{log.checkOut}</td>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{log.hours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">Showing <span className="font-semibold text-gray-900 dark:text-white">1-5</span> of 21</span>
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">Previous</button>
                  <button className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">Next</button>
                </div>
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: Filters & Summary --- */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            
            {/* 3. Filters Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Filters</h4>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Date Range</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="material-symbols-outlined text-gray-400 text-xl">calendar_month</span>
                    </div>
                    <input type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Oct 1, 2023 - Oct 31, 2023" />
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Status</label>
                  <select className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option>All Statuses</option>
                    <option value="present">Present</option>
                    <option value="absent">Sick Leave</option>
                    <option value="holiday">Holiday</option>
                    <option value="half-day">Half-day</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 4. Monthly Summary Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Monthly Summary</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Working Hours</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">168.5 <span className="text-base font-medium text-gray-500">hours</span></p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"><span className="material-symbols-outlined">schedule</span></div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Paid Leave Balance</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">12 <span className="text-base font-medium text-gray-500">days</span></p>
                  </div>
                  <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300"><span className="material-symbols-outlined">beach_access</span></div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Unplanned Absences</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">1 <span className="text-base font-medium text-gray-500">day</span></p>
                  </div>
                  <div className="p-3 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300"><span className="material-symbols-outlined">sentiment_dissatisfied</span></div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;