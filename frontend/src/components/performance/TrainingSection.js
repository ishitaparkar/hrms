import React from 'react';
import PropTypes from 'prop-types';
import Card from '../ui/Card';

const TrainingSection = ({ trainings }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!trainings || trainings.length === 0) {
    return (
      <Card title="Training & Development" icon="school">
        <div className="text-center py-12">
          <span className="material-icons text-subtext-light text-6xl mb-4">school</span>
          <p className="text-text-light dark:text-text-dark font-medium mb-2">
            No training completed
          </p>
          <p className="text-sm text-subtext-light">
            Your completed training courses will appear here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Training & Development" icon="school">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trainings.map((training) => (
          <div 
            key={training.id}
            className="border border-border-light dark:border-border-dark rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            {/* Training Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="material-icons text-primary text-xl">school</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-semibold text-heading-light dark:text-heading-dark mb-1">
                  {training.title}
                </h4>
                {training.provider && (
                  <p className="text-xs text-subtext-light">
                    {training.provider}
                  </p>
                )}
              </div>
            </div>

            {/* Training Details */}
            <div className="space-y-2 mb-3">
              {training.description && (
                <p className="text-sm text-text-light dark:text-text-dark">
                  {training.description}
                </p>
              )}
              
              <div className="flex items-center gap-2 text-xs text-subtext-light">
                <span className="material-icons text-primary" style={{ fontSize: '16px' }}>event</span>
                <span>Completed: {formatDate(training.completionDate)}</span>
              </div>

              {training.duration && (
                <div className="flex items-center gap-2 text-xs text-subtext-light">
                  <span className="material-icons text-primary" style={{ fontSize: '16px' }}>schedule</span>
                  <span>Duration: {training.duration}</span>
                </div>
              )}
            </div>

            {/* Certificate Status */}
            <div className="flex items-center justify-between pt-3 border-t border-border-light dark:border-border-dark">
              <div className="flex items-center gap-2">
                <span className="material-icons text-primary text-lg">
                  {training.certificateStatus === 'Available' ? 'verified' : 'pending'}
                </span>
                <span className="text-sm font-medium text-text-light dark:text-text-dark">
                  Certificate
                </span>
              </div>
              {training.certificateStatus === 'Available' ? (
                <button 
                  className="text-xs text-primary hover:text-primary-dark font-medium flex items-center gap-1"
                  onClick={() => {
                    // Handle certificate download
                    console.log('Download certificate for:', training.id);
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '16px' }}>download</span>
                  Download
                </button>
              ) : (
                <span className="text-xs text-subtext-light">
                  {training.certificateStatus || 'Pending'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

TrainingSection.propTypes = {
  trainings: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      provider: PropTypes.string,
      completionDate: PropTypes.string.isRequired,
      duration: PropTypes.string,
      certificateStatus: PropTypes.string,
    })
  ),
};

export default TrainingSection;
