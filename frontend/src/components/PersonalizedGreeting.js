import React from 'react';
import { usePermission } from '../contexts/PermissionContext';

/**
 * PersonalizedGreeting Component
 * 
 * Displays a personalized greeting using the employee's name from the auth context.
 * Supports two variants:
 * - 'short': "Hi, FirstName"
 * - 'full': "Welcome Back, FirstName LastName"
 * 
 * Falls back to "Hi, User" when name is unavailable.
 * 
 * @param {Object} props - Component props
 * @param {string} props.variant - Display variant: 'short' or 'full' (default: 'short')
 * @param {string} props.className - Additional CSS classes for customization
 */
const PersonalizedGreeting = ({ variant = 'short', className = '' }) => {
  const { userData } = usePermission();
  
  // Extract employee name data with fallback values
  const { firstName, lastName, fullName } = userData || {};
  
  // Determine the greeting text based on variant and available data
  const getGreetingText = () => {
    if (variant === 'full') {
      // Full variant: "Welcome Back, FirstName LastName"
      if (fullName) {
        return `Welcome Back, ${fullName}`;
      } else if (firstName && lastName) {
        return `Welcome Back, ${firstName} ${lastName}`;
      } else if (firstName) {
        return `Welcome Back, ${firstName}`;
      }
      return 'Welcome Back, User';
    } else {
      // Short variant: "Hi, FirstName"
      if (firstName) {
        return `Hi, ${firstName}`;
      }
      return 'Hi, User';
    }
  };
  
  const greetingText = getGreetingText();
  
  return (
    <div 
      className={`personalized-greeting text-text-light dark:text-text-dark ${className}`}
      role="heading"
      aria-level="2"
    >
      {greetingText}
    </div>
  );
};

export default PersonalizedGreeting;
