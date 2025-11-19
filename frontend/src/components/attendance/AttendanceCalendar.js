import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Card from '../ui/Card';

/**
 * CalendarDay Component - Memoized individual day cell
 */
const CalendarDay = React.memo(({ isEmpty, day, record, isToday, getStatusColor }) => {
  if (isEmpty) {
    return <div className="aspect-square"></div>;
  }
  
  const statusColor = record 
    ? getStatusColor(record.status)
    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500';
  
  const todayBorder = isToday ? 'ring-2 ring-primary ring-offset-2' : '';
  
  return (
    <div
      className={`aspect-square rounded-lg ${statusColor} ${todayBorder} flex flex-col items-center justify-center p-2 transition-all cursor-pointer group relative`}
      title={record ? `${record.status} - ${record.checkIn || 'N/A'} to ${record.checkOut || 'N/A'}` : 'No record'}
    >
      <span className="text-sm font-semibold">{day}</span>
      {record && (
        <div className="absolute inset-0 bg-black/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-xs text-white">
          <div className="font-semibold mb-1">{record.status}</div>
          {record.checkIn && (
            <div>In: {record.checkIn}</div>
          )}
          {record.checkOut && (
            <div>Out: {record.checkOut}</div>
          )}
          {record.workHours && (
            <div className="mt-1">{record.workHours}h</div>
          )}
        </div>
      )}
    </div>
  );
});

CalendarDay.displayName = 'CalendarDay';

CalendarDay.propTypes = {
  isEmpty: PropTypes.bool,
  day: PropTypes.number,
  record: PropTypes.object,
  isToday: PropTypes.bool,
  getStatusColor: PropTypes.func.isRequired
};

/**
 * AttendanceCalendar Component
 * 
 * Displays a calendar view of attendance records with color coding:
 * - Green: Present
 * - Red: Absent
 * - Yellow: Late
 * - Gray: No record/future date
 * 
 * @param {Array} records - Array of attendance records
 * @param {string} month - Selected month in YYYY-MM format
 */
const AttendanceCalendar = React.memo(({ records = [], month }) => {
  // Memoize status color function to prevent recreation on every render
  const getStatusColor = useMemo(() => (status) => {
    switch (status) {
      case 'Present':
        return 'bg-green-500 text-white hover:bg-green-600';
      case 'Absent':
        return 'bg-red-500 text-white hover:bg-red-600';
      case 'Late':
        return 'bg-yellow-500 text-white hover:bg-yellow-600';
      case 'Half Day':
        return 'bg-orange-500 text-white hover:bg-orange-600';
      default:
        return 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400';
    }
  }, []);
  
  // Memoize calendar days calculation
  const calendarDays = useMemo(() => {
    // Parse the month to get year and month number
    const [year, monthNum] = month.split('-').map(Number);
    
    // Get the first and last day of the month
    const firstDay = new Date(year, monthNum - 1, 1);
    const lastDay = new Date(year, monthNum, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();
    
    // Create a map of date to attendance record
    const recordMap = {};
    records.forEach(record => {
      recordMap[record.date] = record;
    });
    
    // Generate calendar days
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ isEmpty: true, key: `empty-${i}` });
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const record = recordMap[dateStr];
      const today = new Date();
      const isToday = 
        today.getDate() === day && 
        today.getMonth() === monthNum - 1 && 
        today.getFullYear() === year;
      
      days.push({
        day,
        dateStr,
        record,
        isToday,
        key: dateStr
      });
    }
    
    return days;
  }, [records, month]);
  
  const weekDays = useMemo(() => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], []);
  
  return (
    <Card title="Attendance Calendar" icon="calendar_today">
      <div className="space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-text-light dark:text-text-dark">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-text-light dark:text-text-dark">Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500"></div>
            <span className="text-text-light dark:text-text-dark">Late</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500"></div>
            <span className="text-text-light dark:text-text-dark">Half Day</span>
          </div>
        </div>
        
        {/* Calendar Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDays.map(day => (
                <div 
                  key={day}
                  className="text-center text-sm font-semibold text-heading-light dark:text-heading-dark py-2"
                >
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map(({ isEmpty, day, record, isToday, key }) => (
                <CalendarDay
                  key={key}
                  isEmpty={isEmpty}
                  day={day}
                  record={record}
                  isToday={isToday}
                  getStatusColor={getStatusColor}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
});

AttendanceCalendar.displayName = 'AttendanceCalendar';

AttendanceCalendar.propTypes = {
  records: PropTypes.arrayOf(PropTypes.shape({
    date: PropTypes.string.isRequired,
    checkIn: PropTypes.string,
    checkOut: PropTypes.string,
    status: PropTypes.oneOf(['Present', 'Absent', 'Late', 'Half Day']).isRequired,
    workHours: PropTypes.number
  })),
  month: PropTypes.string.isRequired
};

export default AttendanceCalendar;
