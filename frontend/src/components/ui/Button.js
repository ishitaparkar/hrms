import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

/**
 * Button Component
 * 
 * A standardized button component with multiple variants and sizes.
 * 
 * @param {React.ReactNode} children - The button content (text, icons, etc.)
 * @param {string} variant - Button style variant: 'primary', 'secondary', 'danger', 'success', 'outline'
 * @param {string} size - Button size: 'sm', 'md', 'lg'
 * @param {string} icon - Optional Material Icons icon name to display before the text
 * @param {string} iconPosition - Icon position: 'left' or 'right'
 * @param {boolean} fullWidth - If true, button takes full width
 * @param {boolean} disabled - If true, button is disabled
 * @param {string} type - Button type: 'button', 'submit', 'reset'
 * @param {function} onClick - Click handler function
 * @param {string} to - If provided, renders as a Link component (react-router-dom)
 * @param {string} className - Optional additional CSS classes
 */
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon, 
  iconPosition = 'left',
  fullWidth = false, 
  disabled = false, 
  type = 'button',
  onClick,
  to,
  className = '' 
}) => {
  // Base styles
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Variant styles
  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-blue-600 focus:ring-primary',
    secondary: 'bg-gray-200 dark:bg-gray-700 text-text-light dark:text-text-dark hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-gray-400',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    success: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary',
  };
  
  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  // Icon size based on button size
  const iconSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  const combinedClasses = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthClass} ${className}`;
  
  const content = (
    <>
      {icon && iconPosition === 'left' && (
        <span className={`material-icons ${iconSizes[size]} ${children ? 'mr-2' : ''}`}>
          {icon}
        </span>
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <span className={`material-icons ${iconSizes[size]} ${children ? 'ml-2' : ''}`}>
          {icon}
        </span>
      )}
    </>
  );
  
  // Render as Link if 'to' prop is provided
  if (to && !disabled) {
    return (
      <Link to={to} className={combinedClasses}>
        {content}
      </Link>
    );
  }
  
  // Render as button
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedClasses}
    >
      {content}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success', 'outline']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  icon: PropTypes.string,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  onClick: PropTypes.func,
  to: PropTypes.string,
  className: PropTypes.string,
};

export default Button;
