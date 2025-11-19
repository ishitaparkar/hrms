import React from 'react';
import PropTypes from 'prop-types';
import Card from '../ui/Card';

/**
 * UpcomingHolidays Component
 * 
 * Displays a list of upcoming holidays in the current month
 * 
 * @param {Array} holidays - Array of holiday objects
 */
const UpcomingHolidays = ({ holidays }) => {
  if (!holidays || holidays.length === 0) {
    return (
      <Card title="Upcoming Holidays" icon="celebration">
        <div className="text-center py-8">
          <span className="material-icons text-subtext-light text-5xl mb-3">event_available</span>
          <p className="text-text-light dark:text-text-dark font-medium mb-1">
            No upcoming holidays
          </p>
          <p className="text-sm text-subtext-light">
            There are no holidays scheduled for this month.
          </p>
        </div>
      </Card>
    );
  }

  // Format date to readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get day of week
  const getDayOfWeek = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  // Check if holiday is today
  const isToday = (dateString) => {
    const today = new Date();
    const holidayDate = new Date(dateString);
    return today.toDateString() === holidayDate.toDateString();
  };

  // Check if holiday is upcoming (within next 7 days)
  const isUpcoming = (dateString) => {
    const today = new Date();
    const holidayDate = new Date(dateString);
    const diffTime = holidayDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 7;
  };

  return (
    <Card title="Upcoming Holidays" icon="celebration">
      <div className="space-y-3">
        {holidays.map((holiday, index) => (
          <div
            key={holiday.id || index}
            className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
              isToday(holiday.date)
                ? 'bg-primary/10 border-primary'
                : isUpcoming(holiday.date)
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                : 'bg-gray-50 dark:bg-gray-800/50 border-border-light dark:border-border-dark'
            }`}
          >
            {/* Date Box */}
            <div className={`flex-shrink-0 text-center p-3 rounded-lg ${
              isToday(holiday.date)
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-gray-700 border border-border-light dark:border-border-dark'
            }`}>
              <div className={`text-2xl font-bold ${
                isToday(holiday.date) ? 'text-white' : 'text-heading-light dark:text-heading-dark'
              }`}>
                {new Date(holiday.date).getDate()}
              </div>
              <div className={`text-xs uppercase ${
                isToday(holiday.date) ? 'text-white' : 'text-subtext-light dark:text-subtext-dark'
              }`}>
                {new Date(holiday.date).toLocaleDateString('en-US', { month: 'short' })}
              </div>
            </div>

            {/* Holiday Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-heading-light dark:text-heading-dark flex items-center gap-2">
                    {holiday.name}
                    {isToday(holiday.date) && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary text-white">
                        Today
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-subtext-light dark:text-subtext-dark mt-1">
                    {getDayOfWeek(holiday.date)}
                  </p>
                  {holiday.description && (
                    <p className="text-sm text-text-light dark:text-text-dark mt-2">
                      {holiday.description}
                    </p>
                  )}
                </div>
                
                {/* Holiday Type Badge */}
                {holiday.type && (
                  <span className="flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
                    {holiday.type}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

UpcomingHolidays.propTypes = {
  holidays: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      description: PropTypes.string,
      type: PropTypes.string,
    })
  ),
};

export default UpcomingHolidays;
