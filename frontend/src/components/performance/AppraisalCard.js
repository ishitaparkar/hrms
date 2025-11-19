import React from 'react';
import PropTypes from 'prop-types';
import Card from '../ui/Card';

const AppraisalCard = ({ appraisal }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600 dark:text-green-400';
    if (rating >= 3.5) return 'text-blue-600 dark:text-blue-400';
    if (rating >= 2.5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getRatingBgColor = (rating) => {
    if (rating >= 4.5) return 'bg-green-100 dark:bg-green-900/30';
    if (rating >= 3.5) return 'bg-blue-100 dark:bg-blue-900/30';
    if (rating >= 2.5) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <span key={i} className="material-icons text-yellow-500">star</span>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <span key={i} className="material-icons text-yellow-500">star_half</span>
        );
      } else {
        stars.push(
          <span key={i} className="material-icons text-gray-300 dark:text-gray-600">star_outline</span>
        );
      }
    }
    return stars;
  };

  return (
    <Card className="border-l-4 border-primary">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-4">
          {/* Rating Display */}
          <div className="flex items-center gap-4">
            <div className={`${getRatingBgColor(appraisal.rating)} ${getRatingColor(appraisal.rating)} rounded-lg px-4 py-3`}>
              <div className="text-3xl font-bold">{appraisal.rating.toFixed(1)}</div>
              <div className="text-xs font-medium">out of 5.0</div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1 mb-2">
                {renderStars(appraisal.rating)}
              </div>
              <p className="text-sm text-subtext-light">
                {formatDate(appraisal.date)}
              </p>
            </div>
          </div>

          {/* Reviewer Info */}
          <div className="flex items-center gap-2 text-sm">
            <span className="material-icons text-primary text-lg">person</span>
            <span className="text-text-light dark:text-text-dark">
              Reviewed by: <span className="font-medium">{appraisal.reviewer}</span>
            </span>
          </div>

          {/* Comments */}
          {appraisal.comments && (
            <div className="bg-background-light dark:bg-background-dark rounded-lg p-4">
              <p className="text-sm text-text-light dark:text-text-dark italic">
                "{appraisal.comments}"
              </p>
            </div>
          )}
        </div>

        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-icons text-primary text-2xl">assessment</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

AppraisalCard.propTypes = {
  appraisal: PropTypes.shape({
    id: PropTypes.number.isRequired,
    rating: PropTypes.number.isRequired,
    date: PropTypes.string.isRequired,
    reviewer: PropTypes.string.isRequired,
    comments: PropTypes.string,
  }).isRequired,
};

export default AppraisalCard;
