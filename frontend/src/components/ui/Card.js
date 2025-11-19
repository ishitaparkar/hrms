import React from 'react';
import PropTypes from 'prop-types';

/**
 * Card Component
 * 
 * A standardized card component for content display with consistent styling.
 * 
 * @param {React.ReactNode} children - The content to display inside the card
 * @param {string} title - Optional card title
 * @param {string} icon - Optional Material Icons icon name to display before the title
 * @param {React.ReactNode} actions - Optional action buttons or elements to display in the header
 * @param {string} className - Optional additional CSS classes
 * @param {boolean} noPadding - If true, removes default padding (useful for tables or custom layouts)
 * @param {boolean} hover - If true, adds hover effect
 */
const Card = ({ 
  children, 
  title, 
  icon, 
  actions, 
  className = '', 
  noPadding = false,
  hover = false 
}) => {
  const hoverClass = hover ? 'hover:shadow-md transition-shadow' : '';
  const paddingClass = noPadding ? '' : 'p-6';
  
  return (
    <div className={`bg-card-light dark:bg-card-dark rounded-xl shadow-sm ${hoverClass} ${className}`}>
      {(title || actions) && (
        <div className={`flex items-center justify-between ${noPadding ? 'p-6 pb-4' : 'pb-4 border-b border-border-light dark:border-border-dark'}`}>
          {title && (
            <h3 className="text-lg font-semibold text-heading-light dark:text-heading-dark flex items-center gap-2">
              {icon && (
                <span className="material-icons text-primary">{icon}</span>
              )}
              {title}
            </h3>
          )}
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className={paddingClass}>
        {children}
      </div>
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  icon: PropTypes.string,
  actions: PropTypes.node,
  className: PropTypes.string,
  noPadding: PropTypes.bool,
  hover: PropTypes.bool,
};

export default Card;
