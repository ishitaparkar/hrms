import React from 'react';
import PropTypes from 'prop-types';
import Card from '../ui/Card';

const AchievementsSection = ({ achievements }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (!achievements || achievements.length === 0) {
    return (
      <Card title="Achievements & Awards" icon="emoji_events">
        <div className="text-center py-12">
          <span className="material-icons text-subtext-light text-6xl mb-4">emoji_events</span>
          <p className="text-text-light dark:text-text-dark font-medium mb-2">
            No achievements yet
          </p>
          <p className="text-sm text-subtext-light">
            Your achievements and awards will appear here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Achievements & Awards" icon="emoji_events">
      <div className="space-y-4">
        {achievements.map((achievement) => (
          <div 
            key={achievement.id}
            className="flex items-start gap-4 p-4 border border-border-light dark:border-border-dark rounded-lg hover:shadow-md transition-shadow"
          >
            {/* Trophy Icon */}
            <div className="flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                <span className="material-icons text-white text-2xl">emoji_events</span>
              </div>
            </div>

            {/* Achievement Details */}
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-semibold text-heading-light dark:text-heading-dark mb-1">
                {achievement.title}
              </h4>
              <p className="text-sm text-text-light dark:text-text-dark mb-3">
                {achievement.description}
              </p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-subtext-light">
                <div className="flex items-center gap-1">
                  <span className="material-icons text-primary text-lg">event</span>
                  <span>{formatDate(achievement.date)}</span>
                </div>
                {achievement.awardedBy && (
                  <div className="flex items-center gap-1">
                    <span className="material-icons text-primary text-lg">person</span>
                    <span>Awarded by: {achievement.awardedBy}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Badge */}
            <div className="flex-shrink-0 hidden sm:block">
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                Award
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

AchievementsSection.propTypes = {
  achievements: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      awardedBy: PropTypes.string,
    })
  ),
};

export default AchievementsSection;
