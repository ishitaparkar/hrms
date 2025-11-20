import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PhoneAuthenticationPage from '../PhoneAuthenticationPage';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('PhoneAuthenticationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <PhoneAuthenticationPage />
      </BrowserRouter>
    );
  };

  describe('Form Rendering', () => {
    test('renders phone authentication form with all required fields', () => {
      renderComponent();

      expect(screen.getByRole('heading', { name: /Verify Your Identity/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Verify Identity/i })).toBeInTheDocument();
    });

    test('displays help text for phone number format', () => {
      renderComponent();

      expect(screen.getByText(/Include country code/i)).toBeInTheDocument();
    });

    test('displays contact HR link', () => {
      renderComponent();

      const contactLink = screen.getByText(/Contact HR/i);
      expect(contactLink).toBeInTheDocument();
      expect(contactLink.closest('a')).toHaveAttribute('href', 'mailto:hr@example.com');
    });
  });

  describe('Form Validation', () => {
    test('shows error for invalid email format', async () => {
      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/i);
      const phoneInput = screen.getByLabelText(/Phone Number/i);
      const submitButton = screen.getByRole('button', { name: /Verify Identity/i });

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.change(phoneInput, { target: { value: '+919876543210' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    test('shows error for phone number without country code', async () => {
      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/i);
      const phoneInput = screen.getByLabelText(/Phone Number/i);
      const submitButton = screen.getByRole('button', { name: /Verify Identity/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(phoneInput, { target: { value: '9876543210' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid phone number with country code/i)).toBeInTheDocument();
      });
    });

    test('accepts valid email and phone number', async () => {
      axios.post.mockResolvedValue({
        data: {
          success: true,
          auth_token: 'test-token',
          employee: {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            department: 'Engineering',
          },
        },
      });

      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/i);
      const phoneInput = screen.getByLabelText(/Phone Number/i);
      const submitButton = screen.getByRole('button', { name: /Verify Identity/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(phoneInput, { target: { value: '+919876543210' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          'http://127.0.0.1:8000/api/auth/verify-phone/',
          {
            email: 'test@example.com',
            phone_number: '+919876543210',
          }
        );
      });
    });
  });

  describe('Error Message Display', () => {
    test('displays error message on authentication failure', async () => {
      axios.post.mockRejectedValue({
        response: {
          data: {
            success: false,
            error: 'Phone number does not match our records',
            attempts_remaining: 2,
          },
        },
      });

      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/i);
      const phoneInput = screen.getByLabelText(/Phone Number/i);
      const submitButton = screen.getByRole('button', { name: /Verify Identity/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(phoneInput, { target: { value: '+919876543210' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Phone number does not match our records/i)).toBeInTheDocument();
      });
    });

    test('displays generic error message when server is unreachable', async () => {
      axios.post.mockRejectedValue(new Error('Network Error'));

      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/i);
      const phoneInput = screen.getByLabelText(/Phone Number/i);
      const submitButton = screen.getByRole('button', { name: /Verify Identity/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(phoneInput, { target: { value: '+919876543210' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Unable to connect to the server/i)).toBeInTheDocument();
      });
    });
  });

  describe('Attempts Counter', () => {
    test('displays attempts remaining after failed authentication', async () => {
      axios.post.mockRejectedValue({
        response: {
          data: {
            success: false,
            error: 'Phone number does not match our records',
            attempts_remaining: 2,
          },
        },
      });

      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/i);
      const phoneInput = screen.getByLabelText(/Phone Number/i);
      const submitButton = screen.getByRole('button', { name: /Verify Identity/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(phoneInput, { target: { value: '+919876543210' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Attempts Remaining:/i)).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    test('displays account locked message when attempts reach zero', async () => {
      axios.post.mockRejectedValue({
        response: {
          data: {
            success: false,
            error: 'Account locked',
            attempts_remaining: 0,
          },
        },
      });

      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/i);
      const phoneInput = screen.getByLabelText(/Phone Number/i);
      const submitButton = screen.getByRole('button', { name: /Verify Identity/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(phoneInput, { target: { value: '+919876543210' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Your account has been temporarily locked/i)).toBeInTheDocument();
        expect(screen.getByText(/contact HR for assistance/i)).toBeInTheDocument();
      });
    });

    test('disables submit button when account is locked', async () => {
      axios.post.mockRejectedValue({
        response: {
          data: {
            success: false,
            error: 'Account locked',
            attempts_remaining: 0,
          },
        },
      });

      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/i);
      const phoneInput = screen.getByLabelText(/Phone Number/i);
      const submitButton = screen.getByRole('button', { name: /Verify Identity/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(phoneInput, { target: { value: '+919876543210' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Loading State', () => {
    test('shows loading state during authentication', async () => {
      axios.post.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/i);
      const phoneInput = screen.getByLabelText(/Phone Number/i);
      const submitButton = screen.getByRole('button', { name: /Verify Identity/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(phoneInput, { target: { value: '+919876543210' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Verifying.../i)).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });
    });

    test('disables form inputs during loading', async () => {
      axios.post.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/i);
      const phoneInput = screen.getByLabelText(/Phone Number/i);
      const submitButton = screen.getByRole('button', { name: /Verify Identity/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(phoneInput, { target: { value: '+919876543210' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(emailInput).toBeDisabled();
        expect(phoneInput).toBeDisabled();
      });
    });
  });

  describe('Successful Authentication', () => {
    test('stores auth token and employee data on success', async () => {
      const mockEmployeeData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        department: 'Engineering',
      };

      axios.post.mockResolvedValue({
        data: {
          success: true,
          auth_token: 'test-auth-token',
          employee: mockEmployeeData,
        },
      });

      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/i);
      const phoneInput = screen.getByLabelText(/Phone Number/i);
      const submitButton = screen.getByRole('button', { name: /Verify Identity/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(phoneInput, { target: { value: '+919876543210' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(localStorage.getItem('setupAuthToken')).toBe('test-auth-token');
        expect(localStorage.getItem('setupEmployeeData')).toBe(JSON.stringify(mockEmployeeData));
      });
    });

    test('navigates to account setup page on success', async () => {
      axios.post.mockResolvedValue({
        data: {
          success: true,
          auth_token: 'test-auth-token',
          employee: {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            department: 'Engineering',
          },
        },
      });

      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/i);
      const phoneInput = screen.getByLabelText(/Phone Number/i);
      const submitButton = screen.getByRole('button', { name: /Verify Identity/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(phoneInput, { target: { value: '+919876543210' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/account-setup');
      });
    });
  });
});
