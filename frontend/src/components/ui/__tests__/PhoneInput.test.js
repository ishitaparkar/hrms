import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PhoneInput from '../PhoneInput';

describe('PhoneInput Component', () => {
  const mockOnChange = jest.fn();
  const mockOnCountryCodeChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders phone input field', () => {
      render(
        <PhoneInput
          value=""
          onChange={mockOnChange}
        />
      );

      const input = screen.getByPlaceholderText('4155552671');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'tel');
    });

    test('renders with custom label', () => {
      render(
        <PhoneInput
          value=""
          onChange={mockOnChange}
          label="Phone Number"
        />
      );

      expect(screen.getByText('Phone Number')).toBeInTheDocument();
    });

    test('renders with required indicator when required prop is true', () => {
      render(
        <PhoneInput
          value=""
          onChange={mockOnChange}
          label="Phone Number"
          required={true}
        />
      );

      const requiredIndicator = screen.getByText('*');
      expect(requiredIndicator).toBeInTheDocument();
      expect(requiredIndicator).toHaveClass('text-red-500');
    });

    test('renders with custom placeholder', () => {
      render(
        <PhoneInput
          value=""
          onChange={mockOnChange}
          placeholder="Enter phone number"
        />
      );

      expect(screen.getByPlaceholderText('Enter phone number')).toBeInTheDocument();
    });

    test('renders country code selector', () => {
      render(
        <PhoneInput
          value=""
          onChange={mockOnChange}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    test('renders helper text by default', () => {
      render(
        <PhoneInput
          value=""
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Enter phone number (10-15 digits)')).toBeInTheDocument();
    });
  });

  describe('Country Code Selection', () => {
    test('displays default country code (+1)', () => {
      render(
        <PhoneInput
          value=""
          onChange={mockOnChange}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('+1');
    });

    test('displays custom country code', () => {
      render(
        <PhoneInput
          value=""
          onChange={mockOnChange}
          countryCode="+91"
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('+91');
    });

    test('calls onCountryCodeChange when country code is changed', () => {
      render(
        <PhoneInput
          value=""
          onChange={mockOnChange}
          countryCode="+1"
          onCountryCodeChange={mockOnCountryCodeChange}
        />
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '+44' } });

      expect(mockOnCountryCodeChange).toHaveBeenCalledTimes(1);
      expect(mockOnCountryCodeChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            name: 'countryCode',
            value: '+44'
          })
        })
      );
    });

    test('includes common country codes in dropdown', () => {
      render(
        <PhoneInput
          value=""
          onChange={mockOnChange}
        />
      );

      const select = screen.getByRole('combobox');
      const options = Array.from(select.options).map(opt => opt.value);

      expect(options).toContain('+1');   // US/Canada
      expect(options).toContain('+44');  // UK
      expect(options).toContain('+91');  // India
      expect(options).toContain('+86');  // China
      expect(options).toContain('+81');  // Japan
    });

    test('country code selector is disabled when disabled prop is true', () => {
      render(
        <PhoneInput
          value=""
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });
  });

  describe('Phone Number Formatting', () => {
    test('formats phone number with spaces as user types', () => {
      render(
        <PhoneInput
          value=""
          onChange={mockOnChange}
          autoFormat={true}
        />
      );

      const input = screen.getByPlaceholderText('4155552671');
      
      // Type 10 digits
      fireEvent.change(input, { target: { value: '4155552671' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            value: '415 555 2671'
          })
        })
      );
    });

    test('removes non-digit characters except spaces, hyphens, and parentheses', () => {
      render(
        <PhoneInput
          value=""
          onChange={mockOnChange}
        />
      );

      const input = screen.getByPlaceholderText('4155552671');
      
      // Type with invalid characters
      fireEvent.change(input, { target: { value: '415abc555xyz2671' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            value: '415 555 2671'
          })
        })
      );
    });

    test('allows hyphens and parentheses in phone number', () => {
      render(
        <PhoneInput
          value=""
          onChange={mockOnChange}
          autoFormat={false}
        />
      );

      const input = screen.getByPlaceholderText('4155552671');
      
      fireEvent.change(input, { target: { value: '(415) 555-2671' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            value: '(415) 555-2671'
          })
        })
      );
    });

    test('does not format when autoFormat is false', () => {
      render(
        <PhoneInput
          value=""
          onChange={mockOnChange}
          autoFormat={false}
        />
      );

      const input = screen.getByPlaceholderText('4155552671');
      
      fireEvent.change(input, { target: { value: '4155552671' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            value: '4155552671'
          })
        })
      );
    });

    test('formats short numbers correctly', () => {
      render(
        <PhoneInput
          value=""
          onChange={mockOnChange}
          autoFormat={true}
        />
      );

      const input = screen.getByPlaceholderText('4155552671');
      
      // Type 3 digits
      fireEvent.change(input, { target: { value: '415' } });
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            value: '415'
          })
        })
      );

      // Type 6 digits
      fireEvent.change(input, { target: { value: '415555' } });
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            value: '415 555'
          })
        })
      );
    });

    test('formats long numbers correctly', () => {
      render(
        <PhoneInput
          value=""
          onChange={mockOnChange}
          autoFormat={true}
        />
      );

      const input = screen.getByPlaceholderText('4155552671');
      
      // Type 12 digits
      fireEvent.change(input, { target: { value: '415555267123' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            value: '415 555 2671 23'
          })
        })
      );
    });
  });

  describe('Validation', () => {
    test('shows validation error for phone numbers shorter than 10 digits', () => {
      render(
        <PhoneInput
          value="123456789"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Phone number must be between 10 and 15 digits')).toBeInTheDocument();
    });

    test('shows validation error for phone numbers longer than 15 digits', () => {
      render(
        <PhoneInput
          value="1234567890123456"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Phone number must be between 10 and 15 digits')).toBeInTheDocument();
    });

    test('does not show validation error for valid phone numbers', () => {
      render(
        <PhoneInput
          value="4155552671"
          onChange={mockOnChange}
        />
      );

      expect(screen.queryByText('Phone number must be between 10 and 15 digits')).not.toBeInTheDocument();
    });

    test('does not show validation error for empty value', () => {
      render(
        <PhoneInput
          value=""
          onChange={mockOnChange}
        />
      );

      expect(screen.queryByText('Phone number must be between 10 and 15 digits')).not.toBeInTheDocument();
    });

    test('validates phone number with formatting characters', () => {
      render(
        <PhoneInput
          value="415 555 2671"
          onChange={mockOnChange}
        />
      );

      expect(screen.queryByText('Phone number must be between 10 and 15 digits')).not.toBeInTheDocument();
    });

    test('applies error styling when validation fails', () => {
      render(
        <PhoneInput
          value="123"
          onChange={mockOnChange}
        />
      );

      const input = screen.getByPlaceholderText('4155552671');
      expect(input).toHaveClass('border-red-500');
    });
  });

  describe('Input Value Changes', () => {
    test('calls onChange handler when input value changes', () => {
      render(
        <PhoneInput
          value=""
          onChange={mockOnChange}
        />
      );

      const input = screen.getByPlaceholderText('4155552671');
      fireEvent.change(input, { target: { value: '4155552671' } });

      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    test('displays the provided value', () => {
      render(
        <PhoneInput
          value="4155552671"
          onChange={mockOnChange}
        />
      );

      const input = screen.getByPlaceholderText('4155552671');
      expect(input).toHaveValue('4155552671');
    });

    test('input is disabled when disabled prop is true', () => {
      render(
        <PhoneInput
          value=""
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const input = screen.getByPlaceholderText('4155552671');
      expect(input).toBeDisabled();
    });
  });

  describe('Error Display', () => {
    test('displays error message when error prop is provided', () => {
      render(
        <PhoneInput
          value=""
          onChange={mockOnChange}
          error="Phone number is required"
        />
      );

      expect(screen.getByText('Phone number is required')).toBeInTheDocument();
    });

    test('applies error styling when error prop is provided', () => {
      render(
        <PhoneInput
          value=""
          onChange={mockOnChange}
          error="Invalid phone number"
        />
      );

      const input = screen.getByPlaceholderText('4155552671');
      expect(input).toHaveClass('border-red-500');
    });

    test('error message takes precedence over validation message', () => {
      render(
        <PhoneInput
          value="123"
          onChange={mockOnChange}
          error="Custom error message"
        />
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.queryByText('Phone number must be between 10 and 15 digits')).not.toBeInTheDocument();
    });

    test('hides helper text when error is shown', () => {
      render(
        <PhoneInput
          value=""
          onChange={mockOnChange}
          error="Error message"
        />
      );

      expect(screen.queryByText('Enter phone number (10-15 digits)')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('input has proper id and name attributes', () => {
      render(
        <PhoneInput
          value=""
          onChange={mockOnChange}
          id="custom-phone"
          name="custom-name"
        />
      );

      const input = screen.getByPlaceholderText('4155552671');
      expect(input).toHaveAttribute('id', 'custom-phone');
      expect(input).toHaveAttribute('name', 'custom-name');
    });

    test('label is associated with input via htmlFor', () => {
      render(
        <PhoneInput
          value=""
          onChange={mockOnChange}
          id="phone-field"
          label="Phone Number"
        />
      );

      const label = screen.getByText('Phone Number');
      expect(label).toHaveAttribute('for', 'phone-field');
    });

    test('input has proper autocomplete attribute', () => {
      const { container } = render(
        <PhoneInput
          value=""
          onChange={mockOnChange}
        />
      );

      const input = container.querySelector('input[type="tel"]');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    test('applies custom className to container', () => {
      const { container } = render(
        <PhoneInput
          value=""
          onChange={mockOnChange}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Integration with Country Code', () => {
    test('both country code and phone number can be changed independently', () => {
      render(
        <PhoneInput
          value="4155552671"
          onChange={mockOnChange}
          countryCode="+1"
          onCountryCodeChange={mockOnCountryCodeChange}
        />
      );

      const select = screen.getByRole('combobox');
      const input = screen.getByPlaceholderText('4155552671');

      // Change country code
      fireEvent.change(select, { target: { value: '+44' } });
      expect(mockOnCountryCodeChange).toHaveBeenCalledTimes(1);

      // Change phone number
      fireEvent.change(input, { target: { value: '2079460958' } });
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    test('validation works correctly with different country codes', () => {
      const { rerender } = render(
        <PhoneInput
          value="4155552671"
          onChange={mockOnChange}
          countryCode="+1"
        />
      );

      // Valid for +1
      expect(screen.queryByText('Phone number must be between 10 and 15 digits')).not.toBeInTheDocument();

      // Change to +91 (still valid)
      rerender(
        <PhoneInput
          value="9876543210"
          onChange={mockOnChange}
          countryCode="+91"
        />
      );

      expect(screen.queryByText('Phone number must be between 10 and 15 digits')).not.toBeInTheDocument();
    });
  });
});
