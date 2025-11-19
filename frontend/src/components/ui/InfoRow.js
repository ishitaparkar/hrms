import React from 'react';
import PropTypes from 'prop-types';

/**
 * InfoRow Component
 * 
 * A component for displaying a single row of information with an icon, label, and value.
 * Typically used inside InfoCard components.
 * 
 * @param {string} icon - Material Icons icon name to display
 * @param {string} label - The label text (e.g., "Email", "Phone")
 * @param {string|React.ReactNode} value - The value to display (can be text or a React element like a badge)
 * @param {string} className - Optional additional CSS classes
 */
const InfoRow = ({ icon, label, value, className = '' }) => {
  return (
    <div className={`flex items-start ${className}`}>
      <span className="material-icons text-primary text-lg mr-3 mt-1">{icon}</span>
      <div className="flex-1">
        <p className="text-sm text-subtext-light dark:text-subtext-dark">{label}</p>
        <div className="font-medium text-text-light dark:text-text-dark mt-1">
          {value}
        </div>
      </div>
    </div>
  );
};

InfoRow.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.node,
  ]).isRequired,
  className: PropTypes.string,
};

export default InfoRow;
