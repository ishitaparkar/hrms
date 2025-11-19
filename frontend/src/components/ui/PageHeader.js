import React from 'react';
import PropTypes from 'prop-types';

/**
 * PageHeader Component
 * 
 * A consistent header component for all pages with title, description, and optional actions.
 * 
 * @param {string} title - The main page title
 * @param {string} description - Optional description text below the title
 * @param {React.ReactNode} actions - Optional action buttons or elements to display on the right
 * @param {string} icon - Optional Material Icons icon name to display before the title
 * @param {string} className - Optional additional CSS classes
 */
const PageHeader = ({ title, description, actions, icon, className = '' }) => {
  return (
    <header className={`bg-card-light dark:bg-card-dark p-6 border-b border-border-light dark:border-border-dark ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-heading-light dark:text-heading-dark flex items-center gap-2">
            {icon && (
              <span className="material-icons text-primary" aria-hidden="true">{icon}</span>
            )}
            {title}
          </h1>
          {description && (
            <p className="text-sm text-subtext-light dark:text-subtext-dark mt-1">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2" role="group" aria-label="Page actions">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
};

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  actions: PropTypes.node,
  icon: PropTypes.string,
  className: PropTypes.string,
};

export default PageHeader;
