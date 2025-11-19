import React from 'react';
import PropTypes from 'prop-types';
import Card from '../ui/Card';

/**
 * StatCard Component
 * 
 * Individual stat card displaying a single metric
 */
const StatCard = React.memo(({ label, value, icon, color, bgColor }) => {
  return (
    <Card hover className="h-full">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}>
          <span className={`material-icons ${color} text-2xl`}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-subtext-light truncate">{label}</p>
          <p className="text-2xl font-bold text-heading-light dark:text-heading-dark">
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
});

StatCard.displayName = 'StatCard';

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  bgColor: PropTypes.string.isRequired
};

/**
 * AttendanceSummary Component
 * 
 * Displays attendance summary statistics with stat cards showing
 * total days, present days, absent days, late days, and attendance percentage.
 * 
 * @param {Object} summary - Attendance summary data
 */
const AttendanceSummary = React.memo(({ summary }) => {
  if (!summary) {
    return (
      <Card title="Attendance Summary" icon="summarize">
        <div className="text-center py-8">
          <span className="material-icons text-subtext-light text-5xl mb-4">event_busy</span>
          <p className="text-text-light dark:text-text-dark">
            No attendance data available for this month.
          </p>
        </div>
      </Card>
    );
  }

  // Calculate attendance percentage
  const attendancePercentage = summary.totalDays > 0 
    ? ((summary.presentDays / summary.totalDays) * 100).toFixed(1)
    : 0;

  const stats = [
    {
      label: 'Total Days',
      value: summary.totalDays || 0,
      icon: 'calendar_month',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      label: 'Present',
      value: summary.presentDays || 0,
      icon: 'check_circle',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      label: 'Absent',
      value: summary.absentDays || 0,
      icon: 'cancel',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30'
    },
    {
      label: 'Late',
      value: summary.lateDays || 0,
      icon: 'schedule',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
    },
    {
      label: 'Attendance',
      value: `${attendancePercentage}%`,
      icon: 'trending_up',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    }
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold text-heading-light dark:text-heading-dark mb-4">
        Attendance Summary
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    </div>
  );
});

AttendanceSummary.displayName = 'AttendanceSummary';

AttendanceSummary.propTypes = {
  summary: PropTypes.shape({
    month: PropTypes.string,
    totalDays: PropTypes.number,
    presentDays: PropTypes.number,
    absentDays: PropTypes.number,
    lateDays: PropTypes.number,
    attendancePercentage: PropTypes.number
  })
};

export default AttendanceSummary;
