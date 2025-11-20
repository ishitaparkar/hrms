import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * PasswordInput Component
 * 
 * A password input field with visibility toggle and strength indicator.
 * 
 * @param {string} value - The password value
 * @param {function} onChange - Change handler function
 * @param {string} id - Input field ID
 * @param {string} name - Input field name
 * @param {string} placeholder - Placeholder text
 * @param {boolean} required - If true, field is required
 * @param {boolean} disabled - If true, field is disabled
 * @param {boolean} showStrengthIndicator - If true, displays password strength indicator
 * @param {string} className - Optional additional CSS classes
 * @param {string} label - Optional label text
 * @param {string} error - Optional error message to display
 */
const PasswordInput = ({
  value = '',
  onChange,
  id = 'password',
  name = 'password',
  placeholder = 'Enter password',
  required = false,
  disabled = false,
  showStrengthIndicator = false,
  className = '',
  label = '',
  error = '',
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    // Count passed checks
    Object.values(checks).forEach((passed) => {
      if (passed) strength++;
    });

    // Determine strength level
    if (strength <= 2) {
      return { strength: 1, label: 'Weak', color: 'bg-red-500' };
    } else if (strength === 3) {
      return { strength: 2, label: 'Fair', color: 'bg-yellow-500' };
    } else if (strength === 4) {
      return { strength: 3, label: 'Good', color: 'bg-blue-500' };
    } else {
      return { strength: 4, label: 'Strong', color: 'bg-green-500' };
    }
  };

  const passwordStrength = showStrengthIndicator ? calculatePasswordStrength(value) : null;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-subtext-light dark:text-subtext-dark mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`
            w-full px-3 py-2 pr-10
            border rounded-md
            bg-white dark:bg-gray-800
            text-text-light dark:text-text-dark
            border-border-light dark:border-border-dark
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
          `}
        />

        {/* Eye icon for visibility toggle */}
        <button
          type="button"
          onClick={togglePasswordVisibility}
          disabled={disabled}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          <span className="material-icons text-xl">
            {showPassword ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}

      {/* Password strength indicator */}
      {showStrengthIndicator && value && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-subtext-light dark:text-subtext-dark">
              Password Strength:
            </span>
            <span className={`text-xs font-medium ${
              passwordStrength.strength === 1 ? 'text-red-500' :
              passwordStrength.strength === 2 ? 'text-yellow-500' :
              passwordStrength.strength === 3 ? 'text-blue-500' :
              'text-green-500'
            }`}>
              {passwordStrength.label}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
              style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

PasswordInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  id: PropTypes.string,
  name: PropTypes.string,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  showStrengthIndicator: PropTypes.bool,
  className: PropTypes.string,
  label: PropTypes.string,
  error: PropTypes.string,
};

export default PasswordInput;
