import React from 'react';
import PropTypes from 'prop-types';

/**
 * InfoCard Component
 * 
 * A specialized card component for displaying information sections with a title and icon.
 * Commonly used in profile pages and detail views.
 * 
 * @param {string} title - The card title
 * @param {string} icon - Optional Material Icons icon name to display before the title
 * @param {React.ReactNode} children - The content to display inside the card (typically InfoRow components)
 * @param {string} className - Optional additional CSS classes
 */
const InfoCard = ({ title, icon, children, className = '' }) => {
  const cardId = `card-title-${title.replace(/\s+/g, '-').toLowerCase()}`;
  
  return (
    <section 
      className={`bg-background-light dark:bg-background-dark p-6 rounded-lg border border-border-light dark:border-border-dark ${className}`}
      aria-labelledby={cardId}
    >
      <h3 
        id={cardId}
        className="text-lg font-semibold text-text-light dark:text-text-dark mb-4 pb-2 border-b border-border-light dark:border-border-dark flex items-center"
      >
        {icon && <span className="material-icons text-primary mr-2" aria-hidden="true">{icon}</span>}
        {title}
      </h3>
      <div className="space-y-4">
        {children}
      </div>
    </section>
  );
};

InfoCard.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default InfoCard;
