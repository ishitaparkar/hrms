import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PasswordSetupPage from '../PasswordSetupPage';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('PasswordSetupPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    // Set up default localStorage values
    localStorage.setItem('setupAuthToken', 'test-auth-token');
    localStorage.setItem('setupUsername', 'john.doe');
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <PasswordSetupPage />
      </BrowserRouter>
    );
  };

  describe('Initial Rendering', () => {
    test('renders page title and description', () => {
      renderComponent();

      expect(screen.getByText(/Create Your Password/i)).toBeInTheDocument();
      expect(screen.getByText(/Choose a strong password to secure your account/i)).toBeInTheDocument();
    });

    test('redirects to phone-auth if no auth token', () => {
      localStorage.removeItem('setupAuthToken');

      renderComponent();

      expect(mockNavigate).toHaveBeenCalledWith('/phone-auth');
    });

    test('redirects to phone-auth if no username', () => {
      localStorage.removeItem('setupUsername');

      renderComponent();

      expect(mockNavigate).toHaveBeenCalledWith('/phone-auth');
    });

    test('renders password input fields', () => {
      renderComponent();

      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Re-enter your password')).toBeInTheDocument();
    });

    test('renders submit button', () => {
      renderComponent();

      expect(screen.getByRole('button', { name: /Complete Setup/i })).toBeInTheDocument();
    });

    test('displays password requirements info box', () => {
      renderComponent();

      expect(screen.getByText(/Your password must contain:/i)).toBeInTheDocument();
      expect(screen.getByText(/At least 8 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/At least one uppercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/At least one lowercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/At least one number/i)).toBeInTheDocument();
      expect(screen.getByText(/At least one special character/i)).toBeInTheDocument();
    });
  });

  describe('Password Validation', () => {
    test('displays validation errors for password shorter than 8 characters', async () => {
      renderComponent();

      const passwordInput = document.getElementById('password');
      fireEvent.change(passwordInput, { target: { value: 'Short1!' } });

      await waitFor(() => {
        expect(screen.getByText(/Password must be at least 8 characters long/i)).toBeInTheDocument();
      });
    });

    test('displays validation error for password without uppercase letter', async () => {
      renderComponent();

      const passwordInput = document.getElementById('password');
      fireEvent.change(passwordInput, { target: { value: 'password123!' } });

      await waitFor(() => {
        expect(screen.getByText(/Password must contain at least one uppercase letter/i)).toBeInTheDocument();
      });
    });

    test('displays validation error for password without lowercase letter', async () => {
      renderComponent();

      const passwordInput = document.getElementById('password');
      fireEvent.change(passwordInput, { target: { value: 'PASSWORD123!' } });

      await waitFor(() => {
        expect(screen.getByText(/Password must contain at least one lowercase letter/i)).toBeInTheDocument();
      });
    });

    test('displays validation error for password without number', async () => {
      renderComponent();

      const passwordInput = document.getElementById('password');
      fireEvent.change(passwordInput, { target: { value: 'Password!' } });

      await waitFor(() => {
        expect(screen.getByText(/Password must contain at least one number/i)).toBeInTheDocument();
      });
    });

    test('displays validation error for password without special character', async () => {
      renderComponent();

      const passwordInput = document.getElementById('password');
      fireEvent.change(passwordInput, { target: { value: 'Password123' } });

      await waitFor(() => {
        expect(screen.getByText(/Password must contain at least one special character/i)).toBeInTheDocument();
      });
    });

    test('displays multiple validation errors for weak password', async () => {
      renderComponent();

      const passwordInput = document.getElementById('password');
      fireEvent.change(passwordInput, { target: { value: 'weak' } });

      await waitFor(() => {
        expect(screen.getByText(/Password must be at least 8 characters long/i)).toBeInTheDocument();
        expect(screen.getByText(/Password must contain at least one uppercase letter/i)).toBeInTheDocument();
        expect(screen.getByText(/Password must contain at least one number/i)).toBeInTheDocument();
        expect(screen.getByText(/Password must contain at least one special character/i)).toBeInTheDocument();
      });
    });

    test('does not display validation errors for strong password', async () => {
      renderComponent();

      const passwordInput = document.getElementById('password');
      fireEvent.change(passwordInput, { target: { value: 'StrongP@ss123' } });

      await waitFor(() => {
        expect(screen.queryByText(/Password must be at least 8 characters long/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Password must contain at least one uppercase letter/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Password must contain at least one lowercase letter/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Password must contain at least one number/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Password must contain at least one special character/i)).not.toBeInTheDocument();
      });
    });

    test('clears validation errors when password field is empty', async () => {
      renderComponent();

      const passwordInput = document.getElementById('password');
      
      // Enter weak password
      fireEvent.change(passwordInput, { target: { value: 'weak' } });
      
      await waitFor(() => {
        expect(screen.getByText(/Password must be at least 8 characters long/i)).toBeInTheDocument();
      });

      // Clear password
      fireEvent.change(passwordInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.queryByText(/Password must be at least 8 characters long/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Password Confirmation Matching', () => {
    test('displays error when passwords do not match on submit', async () => {
      renderComponent();

      const passwordInput = document.getElementById('password');
      const confirmPasswordInput = document.getElementById('confirmPassword');
      const submitButton = screen.getByRole('button', { name: /Complete Setup/i });

      fireEvent.change(passwordInput, { target: { value: 'StrongP@ss123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentP@ss123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const matchTexts = screen.getAllByText(/Passwords do not match/i);
        expect(matchTexts.length).toBeGreaterThan(0);
      });

      expect(axios.post).not.toHaveBeenCalled();
    });

    test('displays match indicator when passwords match', async () => {
      renderComponent();

      const passwordInput = document.getElementById('password');
      const confirmPasswordInput = document.getElementById('confirmPassword');

      fireEvent.change(passwordInput, { target: { value: 'StrongP@ss123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongP@ss123' } });

      await waitFor(() => {
        expect(screen.getByText(/Passwords match/i)).toBeInTheDocument();
      });
    });

    test('displays mismatch indicator when passwords do not match', async () => {
      renderComponent();

      const passwordInput = document.getElementById('password');
      const confirmPasswordInput = document.getElementById('confirmPassword');

      fireEvent.change(passwordInput, { target: { value: 'StrongP@ss123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentP@ss123' } });

      await waitFor(() => {
        expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
      });
    });
  });

  describe('Submit Button State', () => {
    test('disables submit button when password is empty', () => {
      renderComponent();

      const submitButton = screen.getByRole('button', { name: /Complete Setup/i });
      expect(submitButton).toBeDisabled();
    });

    test('disables submit button when confirm password is empty', () => {
      renderComponent();

      const passwordInput = document.getElementById('password');
      fireEvent.change(passwordInput, { target: { value: 'StrongP@ss123' } });

      const submitButton = screen.getByRole('button', { name: /Complete Setup/i });
      expect(submitButton).toBeDisabled();
    });

    test('disables submit button when password has validation errors', async () => {
      renderComponent();

      const passwordInput = document.getElementById('password');
      const confirmPasswordInput = document.getElementById('confirmPassword');

      fireEvent.change(passwordInput, { target: { value: 'weak' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'weak' } });

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /Complete Setup/i });
        expect(submitButton).toBeDisabled();
      });
    });

    test('enables submit button when both passwords are valid and match', async () => {
      renderComponent();

      const passwordInput = document.getElementById('password');
      const confirmPasswordInput = document.getElementById('confirmPassword');

      fireEvent.change(passwordInput, { target: { value: 'StrongP@ss123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongP@ss123' } });

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /Complete Setup/i });
        expect(submitButton).not.toBeDisabled();
      });
    });

    test('disables submit button during submission', async () => {
      axios.post.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderComponent();

      const passwordInput = document.getElementById('password');
      const confirmPasswordInput = document.getElementById('confirmPassword');
      const submitButton = screen.getByRole('button', { name: /Complete Setup/i });

      fireEvent.change(passwordInput, { target: { value: 'StrongP@ss123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongP@ss123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Setting up your account.../i })).toBeDisabled();
      });
    });
  });

  describe('Successful Submission', () => {
    test('calls API with correct data on successful submission', async () => {
      axios.post.mockResolvedValue({
        data: {
          success: true,
          message: 'Account activated successfully',
          user: {
            id: 123,
            username: 'john.doe',
            email: 'john.doe@example.com',
            full_name: 'John Doe',
          },
          token: 'auth-token-123',
        },
      });

      renderComponent();

      const passwordInput = document.getElementById('password');
      const confirmPasswordInput = document.getElementById('confirmPassword');
      const submitButton = screen.getByRole('button', { name: /Complete Setup/i });

      fireEvent.change(passwordInput, { target: { value: 'StrongP@ss123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongP@ss123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          'http://127.0.0.1:8000/api/auth/complete-setup/',
          {
            username: 'john.doe',
            password: 'StrongP@ss123',
            confirm_password: 'StrongP@ss123',
          },
          {
            headers: {
              Authorization: 'Bearer test-auth-token',
            },
          }
        );
      });
    });

    test('stores auth token in localStorage on success', async () => {
      axios.post.mockResolvedValue({
        data: {
          success: true,
          message: 'Account activated successfully',
          user: {
            id: 123,
            username: 'john.doe',
            email: 'john.doe@example.com',
            full_name: 'John Doe',
          },
          token: 'auth-token-123',
        },
      });

      renderComponent();

      const passwordInput = document.getElementById('password');
      const confirmPasswordInput = document.getElementById('confirmPassword');
      const submitButton = screen.getByRole('button', { name: /Complete Setup/i });

      fireEvent.change(passwordInput, { target: { value: 'StrongP@ss123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongP@ss123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe('auth-token-123');
      });
    });

    test('stores user data in localStorage on success', async () => {
      const userData = {
        id: 123,
        username: 'john.doe',
        email: 'john.doe@example.com',
        full_name: 'John Doe',
      };

      axios.post.mockResolvedValue({
        data: {
          success: true,
          message: 'Account activated successfully',
          user: userData,
          token: 'auth-token-123',
        },
      });

      renderComponent();

      const passwordInput = document.getElementById('password');
      const confirmPasswordInput = document.getElementById('confirmPassword');
      const submitButton = screen.getByRole('button', { name: /Complete Setup/i });

      fireEvent.change(passwordInput, { target: { value: 'StrongP@ss123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongP@ss123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(localStorage.getItem('user')).toBe(JSON.stringify(userData));
      });
    });

    test('clears setup-related localStorage data on success', async () => {
      axios.post.mockResolvedValue({
        data: {
          success: true,
          message: 'Account activated successfully',
          user: {
            id: 123,
            username: 'john.doe',
            email: 'john.doe@example.com',
            full_name: 'John Doe',
          },
          token: 'auth-token-123',
        },
      });

      renderComponent();

      const passwordInput = document.getElementById('password');
      const confirmPasswordInput = document.getElementById('confirmPassword');
      const submitButton = screen.getByRole('button', { name: /Complete Setup/i });

      fireEvent.change(passwordInput, { target: { value: 'StrongP@ss123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongP@ss123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(localStorage.getItem('setupAuthToken')).toBeNull();
        expect(localStorage.getItem('setupEmployeeData')).toBeNull();
        expect(localStorage.getItem('setupUsername')).toBeNull();
      });
    });

    test('navigates to dashboard on success', async () => {
      axios.post.mockResolvedValue({
        data: {
          success: true,
          message: 'Account activated successfully',
          user: {
            id: 123,
            username: 'john.doe',
            email: 'john.doe@example.com',
            full_name: 'John Doe',
          },
          token: 'auth-token-123',
        },
      });

      renderComponent();

      const passwordInput = document.getElementById('password');
      const confirmPasswordInput = document.getElementById('confirmPassword');
      const submitButton = screen.getByRole('button', { name: /Complete Setup/i });

      fireEvent.change(passwordInput, { target: { value: 'StrongP@ss123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongP@ss123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Error Handling', () => {
    test('displays validation errors from API response', async () => {
      axios.post.mockRejectedValue({
        response: {
          data: {
            errors: {
              password: ['Password must contain at least one uppercase letter'],
            },
          },
        },
      });

      renderComponent();

      const passwordInput = document.getElementById('password');
      const confirmPasswordInput = document.getElementById('confirmPassword');
      const submitButton = screen.getByRole('button', { name: /Complete Setup/i });

      fireEvent.change(passwordInput, { target: { value: 'StrongP@ss123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongP@ss123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Password must contain at least one uppercase letter/i)).toBeInTheDocument();
      });
    });

    test('displays general error message from API', async () => {
      axios.post.mockRejectedValue({
        response: {
          data: {
            error: 'Token has expired',
          },
        },
      });

      renderComponent();

      const passwordInput = document.getElementById('password');
      const confirmPasswordInput = document.getElementById('confirmPassword');
      const submitButton = screen.getByRole('button', { name: /Complete Setup/i });

      fireEvent.change(passwordInput, { target: { value: 'StrongP@ss123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongP@ss123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Token has expired/i)).toBeInTheDocument();
      });
    });

    test('displays generic error when server is unreachable', async () => {
      axios.post.mockRejectedValue(new Error('Network Error'));

      renderComponent();

      const passwordInput = document.getElementById('password');
      const confirmPasswordInput = document.getElementById('confirmPassword');
      const submitButton = screen.getByRole('button', { name: /Complete Setup/i });

      fireEvent.change(passwordInput, { target: { value: 'StrongP@ss123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongP@ss123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Unable to connect to the server/i)).toBeInTheDocument();
      });
    });

    test('clears previous errors on new submission', async () => {
      // First submission fails
      axios.post.mockRejectedValueOnce({
        response: {
          data: {
            error: 'Token has expired',
          },
        },
      });

      renderComponent();

      const passwordInput = document.getElementById('password');
      const confirmPasswordInput = document.getElementById('confirmPassword');
      const submitButton = screen.getByRole('button', { name: /Complete Setup/i });

      fireEvent.change(passwordInput, { target: { value: 'StrongP@ss123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongP@ss123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Token has expired/i)).toBeInTheDocument();
      });

      // Second submission succeeds
      axios.post.mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Account activated successfully',
          user: {
            id: 123,
            username: 'john.doe',
            email: 'john.doe@example.com',
            full_name: 'John Doe',
          },
          token: 'auth-token-123',
        },
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/Token has expired/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Page Layout', () => {
    test('displays terms and privacy policy notice', () => {
      renderComponent();

      expect(screen.getByText(/By completing setup, you agree to our terms of service and privacy policy/i)).toBeInTheDocument();
    });

    test('displays password requirements section header', () => {
      renderComponent();

      expect(screen.getByText(/Your password must contain:/i)).toBeInTheDocument();
    });
  });
});
