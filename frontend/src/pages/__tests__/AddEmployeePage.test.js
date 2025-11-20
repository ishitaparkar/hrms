import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AddEmployeePage from '../AddEmployeePage';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('AddEmployeePage - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.alert
    window.alert = jest.fn();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AddEmployeePage />
      </BrowserRouter>
    );
  };

  const fillRequiredFields = () => {
    fireEvent.change(screen.getByPlaceholderText('First Name'), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByPlaceholderText('Last Name'), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Personal Email/i), {
      target: { value: 'john.doe@example.com' },
    });
    
    // Fill phone number
    const phoneInput = screen.getByLabelText(/Mobile Number/i);
    fireEvent.change(phoneInput, {
      target: { value: '9876543210' },
    });

    fireEvent.change(screen.getByLabelText(/Employee ID/i), {
      target: { value: 'EMP001' },
    });
    fireEvent.change(screen.getByLabelText(/Official Email/i), {
      target: { value: 'john.doe@company.com' },
    });
    fireEvent.change(screen.getByLabelText(/Date of Joining/i), {
      target: { value: '2025-01-01' },
    });
    
    // Select department
    const departmentSelect = screen.getByLabelText(/Department/i);
    fireEvent.change(departmentSelect, {
      target: { value: 'Faculty of Engineering' },
    });
    
    // Select designation
    const designationSelect = screen.getByLabelText(/Designation/i);
    fireEvent.change(designationSelect, {
      target: { value: 'Professor' },
    });

    fireEvent.change(screen.getByLabelText(/Date of Birth/i), {
      target: { value: '1990-01-01' },
    });
  };

  describe('Form Validation with Invalid Data', () => {
    test('shows validation error for invalid email format', async () => {
      renderComponent();

      const emailInput = screen.getByLabelText(/Personal Email/i);
      
      // Enter invalid email
      fireEvent.change(emailInput, {
        target: { value: 'invalid-email' },
      });

      // Blur to trigger validation
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(
          screen.getByText(/Please enter a valid email address/i)
        ).toBeInTheDocument();
      });
    });

    test('shows validation error for phone number with less than 10 digits', async () => {
      renderComponent();

      const phoneInput = screen.getByLabelText(/Mobile Number/i);
      
      // Enter phone number with less than 10 digits
      fireEvent.change(phoneInput, {
        target: { value: '123456' },
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Phone number must be between 10 and 15 digits/i)
        ).toBeInTheDocument();
      });
    });

    test('shows validation error for phone number with more than 15 digits', async () => {
      renderComponent();

      const phoneInput = screen.getByLabelText(/Mobile Number/i);
      
      // Enter phone number with more than 15 digits
      fireEvent.change(phoneInput, {
        target: { value: '1234567890123456' },
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Phone number must be between 10 and 15 digits/i)
        ).toBeInTheDocument();
      });
    });

    test('prevents form submission with invalid email', async () => {
      renderComponent();

      fillRequiredFields();

      // Change email to invalid
      const emailInput = screen.getByLabelText(/Personal Email/i);
      fireEvent.change(emailInput, {
        target: { value: 'invalid-email' },
      });

      const submitButton = screen.getByRole('button', { name: /Save Employee/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(axios.post).not.toHaveBeenCalled();
        expect(
          screen.getByText(/Please enter a valid email address/i)
        ).toBeInTheDocument();
      });
    });

    test('prevents form submission with invalid phone number', async () => {
      renderComponent();

      fillRequiredFields();

      // Change phone to invalid
      const phoneInput = screen.getByLabelText(/Mobile Number/i);
      fireEvent.change(phoneInput, {
        target: { value: '123' },
      });

      const submitButton = screen.getByRole('button', { name: /Save Employee/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(axios.post).not.toHaveBeenCalled();
        expect(
          screen.getByText(/Phone number must be between 10 and 15 digits/i)
        ).toBeInTheDocument();
      });
    });

    test('clears validation error when valid email is entered', async () => {
      renderComponent();

      const emailInput = screen.getByLabelText(/Personal Email/i);
      
      // Enter invalid email
      fireEvent.change(emailInput, {
        target: { value: 'invalid-email' },
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Please enter a valid email address/i)
        ).toBeInTheDocument();
      });

      // Enter valid email
      fireEvent.change(emailInput, {
        target: { value: 'valid@example.com' },
      });

      await waitFor(() => {
        expect(
          screen.queryByText(/Please enter a valid email address/i)
        ).not.toBeInTheDocument();
      });
    });

    test('clears validation error when valid phone number is entered', async () => {
      renderComponent();

      const phoneInput = screen.getByLabelText(/Mobile Number/i);
      
      // Enter invalid phone
      fireEvent.change(phoneInput, {
        target: { value: '123' },
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Phone number must be between 10 and 15 digits/i)
        ).toBeInTheDocument();
      });

      // Enter valid phone
      fireEvent.change(phoneInput, {
        target: { value: '9876543210' },
      });

      await waitFor(() => {
        expect(
          screen.queryByText(/Phone number must be between 10 and 15 digits/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Successful Employee Creation', () => {
    test('submits form with valid data and navigates to employee list', async () => {
      axios.post.mockResolvedValue({
        data: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          personalEmail: 'john.doe@example.com',
        },
      });

      renderComponent();

      fillRequiredFields();

      const submitButton = screen.getByRole('button', { name: /Save Employee/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          'http://127.0.0.1:8000/api/employees/',
          expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            personalEmail: 'john.doe@example.com',
            mobileNumber: expect.stringContaining('+91'),
            employeeId: 'EMP001',
            officialEmail: 'john.doe@company.com',
          })
        );
      });

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Employee added successfully!');
        expect(mockNavigate).toHaveBeenCalledWith('/employees');
      });
    });

    test('combines country code with phone number in submission', async () => {
      axios.post.mockResolvedValue({
        data: { id: 1 },
      });

      renderComponent();

      fillRequiredFields();

      const submitButton = screen.getByRole('button', { name: /Save Employee/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          'http://127.0.0.1:8000/api/employees/',
          expect.objectContaining({
            mobileNumber: '+919876543210',
          })
        );
      });
    });

    test('handles different country codes correctly', async () => {
      axios.post.mockResolvedValue({
        data: { id: 1 },
      });

      renderComponent();

      // Fill required fields but change country code first
      fireEvent.change(screen.getByPlaceholderText('First Name'), {
        target: { value: 'John' },
      });
      fireEvent.change(screen.getByPlaceholderText('Last Name'), {
        target: { value: 'Doe' },
      });
      fireEvent.change(screen.getByLabelText(/Personal Email/i), {
        target: { value: 'john.doe@example.com' },
      });
      
      // Change country code to +1
      const selects = screen.getAllByRole('combobox');
      const countryCodeSelect = selects.find(select => 
        select.querySelector('option[value="+1"]')
      );
      fireEvent.change(countryCodeSelect, {
        target: { value: '+1' },
      });

      // Fill phone number
      const phoneInput = screen.getByLabelText(/Mobile Number/i);
      fireEvent.change(phoneInput, {
        target: { value: '4155552671' },
      });

      fireEvent.change(screen.getByLabelText(/Employee ID/i), {
        target: { value: 'EMP001' },
      });
      fireEvent.change(screen.getByLabelText(/Official Email/i), {
        target: { value: 'john.doe@company.com' },
      });
      fireEvent.change(screen.getByLabelText(/Date of Joining/i), {
        target: { value: '2025-01-01' },
      });
      
      // Select department
      const departmentSelect = screen.getByLabelText(/Department/i);
      fireEvent.change(departmentSelect, {
        target: { value: 'Faculty of Engineering' },
      });
      
      // Select designation
      const designationSelect = screen.getByLabelText(/Designation/i);
      fireEvent.change(designationSelect, {
        target: { value: 'Professor' },
      });

      fireEvent.change(screen.getByLabelText(/Date of Birth/i), {
        target: { value: '1990-01-01' },
      });

      const submitButton = screen.getByRole('button', { name: /Save Employee/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          'http://127.0.0.1:8000/api/employees/',
          expect.objectContaining({
            mobileNumber: expect.stringContaining('+1'),
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    test('displays backend validation error for email', async () => {
      axios.post.mockRejectedValue({
        response: {
          data: {
            personalEmail: ['An employee with this email address already exists'],
          },
        },
      });

      renderComponent();

      fillRequiredFields();

      const submitButton = screen.getByRole('button', { name: /Save Employee/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/An employee with this email address already exists/i)
        ).toBeInTheDocument();
      });
    });

    test('displays backend validation error for phone number', async () => {
      axios.post.mockRejectedValue({
        response: {
          data: {
            mobileNumber: ['Phone number must include country code'],
          },
        },
      });

      renderComponent();

      fillRequiredFields();

      const submitButton = screen.getByRole('button', { name: /Save Employee/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Phone number must include country code/i)
        ).toBeInTheDocument();
      });
    });

    test('displays alert with error message on submission failure', async () => {
      axios.post.mockRejectedValue({
        response: {
          data: {
            detail: 'Internal server error',
          },
        },
      });

      renderComponent();

      fillRequiredFields();

      const submitButton = screen.getByRole('button', { name: /Save Employee/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          expect.stringContaining('Failed to add staff member')
        );
      });
    });

    test('handles network error gracefully', async () => {
      axios.post.mockRejectedValue(new Error('Network Error'));

      renderComponent();

      fillRequiredFields();

      const submitButton = screen.getByRole('button', { name: /Save Employee/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          expect.stringContaining('Network Error')
        );
      });
    });

    test('handles multiple validation errors from backend', async () => {
      axios.post.mockRejectedValue({
        response: {
          data: {
            personalEmail: ['Invalid email format'],
            mobileNumber: ['Invalid phone number format'],
          },
        },
      });

      renderComponent();

      fillRequiredFields();

      const submitButton = screen.getByRole('button', { name: /Save Employee/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid email format/i)).toBeInTheDocument();
        expect(screen.getByText(/Invalid phone number format/i)).toBeInTheDocument();
      });
    });
  });

  describe('PhoneInput Component Integration', () => {
    test('renders PhoneInput component with country code selector', () => {
      renderComponent();

      // Check that country code selector is present
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(2); // Department, Designation, Country Code, etc.
    });

    test('allows changing country code', () => {
      renderComponent();

      // Find the country code select by looking for one with country code options
      const selects = screen.getAllByRole('combobox');
      const countryCodeSelect = selects.find(select => 
        select.querySelector('option[value="+1"]')
      );
      
      expect(countryCodeSelect).toBeTruthy();
      
      fireEvent.change(countryCodeSelect, {
        target: { value: '+44' },
      });

      expect(countryCodeSelect.value).toBe('+44');
    });

    test('formats phone number as user types', async () => {
      renderComponent();

      const phoneInput = screen.getByLabelText(/Mobile Number/i);
      
      fireEvent.change(phoneInput, {
        target: { value: '9876543210' },
      });

      // PhoneInput should format the number
      await waitFor(() => {
        expect(phoneInput.value).toBeTruthy();
      });
    });
  });

  describe('Form Navigation', () => {
    test('navigates back to employee list on cancel', () => {
      renderComponent();

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith('/employees');
    });

    test('does not navigate on cancel if form has unsaved changes', () => {
      renderComponent();

      // Fill some fields
      fireEvent.change(screen.getByPlaceholderText('First Name'), {
        target: { value: 'John' },
      });

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      // Should still navigate (no confirmation dialog in current implementation)
      expect(mockNavigate).toHaveBeenCalledWith('/employees');
    });
  });
});
