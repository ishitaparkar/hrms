import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './AttendancePage.css';
import moment from 'moment';
import { PageHeader, Card, Button } from '../components/ui';

// --- MAIN PAGE COMPONENT ---
const AttendancePage = () => {
  const [allEmployees, setAllEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/employees/');
        const employeesData = response.data?.results || response.data || [];
        setAllEmployees(employeesData);
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // temporary simulation of today's status (replace with real data when available)
  const todaysAttendance = useMemo(
    () =>
      allEmployees.map((employee, index) => ({
        ...employee,
        status: ['Present', 'Absent', 'On Leave'][index % 3],
      })),
    [allEmployees]
  );

  const filteredAttendance = todaysAttendance.filter((staff) =>
    activeFilter === 'All' ? true : staff.status === activeFilter
  );

  const handleViewAttendance = (employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-800';
      case 'Absent':
        return 'bg-red-100 text-red-800';
      case 'On Leave':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <PageHeader
        title="Today's Attendance"
        description="Summary of staff attendance for today."
        icon="event_available"
      />

      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeFilter === 'All' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveFilter('All')}
          >
            All ({todaysAttendance.length})
          </Button>
          <Button
            variant={activeFilter === 'Present' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveFilter('Present')}
          >
            Present
          </Button>
          <Button
            variant={activeFilter === 'Absent' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveFilter('Absent')}
          >
            Absent
          </Button>
          <Button
            variant={activeFilter === 'On Leave' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveFilter('On Leave')}
          >
            On Leave
          </Button>
        </div>

        <Card noPadding>
          {isLoading ? (
            <div className="text-center py-8 text-subtext-light dark:text-subtext-dark">
              Loading employee data...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[640px]">
                <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800 text-text-light dark:text-text-dark">
                  <tr>
                    <th className="px-6 py-3">Staff Name</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Today's Status</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                  {filteredAttendance.map((staff, idx) => (
                    <tr 
                      key={staff.id ?? idx} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-text-light dark:text-text-dark">
                        {staff.firstName} {staff.lastName}
                      </td>
                      <td className="px-6 py-4 text-text-light dark:text-text-dark">
                        {staff.department}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(staff.status)}`}>
                          {staff.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewAttendance(staff)}
                        >
                          View Attendance
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredAttendance.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-subtext-light dark:text-subtext-dark">
                        No records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {isModalOpen && selectedEmployee && (
        <CalendarModal
          employee={selectedEmployee}
          closeModal={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

// --- CALENDAR MODAL ---
const CalendarModal = ({ employee, closeModal }) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const [timeFilter, setTimeFilter] = useState('Month'); // Year | Month | Week | Day
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedWeek, setSelectedWeek] = useState(0);

  // years range - current year and two previous (adjust as needed)
  const years = useMemo(() => {
    return [currentYear, currentYear - 1, currentYear - 2];
  }, [currentYear]);

  const weeksInMonth = useMemo(() => getWeeksInMonth(selectedYear, selectedMonth), [selectedYear, selectedMonth]);

  // attendanceRecords is memoized so it re-generates only when year/month change
  const attendanceRecords = useMemo(
    () => generateMonthlyAttendance(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );

  // summary for visible selection (we could restrict counts by timeFilter if needed)
  const summary = useMemo(() => {
    return Object.values(attendanceRecords).reduce(
      (acc, status) => {
        if (status === 'Present') acc.present++;
        else if (status === 'Absent') acc.absent++;
        else if (status === 'Half Day') acc.halfDay++;
        return acc;
      },
      { present: 0, absent: 0, halfDay: 0 }
    );
  }, [attendanceRecords]);

  function getWeeksInMonth(year, month) {
    const firstDay = moment({ year, month }).startOf('month');
    const lastDay = moment({ year, month }).endOf('month');
    const weeks = [];
    let currentWeekStart = firstDay.clone().startOf('week');

    while (currentWeekStart.isSameOrBefore(lastDay, 'day')) {
      weeks.push({
        label: `Week ${weeks.length + 1}: ${currentWeekStart.format('MMM D')} - ${currentWeekStart.clone().endOf('week').format('MMM D')}`,
        start: currentWeekStart.clone(),
        end: currentWeekStart.clone().endOf('week'),
      });
      currentWeekStart.add(1, 'week');
    }

    return weeks;
  }

  const tileDisabled = ({ date, view }) => {
    // only restrict on month view (react-calendar default). Adjust if you want to support 'year' view etc.
    if (view !== 'month') return false;

    const mDate = moment(date);

    if (timeFilter === 'Year') {
      return mDate.year() !== selectedYear;
    }
    if (timeFilter === 'Month') {
      return mDate.year() !== selectedYear || mDate.month() !== selectedMonth;
    }
    if (timeFilter === 'Week') {
      const week = weeksInMonth[selectedWeek];
      if (!week) return true;
      return !mDate.isBetween(week.start, week.end, 'day', '[]');
    }
    if (timeFilter === 'Day') {
      // when Day filter is active, disable everything except the currently selected day (if you want to allow selecting a specific day you can store it)
      // For now, we won't disable days for Day filter (the UI can be extended to let user pick the specific day)
      return false;
    }

    return false;
  };

  const tileContent = ({ date, view }) => {
    const status = attendanceRecords[date.toDateString()];
    if (!status) return null;

    // small visual dot + screenreader-friendly text
    const dotClass = status === 'Present' ? 'calendar-dot-present' : status === 'Absent' ? 'calendar-dot-absent' : 'calendar-dot-half';

    return (
      <div className="flex flex-col items-center mt-1">
        <span className={`w-2 h-2 rounded-full ${dotClass}`} aria-hidden="true" />
        <span className="sr-only">{status}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-card-light dark:bg-card-dark p-4 md:p-6 rounded-xl w-full max-w-3xl shadow-xl relative my-4">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-4">
          <div className="flex-1">
            <h2 className="text-lg md:text-xl font-semibold text-heading-light dark:text-heading-dark">
              Attendance: {employee.firstName} {employee.lastName}
            </h2>
            <p className="text-xs md:text-sm text-subtext-light dark:text-subtext-dark">
              View attendance records by different time ranges.
            </p>
          </div>
          <button 
            onClick={closeModal} 
            aria-label="Close" 
            className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-2xl transition-colors flex-shrink-0"
          >
            &times;
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-2 flex flex-wrap items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <select 
              value={timeFilter} 
              onChange={(e) => setTimeFilter(e.target.value)} 
              className="text-xs md:text-sm rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-text-light dark:text-text-dark px-2 py-1 w-full sm:w-auto"
            >
              <option value="Year">Year</option>
              <option value="Month">Month</option>
              <option value="Week">Week</option>
              <option value="Day">Day</option>
            </select>

            {timeFilter === 'Year' && (
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))} 
                className="text-xs md:text-sm rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-text-light dark:text-text-dark px-2 py-1 w-full sm:w-auto"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            )}

            {(timeFilter === 'Month' || timeFilter === 'Week' || timeFilter === 'Day') && (
              <>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))} 
                  className="text-xs md:text-sm rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-text-light dark:text-text-dark px-2 py-1 w-full sm:w-auto"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>

                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))} 
                  className="text-xs md:text-sm rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-text-light dark:text-text-dark px-2 py-1 w-full sm:w-auto"
                >
                  {moment.months().map((m, i) => (
                    <option key={m} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
              </>
            )}

            {timeFilter === 'Week' && (
              <select 
                value={selectedWeek} 
                onChange={(e) => setSelectedWeek(parseInt(e.target.value, 10))} 
                className="text-xs md:text-sm rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-text-light dark:text-text-dark px-2 py-1 w-full sm:w-auto"
              >
                {weeksInMonth.map((w, i) => (
                  <option key={i} value={i}>
                    {w.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-xs md:text-sm">
            <h4 className="font-semibold mb-2 text-heading-light dark:text-heading-dark">
              Summary for Selection
            </h4>
            <div className="space-y-1 text-text-light dark:text-text-dark">
              <p>
                <strong>Present:</strong> {summary.present} days
              </p>
              <p>
                <strong>Absent:</strong> {summary.absent} days
              </p>
              <p>
                <strong>Half Days:</strong> {summary.halfDay} days
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-2 md:p-4 rounded-lg overflow-x-auto">
          <Calendar
            className="border-none dark:text-text-dark w-full"
            activeStartDate={new Date(selectedYear, selectedMonth)}
            tileDisabled={tileDisabled}
            tileContent={tileContent}
          />
        </div>
      </div>
    </div>
  );
};

// Helper function to simulate monthly data
const generateMonthlyAttendance = (year, month) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const records = {};
  const statuses = ['Present', 'Present', 'Absent', 'Half Day'];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    // skip weekends in this simulated dataset
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      records[date.toDateString()] = statuses[Math.floor(Math.random() * statuses.length)];
    }
  }
  return records;
};

export default AttendancePage;
