import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PasswordInput from '../PasswordInput';

describe('PasswordInput Component', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders password input field', () => {
      render(
        <PasswordInput
          value=""
          onChange={mockOnChange}
        />
      );

      const input = screen.getByPlaceholderText('Enter password');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'password');
    });

    test('renders with custom label', () => {
      render(
        <PasswordInput
          value=""
          onChange={mockOnChange}
          label="Password"
        />
      );

      expect(screen.getByText('Password')).toBeInTheDocument();
    });

    test('renders with required indicator when required prop is true', () => {
      render(
        <PasswordInput
          value=""
          onChange={mockOnChange}
          label="Password"
          required={true}
        />
      );

      const requiredIndicator = screen.getByText('*');
      expect(requiredIndicator).toBeInTheDocument();
      expect(requiredIndicator).toHaveClass('text-red-500');
    });

    test('renders with custom placeholder', () => {
      render(
        <PasswordInput
          value=""
          onChange={mockOnChange}
          placeholder="Enter your password"
        />
      );

      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    });

    test('renders visibility toggle button', () => {
      render(
        <PasswordInput
          value=""
          onChange={mockOnChange}
        />
      );

      const toggleButton = screen.getByRole('button', { name: /show password/i });
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('Visibility Toggle Functionality', () => {
    test('toggles password visibility when eye icon is clicked', () => {
      render(
        <PasswordInput
          value="testpassword"
          onChange={mockOnChange}
        />
      );

      const input = screen.getByPlaceholderText('Enter password');
      const toggleButton = screen.getByRole('button', { name: /show password/i });

      // Initially password should be hidden
      expect(input).toHaveAttribute('type', 'password');
      expect(screen.getByText('visibility')).toBeInTheDocument();

      // Click to show password
      fireEvent.click(toggleButton);
      expect(input).toHaveAttribute('type', 'text');
      expect(screen.getByText('visibility_off')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();

      // Click again to hide password
      fireEvent.click(toggleButton);
      expect(input).toHaveAttribute('type', 'password');
      expect(screen.getByText('visibility')).toBeInTheDocument();
    });

    test('visibility toggle button is disabled when input is disabled', () => {
      render(
        <PasswordInput
          value=""
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const toggleButton = screen.getByRole('button', { name: /show password/i });
      expect(toggleButton).toBeDisabled();
    });
  });

  describe('Input Value Changes', () => {
    test('calls onChange handler when input value changes', () => {
      render(
        <PasswordInput
          value=""
          onChange={mockOnChange}
        />
      );

      const input = screen.getByPlaceholderText('Enter password');
      fireEvent.change(input, { target: { value: 'newpassword' } });

      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    test('displays the provided value', () => {
      render(
        <PasswordInput
          value="mypassword"
          onChange={mockOnChange}
        />
      );

      const input = screen.getByPlaceholderText('Enter password');
      expect(input).toHaveValue('mypassword');
    });

    test('input is disabled when disabled prop is true', () => {
      render(
        <PasswordInput
          value=""
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const input = screen.getByPlaceholderText('Enter password');
      expect(input).toBeDisabled();
    });
  });

  describe('Error Display', () => {
    test('displays error message when error prop is provided', () => {
      render(
        <PasswordInput
          value=""
          onChange={mockOnChange}
          error="Password is required"
        />
      );

      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

    test('applies error styling when error prop is provided', () => {
      render(
        <PasswordInput
          value=""
          onChange={mockOnChange}
          error="Invalid password"
        />
      );

      const input = screen.getByPlaceholderText('Enter password');
      expect(input).toHaveClass('border-red-500');
    });
  });

  describe('Password Strength Indicator', () => {
    test('does not show strength indicator by default', () => {
      render(
        <PasswordInput
          value="password123"
          onChange={mockOnChange}
        />
      );

      expect(screen.queryByText(/Password Strength:/i)).not.toBeInTheDocument();
    });

    test('shows strength indicator when showStrengthIndicator is true', () => {
      render(
        <PasswordInput
          value="password"
          onChange={mockOnChange}
          showStrengthIndicator={true}
        />
      );

      expect(screen.getByText(/Password Strength:/i)).toBeInTheDocument();
    });

    test('displays "Weak" for passwords with low strength', () => {
      render(
        <PasswordInput
          value="pass"
          onChange={mockOnChange}
          showStrengthIndicator={true}
        />
      );

      expect(screen.getByText('Weak')).toBeInTheDocument();
    });

    test('displays "Fair" for passwords with medium strength', () => {
      render(
        <PasswordInput
          value="password1"
          onChange={mockOnChange}
          showStrengthIndicator={true}
        />
      );

      expect(screen.getByText('Fair')).toBeInTheDocument();
    });

    test('displays "Good" for passwords with good strength', () => {
      render(
        <PasswordInput
          value="Password123"
          onChange={mockOnChange}
          showStrengthIndicator={true}
        />
      );

      expect(screen.getByText('Good')).toBeInTheDocument();
    });

    test('displays "Strong" for passwords with strong strength', () => {
      render(
        <PasswordInput
          value="Password123!"
          onChange={mockOnChange}
          showStrengthIndicator={true}
        />
      );

      expect(screen.getByText('Strong')).toBeInTheDocument();
    });

    test('does not show strength indicator when password is empty', () => {
      render(
        <PasswordInput
          value=""
          onChange={mockOnChange}
          showStrengthIndicator={true}
        />
      );

      expect(screen.queryByText(/Password Strength:/i)).not.toBeInTheDocument();
    });

    test('strength indicator updates when password changes', () => {
      const { rerender } = render(
        <PasswordInput
          value="weak"
          onChange={mockOnChange}
          showStrengthIndicator={true}
        />
      );

      expect(screen.getByText('Weak')).toBeInTheDocument();

      // Update password to strong
      rerender(
        <PasswordInput
          value="StrongPass123!"
          onChange={mockOnChange}
          showStrengthIndicator={true}
        />
      );

      expect(screen.getByText('Strong')).toBeInTheDocument();
      expect(screen.queryByText('Weak')).not.toBeInTheDocument();
    });

    test('strength indicator bar width reflects password strength', () => {
      const { container } = render(
        <PasswordInput
          value="Password123!"
          onChange={mockOnChange}
          showStrengthIndicator={true}
        />
      );

      // Strong password should have 100% width (4/4 * 100)
      const strengthBar = container.querySelector('.h-2.rounded-full.transition-all');
      expect(strengthBar).toHaveStyle({ width: '100%' });
    });
  });

  describe('Accessibility', () => {
    test('has proper aria-label for visibility toggle', () => {
      render(
        <PasswordInput
          value=""
          onChange={mockOnChange}
        />
      );

      const toggleButton = screen.getByRole('button', { name: /show password/i });
      expect(toggleButton).toHaveAttribute('aria-label', 'Show password');
    });

    test('updates aria-label when password is visible', () => {
      render(
        <PasswordInput
          value=""
          onChange={mockOnChange}
        />
      );

      const toggleButton = screen.getByRole('button', { name: /show password/i });
      fireEvent.click(toggleButton);

      expect(toggleButton).toHaveAttribute('aria-label', 'Hide password');
    });

    test('input has proper id and name attributes', () => {
      render(
        <PasswordInput
          value=""
          onChange={mockOnChange}
          id="custom-password"
          name="custom-name"
        />
      );

      const input = screen.getByPlaceholderText('Enter password');
      expect(input).toHaveAttribute('id', 'custom-password');
      expect(input).toHaveAttribute('name', 'custom-name');
    });

    test('label is associated with input via htmlFor', () => {
      render(
        <PasswordInput
          value=""
          onChange={mockOnChange}
          id="password-field"
          label="Password"
        />
      );

      const label = screen.getByText('Password');
      expect(label).toHaveAttribute('for', 'password-field');
    });
  });

  describe('Custom Styling', () => {
    test('applies custom className to container', () => {
      const { container } = render(
        <PasswordInput
          value=""
          onChange={mockOnChange}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
