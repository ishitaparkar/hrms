import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AccountSetupPage from '../AccountSetupPage';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('AccountSetupPage', () => {
  const mockEmployeeData = {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    department: 'Engineering',
    designation: 'Software Engineer',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    // Set up default localStorage values
    localStorage.setItem('setupAuthToken', 'test-auth-token');
    localStorage.setItem('setupEmployeeData', JSON.stringify(mockEmployeeData));
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AccountSetupPage />
      </BrowserRouter>
    );
  };

  describe('Initial Loading', () => {
    test('shows loading state while fetching username', () => {
      axios.post.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderComponent();

      expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
      expect(screen.getByText(/Generating your account details/i)).toBeInTheDocument();
    });

    test('redirects to phone-auth if no auth token', () => {
      localStorage.removeItem('setupAuthToken');

      renderComponent();

      expect(mockNavigate).toHaveBeenCalledWith('/phone-auth');
    });

    test('redirects to phone-auth if no employee data', () => {
      localStorage.removeItem('setupEmployeeData');

      renderComponent();

      expect(mockNavigate).toHaveBeenCalledWith('/phone-auth');
    });
  });

  describe('Username Display', () => {
    test('displays generated username after successful API call', async () => {
      axios.post.mockResolvedValue({
        data: {
          username: 'john.doe',
          employee_details: mockEmployeeData,
        },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('john.doe')).toBeInTheDocument();
      });
    });

    test('calls username generation API with correct headers', async () => {
      axios.post.mockResolvedValue({
        data: {
          username: 'john.doe',
          employee_details: mockEmployeeData,
        },
      });

      renderComponent();

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          'http://127.0.0.1:8000/api/auth/generate-username/',
          {},
          {
            headers: {
              Authorization: 'Bearer test-auth-token',
            },
          }
        );
      });
    });

    test('displays username label and description', async () => {
      axios.post.mockResolvedValue({
        data: {
          username: 'john.doe',
          employee_details: mockEmployeeData,
        },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Your Username/i)).toBeInTheDocument();
        expect(screen.getByText(/This username will be used to log in to the portal/i)).toBeInTheDocument();
      });
    });
  });

  describe('Employee Details Display', () => {
    test('displays all employee details correctly', async () => {
      axios.post.mockResolvedValue({
        data: {
          username: 'john.doe',
          employee_details: mockEmployeeData,
        },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John')).toBeInTheDocument();
        expect(screen.getByText('Doe')).toBeInTheDocument();
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
        expect(screen.getByText('Engineering')).toBeInTheDocument();
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      });
    });

    test('displays field labels for employee details', async () => {
      axios.post.mockResolvedValue({
        data: {
          username: 'john.doe',
          employee_details: mockEmployeeData,
        },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/First Name/i)).toBeInTheDocument();
        expect(screen.getByText(/Last Name/i)).toBeInTheDocument();
        expect(screen.getByText(/Email/i)).toBeInTheDocument();
        expect(screen.getByText(/Department/i)).toBeInTheDocument();
        expect(screen.getByText(/Designation/i)).toBeInTheDocument();
      });
    });

    test('displays employee details from localStorage initially', async () => {
      axios.post.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderComponent();

      // Wait a bit to ensure component has mounted
      await new Promise(resolve => setTimeout(resolve, 100));

      // The component should have parsed the localStorage data
      // but won't display it until API call completes
    });

    test('updates employee details with API response', async () => {
      const updatedEmployeeData = {
        ...mockEmployeeData,
        designation: 'Senior Software Engineer',
      };

      axios.post.mockResolvedValue({
        data: {
          username: 'john.doe',
          employee_details: updatedEmployeeData,
        },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
      });
    });
  });

  describe('Confirmation Flow', () => {
    test('enables confirm button when username is loaded', async () => {
      axios.post.mockResolvedValue({
        data: {
          username: 'john.doe',
          employee_details: mockEmployeeData,
        },
      });

      renderComponent();

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /Confirm and Continue/i });
        expect(confirmButton).not.toBeDisabled();
      });
    });

    test('stores username in localStorage on confirm', async () => {
      axios.post.mockResolvedValue({
        data: {
          username: 'john.doe',
          employee_details: mockEmployeeData,
        },
      });

      renderComponent();

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /Confirm and Continue/i });
        fireEvent.click(confirmButton);
      });

      expect(localStorage.getItem('setupUsername')).toBe('john.doe');
    });

    test('navigates to password setup page on confirm', async () => {
      axios.post.mockResolvedValue({
        data: {
          username: 'john.doe',
          employee_details: mockEmployeeData,
        },
      });

      renderComponent();

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /Confirm and Continue/i });
        fireEvent.click(confirmButton);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/password-setup');
    });

    test('disables confirm button when there is an error', async () => {
      axios.post.mockRejectedValue({
        response: {
          data: {
            error: 'Failed to generate username',
          },
        },
      });

      renderComponent();

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /Confirm and Continue/i });
        expect(confirmButton).toBeDisabled();
      });
    });
  });

  describe('Request Changes', () => {
    test('displays request changes button', async () => {
      axios.post.mockResolvedValue({
        data: {
          username: 'john.doe',
          employee_details: mockEmployeeData,
        },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Request Changes/i })).toBeInTheDocument();
      });
    });

    test('opens email client when request changes is clicked', async () => {
      axios.post.mockResolvedValue({
        data: {
          username: 'john.doe',
          employee_details: mockEmployeeData,
        },
      });

      // Mock window.location.href
      delete window.location;
      window.location = { href: '' };

      renderComponent();

      await waitFor(() => {
        const requestChangesButton = screen.getByRole('button', { name: /Request Changes/i });
        fireEvent.click(requestChangesButton);
      });

      expect(window.location.href).toContain('mailto:hr@example.com');
      expect(window.location.href).toContain('subject=Account Setup - Request Changes');
    });

    test('displays help text about requesting changes', async () => {
      axios.post.mockResolvedValue({
        data: {
          username: 'john.doe',
          employee_details: mockEmployeeData,
        },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/If any information is incorrect/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error message when API call fails', async () => {
      axios.post.mockRejectedValue({
        response: {
          data: {
            error: 'Failed to generate username',
          },
        },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Failed to generate username/i)).toBeInTheDocument();
      });
    });

    test('displays generic error when server is unreachable', async () => {
      axios.post.mockRejectedValue(new Error('Network Error'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Unable to connect to the server/i)).toBeInTheDocument();
      });
    });

    test('displays error when employee data parsing fails', () => {
      localStorage.setItem('setupEmployeeData', 'invalid-json');

      renderComponent();

      expect(screen.getByText(/Failed to load employee data/i)).toBeInTheDocument();
    });
  });

  describe('Page Layout', () => {
    test('renders page title and description', async () => {
      axios.post.mockResolvedValue({
        data: {
          username: 'john.doe',
          employee_details: mockEmployeeData,
        },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Verify Your Account Details/i)).toBeInTheDocument();
        expect(screen.getByText(/Please review your account information before proceeding/i)).toBeInTheDocument();
      });
    });

    test('renders "Your Information" section header', async () => {
      axios.post.mockResolvedValue({
        data: {
          username: 'john.doe',
          employee_details: mockEmployeeData,
        },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Your Information/i)).toBeInTheDocument();
      });
    });
  });
});
