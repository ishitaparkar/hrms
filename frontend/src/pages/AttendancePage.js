import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../utils/api';
import { usePermission } from '../contexts/PermissionContext';
import PersonalizedGreeting from '../components/PersonalizedGreeting';

const AttendancePage = () => {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [todayRecord, setTodayRecord] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [viewMode, setViewMode] = useState('timeline'); // 'timeline', 'table', 'grid'

  // Fetch Attendance Data
  const fetchAttendance = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('authToken');
    const headers = { 'Authorization': `Token ${token}` };

    // Format month for API: YYYY-MM
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const monthStr = `${year}-${month}`;

    try {
      const response = await axios.get(getApiUrl(`/attendance/my-attendance/?month=${monthStr}`), { headers });
      setRecords(response.data.records);
      setSummary(response.data.summary);

      // Check if checked in today
      const todayStr = new Date().toISOString().split('T')[0];
      const today = response.data.records.find(r => r.date === todayStr);
      setTodayRecord(today);

    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [currentDate]);

  // Handle Check-In / Check-Out
  const handleAction = async (action) => {
    setIsLoading(true); // Re-use main loader or consider a dedicated button loader

    // Function to perform the API call
    const performAction = async (position = null) => {
      const token = localStorage.getItem('authToken');
      const headers = { 'Authorization': `Token ${token}` };

      const payload = {
        action,
        latitude: position ? position.coords.latitude : null,
        longitude: position ? position.coords.longitude : null
      };

      try {
        await axios.post(getApiUrl('/attendance/action/'), payload, { headers });
        fetchAttendance(); // Refresh data
      } catch (error) {
        alert(error.response?.data?.error || "Action failed");
        setIsLoading(false);
      }
    };

    // Try to get location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          performAction(position);
        },
        (error) => {
          console.warn("Geolocation denied or error:", error);
          // Proceed without location if denied/failed, but maybe warn user?
          // For now, allow check-in without location as fallback
          performAction(null);
        },
        { timeout: 10000 } // Wait max 10s for location
      );
    } else {
      console.warn("Geolocation not available");
      performAction(null);
    }
  };

  // Date Navigation
  const nextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const prevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (isLoading && !records.length) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 min-h-screen font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Attendance</h1>
            <p className="text-sm text-gray-500">View and manage your attendance records.</p>
          </div>

          {/* Clock In/Out Widget */}
          <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">



            {todayRecord && todayRecord.check_out && (
              <div className="px-4 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-700">
                Clocked Out
              </div>
            )}

            {!todayRecord && (
              <button
                onClick={() => handleAction('check_in')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors"
                disabled={isLoading}
              >
                Clock In
              </button>
            )}

            {todayRecord && !todayRecord.check_out && (
              <>
                {!todayRecord.is_on_break ? (
                  <>
                    <button
                      onClick={() => handleAction('start_break')}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-bold rounded-lg transition-colors"
                      disabled={isLoading}
                    >
                      Start Break
                    </button>
                    <button
                      onClick={() => handleAction('check_out')}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-lg transition-colors"
                      disabled={isLoading}
                    >
                      Clock Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleAction('end_break')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors"
                    disabled={isLoading}
                  >
                    End Break
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Navigation, Stats & View Switcher */}
        <div className="flex flex-col xl:flex-row justify-between items-center mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 gap-6">

          {/* Month Nav */}
          <div className="flex items-center gap-4">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
              <span className="material-icons">chevron_left</span>
            </button>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white w-40 text-center">{monthName}</h2>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
              <span className="material-icons">chevron_right</span>
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-center w-full md:w-auto">
            {/* Stats Summary */}
            {summary && (
              <div className="flex gap-6 text-sm">
                <div className="text-center">
                  <span className="block font-bold text-gray-800 dark:text-white">{summary.present_days}</span>
                  <span className="text-gray-500">Present</span>
                </div>
                <div className="text-center">
                  <span className="block font-bold text-gray-800 dark:text-white">{summary.absent_days}</span>
                  <span className="text-gray-500">Absent</span>
                </div>
                <div className="text-center">
                  <span className="block font-bold text-gray-800 dark:text-white">{summary.attendance_percentage}%</span>
                  <span className="text-gray-500">Efficiency</span>
                </div>
              </div>
            )}

            {/* View Switcher */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${viewMode === 'timeline' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <span className="material-icons text-[18px]">view_timeline</span> Timeline
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <span className="material-icons text-[18px]">table_chart</span> Table
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <span className="material-icons text-[18px]">grid_view</span> Grid
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {viewMode === 'timeline' && (
          <>
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Clock In</div>
              <div className="col-span-6">Timeline</div>
              <div className="col-span-2 text-right">Total Hours</div>
            </div>
            <div className="space-y-4">
              {records.map((record) => (
                <TimelineRow key={record.id} record={record} />
              ))}
            </div>
          </>
        )}

        {viewMode === 'table' && <TableView records={records} />}
        {viewMode === 'grid' && <GridView records={records} />}

        {records.length === 0 && (
          <div className="text-center py-10 text-gray-500">No records found for this month.</div>
        )}
      </div>
    </div>
  );
};

// --- Helper Functions ---
const formatTime = (timeStr) => {
  if (!timeStr) return '--:--';
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setUTCHours(hours);
  date.setUTCMinutes(minutes);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
};

// --- Components ---

const TimelineRow = ({ record }) => {
  // Helper to format time (09:00:00 -> 09:00 AM)
  // This function is now defined globally above, so we can remove the local one.

  // Determine Day and Date
  const dateObj = new Date(record.date);
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNum = dateObj.getDate();

  // Determine Status / Color
  const isWeekend = dayName === 'Sat' || dayName === 'Sun'; // Simplified check

  return (
    <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">

      {/* Date Column */}
      <div className="md:col-span-2 flex items-center gap-3">
        <div className="flex flex-col items-center justify-center w-10">
          <span className="text-xs text-gray-500 font-bold uppercase">{dayName}</span>
          <span className="text-lg font-bold text-gray-800 dark:text-white">{dayNum}</span>
        </div>
        {/* Mobile Label for Status */}
        <span className={`md:hidden px-2 py-1 text-xs rounded-full ${record.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {record.status}
        </span>
      </div>

      {/* Clock In & Location */}
      <div className="md:col-span-2 text-sm text-gray-800 dark:text-gray-300 font-medium">
        <div className="flex items-center gap-2">
          <span className="md:hidden text-gray-500 w-20">Clock-in:</span>
          {formatTime(record.check_in)}
        </div>
        {record.check_in_address ? (
          <div className="text-xs text-gray-500 relative group mt-1">
            <div className="cursor-help hover:text-blue-600 flex items-center gap-1">
              <span className="material-icons text-[12px]">place</span>
              <span className="underline decoration-dotted">View Location</span>
            </div>
            <div className="hidden group-hover:block mt-2 p-2 bg-white border border-gray-200 shadow-lg rounded-md absolute z-10 w-48 text-gray-700 text-xs text-left">
              {record.check_in_address}
            </div>
          </div>
        ) : (record.check_in_latitude && (
          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <span className="material-icons text-[12px]">place</span>
            {parseFloat(record.check_in_latitude).toFixed(4)}, {parseFloat(record.check_in_longitude).toFixed(4)}
          </div>
        ))}
      </div>

      {/* Visual Timeline Bar */}
      <div className="md:col-span-6 w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full relative overflow-hidden">
        {record.status === 'Present' && (
          <div
            className="absolute top-0 left-0 h-full bg-green-500 rounded-full transition-all duration-300 hover:opacity-90 cursor-help"
            style={{ width: '100%' }}
            title={`Clock In: ${formatTime(record.check_in)} | Clock Out: ${record.check_out ? formatTime(record.check_out) : 'Active'} | Duration: ${record.work_hours} Hrs`}
          ></div>
        )}
        {/* 
                    Note: A true timeline bar requires normalizing start/end times against a standard 9-5 or 8-8 day. 
                    For now, we use a full bar for 'Present' to match the visual request style simply.
                    To make it accurate: width = (duration / 9h) * 100 
                 */}
      </div>

      {/* Total Hours */}
      <div className="md:col-span-2 text-right">
        <div className="flex md:flex-col justify-between items-end">
          <span className="md:hidden text-gray-500">Total:</span>
          <div>
            <span className="block text-sm font-bold text-gray-900 dark:text-white">{record.work_hours || '0'} Hrs</span>
            <span className="text-xs text-gray-400 block mb-1">{record.check_out ? formatTime(record.check_out) : 'Active'}</span>

            {/* Clock Out Location */}
            {record.check_out && record.check_out_address ? (
              <div className="text-xs text-gray-500 relative group">
                <div className="cursor-help hover:text-blue-600 flex items-center gap-1 justify-end">
                  <span className="material-icons text-[12px]">place</span>
                  <span className="underline decoration-dotted">View Location</span>
                </div>
                <div className="hidden group-hover:block mt-2 p-2 bg-white border border-gray-200 shadow-lg rounded-md absolute right-0 z-10 w-48 text-gray-700 text-xs text-left">
                  {record.check_out_address}
                </div>
              </div>
            ) : (record.check_out && record.check_out_latitude && (
              <div className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                <span className="material-icons text-[12px]">place</span>
                {parseFloat(record.check_out_latitude).toFixed(4)}, {parseFloat(record.check_out_longitude).toFixed(4)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const TableView = ({ records }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 md:overflow-visible overflow-hidden">
      <div className="md:overflow-visible overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Clock In</th>
              <th className="px-6 py-3">Clock Out</th>
              <th className="px-6 py-3">Work Hours</th>
              <th className="px-6 py-3">Breaks</th>
              <th className="px-6 py-3">Location</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                  {new Date(record.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${record.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {record.status}
                  </span>
                </td>
                <td className="px-6 py-4">{formatTime(record.check_in)}</td>
                <td className="px-6 py-4">{record.check_out ? formatTime(record.check_out) : '-'}</td>
                <td className="px-6 py-4 font-bold">{record.work_hours || '0'}</td>
                <td className="px-6 py-4">{record.breaks?.length || 0}</td>
                <td className="px-6 py-4 text-xs">
                  {(!record.check_in_latitude && !record.check_out_latitude && !record.check_in_address && !record.check_out_address) ? '-' : (
                    <div className="flex flex-col gap-2">
                      {/* Check In Location */}
                      {record.check_in_address ? (
                        <div className="text-xs text-gray-500 relative group">
                          <div className="cursor-help hover:text-blue-600 flex items-center gap-1">
                            <span className="material-icons text-[14px]">place</span>
                            <span className="truncate max-w-[150px]">In: View Location</span>
                          </div>
                          <div className="hidden group-hover:block mt-1 p-2 bg-white border border-gray-200 shadow-lg rounded-md absolute right-0 z-10 w-64 text-gray-700 whitespace-normal">
                            <div className="font-bold mb-1">Check In:</div>
                            {record.check_in_address}
                          </div>
                        </div>
                      ) : (record.check_in_latitude && (
                        <div className="flex items-center gap-1">
                          <span className="material-icons text-[14px]">place</span>
                          In: {parseFloat(record.check_in_latitude).toFixed(2)}, {parseFloat(record.check_in_longitude).toFixed(2)}
                        </div>
                      ))}

                      {/* Check Out Location */}
                      {record.check_out_address ? (
                        <div className="text-xs text-gray-500 relative group">
                          <div className="cursor-help hover:text-blue-600 flex items-center gap-1">
                            <span className="material-icons text-[14px]">place</span>
                            <span className="truncate max-w-[150px]">Out: View Location</span>
                          </div>
                          <div className="hidden group-hover:block mt-1 p-2 bg-white border border-gray-200 shadow-lg rounded-md absolute right-0 z-10 w-64 text-gray-700 whitespace-normal">
                            <div className="font-bold mb-1">Check Out:</div>
                            {record.check_out_address}
                          </div>
                        </div>
                      ) : (record.check_out_latitude && (
                        <div className="flex items-center gap-1">
                          <span className="material-icons text-[14px]">place</span>
                          Out: {parseFloat(record.check_out_latitude).toFixed(2)}, {parseFloat(record.check_out_longitude).toFixed(2)}
                        </div>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const GridView = ({ records }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {records.map((record) => {
        const dateObj = new Date(record.date);
        return (
          <div key={record.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white">{dateObj.toLocaleDateString('en-US', { weekday: 'long' })}</h3>
                <div className="text-sm text-gray-500">{dateObj.toLocaleDateString()}</div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${record.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {record.status}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Clock In:</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatTime(record.check_in)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Clock Out:</span>
                <div className="text-right">
                  <span className="font-medium text-gray-900 dark:text-white block">{record.check_out ? formatTime(record.check_out) : '-'}</span>
                  {record.check_out_address && (
                    <div className="text-xs text-gray-500 relative inline-block group mt-1">
                      <div className="cursor-help hover:text-blue-600 flex items-center justify-end gap-1">
                        <span className="material-icons text-[12px]">place</span>
                        <span className="underline decoration-dotted">View Location</span>
                      </div>
                      <div className="hidden group-hover:block mt-1 p-2 bg-white border border-gray-200 shadow-lg rounded-md absolute right-0 z-10 w-48 text-left text-gray-700">
                        <div className="font-bold mb-1">Check Out:</div>
                        {record.check_out_address}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <span className="text-gray-500">Work Hours:</span>
                <span className="font-bold text-blue-600">{record.work_hours || '0'} Hrs</span>
              </div>
              {record.check_in_address ? (
                <div className="pt-2 text-xs text-gray-500 flex items-center justify-end relative group gap-1">
                  <span className="mr-auto text-gray-400">In Loc:</span>
                  <div className="cursor-help hover:text-blue-600 flex items-center justify-end gap-1">
                    <span className="material-icons text-[12px]">place</span>
                    <span className="underline decoration-dotted">View Location</span>
                  </div>
                  <div className="hidden group-hover:block mt-1 p-2 bg-white border border-gray-200 shadow-lg rounded-md absolute right-0 bottom-8 z-10 w-48 text-left text-gray-700">
                    <div className="font-bold mb-1">Check In:</div>
                    {record.check_in_address}
                  </div>
                </div>
              ) : (record.check_in_latitude && (
                <div className="pt-2 text-xs text-gray-400 flex items-center justify-end gap-1">
                  <span className="material-icons text-[12px]">place</span>
                  {parseFloat(record.check_in_latitude).toFixed(4)}, {parseFloat(record.check_in_longitude).toFixed(4)}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AttendancePage;