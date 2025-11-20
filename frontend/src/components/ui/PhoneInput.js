import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * PhoneInput Component
 * 
 * A phone number input field with country code selector and validation.
 * 
 * @param {string} value - The phone number value (without country code)
 * @param {function} onChange - Change handler function for phone number
 * @param {string} countryCode - The selected country code (e.g., '+1', '+91')
 * @param {function} onCountryCodeChange - Change handler function for country code
 * @param {string} id - Input field ID
 * @param {string} name - Input field name
 * @param {string} placeholder - Placeholder text
 * @param {boolean} required - If true, field is required
 * @param {boolean} disabled - If true, field is disabled
 * @param {string} className - Optional additional CSS classes
 * @param {string} label - Optional label text
 * @param {string} error - Optional error message to display
 * @param {boolean} autoFormat - If true, automatically formats phone number
 */
const PhoneInput = ({
  value = '',
  onChange,
  countryCode = '+1',
  onCountryCodeChange,
  id = 'phone',
  name = 'phone',
  placeholder = '4155552671',
  required = false,
  disabled = false,
  className = '',
  label = '',
  error = '',
  autoFormat = true,
}) => {
  // Common country codes
  const countryCodes = [
    { code: '+1', name: 'US/Canada', flag: '🇺🇸' },
    { code: '+44', name: 'UK', flag: '🇬🇧' },
    { code: '+91', name: 'India', flag: '🇮🇳' },
    { code: '+86', name: 'China', flag: '🇨🇳' },
    { code: '+81', name: 'Japan', flag: '🇯🇵' },
    { code: '+49', name: 'Germany', flag: '🇩🇪' },
    { code: '+33', name: 'France', flag: '🇫🇷' },
    { code: '+61', name: 'Australia', flag: '🇦🇺' },
    { code: '+55', name: 'Brazil', flag: '🇧🇷' },
    { code: '+7', name: 'Russia', flag: '🇷🇺' },
    { code: '+27', name: 'South Africa', flag: '🇿🇦' },
    { code: '+52', name: 'Mexico', flag: '🇲🇽' },
    { code: '+34', name: 'Spain', flag: '🇪🇸' },
    { code: '+39', name: 'Italy', flag: '🇮🇹' },
    { code: '+82', name: 'South Korea', flag: '🇰🇷' },
  ];

  // Format phone number as user types
  const formatPhoneNumber = (input) => {
    if (!autoFormat) return input;

    // Remove all non-digit characters
    const digits = input.replace(/\D/g, '');

    // Format based on length
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    } else if (digits.length <= 10) {
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    } else {
      // For longer numbers, add spaces every 3-4 digits
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}${digits.length > 10 ? ' ' + digits.slice(10) : ''}`;
    }
  };

  const handlePhoneChange = (e) => {
    const input = e.target.value;
    // Allow only digits, spaces, hyphens, and parentheses
    const sanitized = input.replace(/[^\d\s\-\(\)]/g, '');
    const formatted = formatPhoneNumber(sanitized);
    
    // Call onChange with formatted value
    onChange({ target: { name, value: formatted } });
  };

  const handleCountryCodeChange = (e) => {
    const newCode = e.target.value;
    if (onCountryCodeChange) {
      onCountryCodeChange({ target: { name: 'countryCode', value: newCode } });
    }
  };

  // Validate phone number
  const validatePhone = (phone, code) => {
    if (!phone) return true; // Empty is valid if not required
    
    // Remove formatting characters
    const digits = phone.replace(/\D/g, '');
    
    // Check length (10-15 digits)
    if (digits.length < 10 || digits.length > 15) {
      return false;
    }
    
    return true;
  };

  const isValid = validatePhone(value, countryCode);
  const showValidation = value && !isValid && !error;

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

      <div className="flex gap-2">
        {/* Country Code Selector */}
        <select
          value={countryCode}
          onChange={handleCountryCodeChange}
          disabled={disabled}
          className={`
            px-3 py-2
            border rounded-md
            bg-white dark:bg-gray-800
            text-text-light dark:text-text-dark
            border-border-light dark:border-border-dark
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed
            ${error || showValidation ? 'border-red-500 focus:ring-red-500' : ''}
          `}
          style={{ minWidth: '120px' }}
        >
          {countryCodes.map((country) => (
            <option key={country.code} value={country.code}>
              {country.flag} {country.code}
            </option>
          ))}
        </select>

        {/* Phone Number Input */}
        <div className="flex-1 relative">
          <input
            id={id}
            name={name}
            type="tel"
            value={value}
            onChange={handlePhoneChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={`
              w-full px-3 py-2
              border rounded-md
              bg-white dark:bg-gray-800
              text-text-light dark:text-text-dark
              border-border-light dark:border-border-dark
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
              disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed
              ${error || showValidation ? 'border-red-500 focus:ring-red-500' : ''}
            `}
          />
        </div>
      </div>

      {/* Helper text */}
      {!error && !showValidation && (
        <p className="mt-1 text-xs text-subtext-light dark:text-subtext-dark">
          Enter phone number (10-15 digits)
        </p>
      )}

      {/* Validation error */}
      {showValidation && (
        <p className="mt-1 text-sm text-red-500">
          Phone number must be between 10 and 15 digits
        </p>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

PhoneInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  countryCode: PropTypes.string,
  onCountryCodeChange: PropTypes.func,
  id: PropTypes.string,
  name: PropTypes.string,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  label: PropTypes.string,
  error: PropTypes.string,
  autoFormat: PropTypes.bool,
};

export default PhoneInput;
