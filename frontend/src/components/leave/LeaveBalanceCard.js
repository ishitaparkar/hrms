import React from 'react';
import PropTypes from 'prop-types';
import Card from '../ui/Card';

/**
 * LeaveBalanceCard Component
 * 
 * Displays leave balance information for a specific leave type
 * 
 * @param {Object} balance - Leave balance data
 * @param {string} balance.leaveType - Type of leave (e.g., "Casual Leave", "Sick Leave")
 * @param {number} balance.total - Total leave days allocated
 * @param {number} balance.used - Number of days used
 * @param {number} balance.remaining - Number of days remaining
 */
const LeaveBalanceCard = ({ balance }) => {
  if (!balance) return null;

  const { leaveType = 'Leave', total = 0, used = 0, remaining = 0 } = balance;
  
  // Calculate percentage used
  const percentageUsed = total > 0 ? (used / total) * 100 : 0;
  
  // Determine color based on remaining days
  const getColorClass = () => {
    const percentageRemaining = (remaining / total) * 100;
    if (percentageRemaining > 50) return 'bg-green-500';
    if (percentageRemaining > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Get icon based on leave type
  const getLeaveIcon = () => {
    if (!leaveType) return 'event_busy';
    const lowerType = leaveType.toLowerCase();
    if (lowerType.includes('casual')) return 'beach_access';
    if (lowerType.includes('sick')) return 'local_hospital';
    if (lowerType.includes('vacation') || lowerType.includes('earned')) return 'flight_takeoff';
    return 'event_busy';
  };

  return (
    <Card className="h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <span className="material-icons text-primary text-2xl">{getLeaveIcon()}</span>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-heading-light dark:text-heading-dark">
              {leaveType}
            </h4>
            <p className="text-sm text-subtext-light dark:text-subtext-dark">
              {remaining} of {total} days remaining
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full transition-all ${getColorClass()}`}
            style={{ width: `${percentageUsed}%` }}
            role="progressbar"
            aria-valuenow={used}
            aria-valuemin="0"
            aria-valuemax={total}
            aria-label={`${used} of ${total} days used`}
          ></div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border-light dark:border-border-dark">
        <div className="text-center">
          <p className="text-2xl font-bold text-heading-light dark:text-heading-dark">
            {total}
          </p>
          <p className="text-xs text-subtext-light dark:text-subtext-dark mt-1">
            Total
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-500">
            {used}
          </p>
          <p className="text-xs text-subtext-light dark:text-subtext-dark mt-1">
            Used
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-500">
            {remaining}
          </p>
          <p className="text-xs text-subtext-light dark:text-subtext-dark mt-1">
            Available
          </p>
        </div>
      </div>
    </Card>
  );
};

LeaveBalanceCard.propTypes = {
  balance: PropTypes.shape({
    leaveType: PropTypes.string.isRequired,
    total: PropTypes.number.isRequired,
    used: PropTypes.number.isRequired,
    remaining: PropTypes.number.isRequired,
  }).isRequired,
};

export default LeaveBalanceCard;
