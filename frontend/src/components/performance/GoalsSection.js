import React from 'react';
import PropTypes from 'prop-types';
import Card from '../ui/Card';

const GoalsSection = ({ goals }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'In Progress':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
      case 'Overdue':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!goals || goals.length === 0) {
    return (
      <Card title="Goals & Objectives" icon="flag">
        <div className="text-center py-12">
          <span className="material-icons text-subtext-light text-6xl mb-4">flag</span>
          <p className="text-text-light dark:text-text-dark font-medium mb-2">
            No goals set
          </p>
          <p className="text-sm text-subtext-light">
            You don't have any active goals at the moment.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Goals & Objectives" icon="flag">
      <div className="space-y-6">
        {goals.map((goal) => (
          <div 
            key={goal.id} 
            className="border border-border-light dark:border-border-dark rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            {/* Goal Header */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-heading-light dark:text-heading-dark mb-1">
                  {goal.title}
                </h4>
                <p className="text-sm text-text-light dark:text-text-dark">
                  {goal.description}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(goal.status)}`}>
                {goal.status}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-light dark:text-text-dark">
                  Progress
                </span>
                <span className="text-sm font-bold text-primary">
                  {goal.completionPercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full ${getProgressColor(goal.completionPercentage)} transition-all duration-500 rounded-full`}
                  style={{ width: `${goal.completionPercentage}%` }}
                  role="progressbar"
                  aria-valuenow={goal.completionPercentage}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-label={`Goal progress: ${goal.completionPercentage}%`}
                ></div>
              </div>
            </div>

            {/* Target Date */}
            <div className="flex items-center gap-2 text-sm text-subtext-light">
              <span className="material-icons text-primary text-lg">event</span>
              <span>Target Date: {formatDate(goal.targetDate)}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

GoalsSection.propTypes = {
  goals: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      targetDate: PropTypes.string.isRequired,
      completionPercentage: PropTypes.number.isRequired,
      status: PropTypes.oneOf(['In Progress', 'Completed', 'Overdue']).isRequired,
    })
  ),
};

export default GoalsSection;
