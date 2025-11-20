import axios from 'axios';
import {
  verifyPhone,
  generateUsername,
  completeSetup,
  withRetry,
  clearOnboardingData,
  storeOnboardingData,
  getOnboardingData,
} from '../onboardingService';

// Mock axios
jest.mock('axios');

describe('onboardingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('verifyPhone', () => {
    test('successfully verifies phone number and returns data', async () => {
      const mockResponse = {
        data: {
          success: true,
          auth_token: 'test-token-123',
          employee: {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            department: 'Engineering',
          },
        },
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await verifyPhone('john.doe@example.com', '+919876543210');

      expect(axios.post).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/api/auth/verify-phone/',
        {
          email: 'john.doe@example.com',
          phone_number: '+919876543210',
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    test('removes spaces and dashes from phone number', async () => {
      const mockResponse = {
        data: { success: true, auth_token: 'token', employee: {} },
      };

      axios.post.mockResolvedValue(mockResponse);

      await verifyPhone('test@example.com', '+91 987-654-3210');

      expect(axios.post).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/api/auth/verify-phone/',
        {
          email: 'test@example.com',
          phone_number: '+919876543210',
        }
      );
    });

    test('trims whitespace from email', async () => {
      const mockResponse = {
        data: { success: true, auth_token: 'token', employee: {} },
      };

      axios.post.mockResolvedValue(mockResponse);

      await verifyPhone('  test@example.com  ', '+919876543210');

      expect(axios.post).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/api/auth/verify-phone/',
        {
          email: 'test@example.com',
          phone_number: '+919876543210',
        }
      );
    });

    test('throws error with attempts remaining on authentication failure', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            error: 'Phone number does not match our records',
            attempts_remaining: 2,
          },
        },
      };

      axios.post.mockRejectedValue(mockError);

      await expect(verifyPhone('test@example.com', '+919876543210')).rejects.toEqual({
        message: 'Phone number does not match our records',
        attemptsRemaining: 2,
        status: 400,
        data: mockError.response.data,
      });
    });

    test('throws network error when no response received', async () => {
      const mockError = {
        request: {},
      };

      axios.post.mockRejectedValue(mockError);

      await expect(verifyPhone('test@example.com', '+919876543210')).rejects.toEqual({
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        status: 0,
      });
    });

    test('throws generic error for unexpected errors', async () => {
      const mockError = new Error('Unexpected error');

      axios.post.mockRejectedValue(mockError);

      await expect(verifyPhone('test@example.com', '+919876543210')).rejects.toEqual({
        message: 'An unexpected error occurred. Please try again.',
        status: -1,
      });
    });
  });

  describe('generateUsername', () => {
    test('successfully generates username with auth token', async () => {
      const mockResponse = {
        data: {
          username: 'john.doe',
          employee_details: {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            department: 'Engineering',
            designation: 'Software Engineer',
          },
        },
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await generateUsername('test-token-123');

      expect(axios.post).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/api/auth/generate-username/',
        {},
        {
          headers: {
            Authorization: 'Bearer test-token-123',
          },
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    test('throws expired error on 401 status', async () => {
      const mockError = {
        response: {
          status: 401,
          data: {
            error: 'Token expired',
          },
        },
      };

      axios.post.mockRejectedValue(mockError);

      await expect(generateUsername('expired-token')).rejects.toEqual({
        message: 'Your session has expired. Please start the verification process again.',
        status: 401,
        expired: true,
      });
    });

    test('throws error on server failure', async () => {
      const mockError = {
        response: {
          status: 500,
          data: {
            error: 'Internal server error',
          },
        },
      };

      axios.post.mockRejectedValue(mockError);

      await expect(generateUsername('test-token')).rejects.toEqual({
        message: 'Internal server error',
        status: 500,
        data: mockError.response.data,
      });
    });

    test('throws network error when no response received', async () => {
      const mockError = {
        request: {},
      };

      axios.post.mockRejectedValue(mockError);

      await expect(generateUsername('test-token')).rejects.toEqual({
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        status: 0,
      });
    });
  });

  describe('completeSetup', () => {
    test('successfully completes account setup', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Account activated successfully',
          user: {
            id: 123,
            username: 'john.doe',
            email: 'john.doe@example.com',
            full_name: 'John Doe',
          },
          token: 'auth-token-456',
        },
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await completeSetup(
        'setup-token-123',
        'john.doe',
        'SecureP@ss123',
        'SecureP@ss123'
      );

      expect(axios.post).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/api/auth/complete-setup/',
        {
          username: 'john.doe',
          password: 'SecureP@ss123',
          confirm_password: 'SecureP@ss123',
        },
        {
          headers: {
            Authorization: 'Bearer setup-token-123',
          },
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    test('throws expired error on 401 status', async () => {
      const mockError = {
        response: {
          status: 401,
          data: {
            error: 'Token expired',
          },
        },
      };

      axios.post.mockRejectedValue(mockError);

      await expect(
        completeSetup('expired-token', 'john.doe', 'password', 'password')
      ).rejects.toEqual({
        message: 'Your session has expired. Please start the verification process again.',
        status: 401,
        expired: true,
      });
    });

    test('throws validation errors on 400 status', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            errors: {
              password: [
                'Password must contain at least one uppercase letter',
                'Password must contain at least one special character',
              ],
            },
          },
        },
      };

      axios.post.mockRejectedValue(mockError);

      await expect(
        completeSetup('test-token', 'john.doe', 'weakpass', 'weakpass')
      ).rejects.toEqual({
        message: 'Please correct the validation errors.',
        status: 400,
        errors: mockError.response.data.errors,
        data: mockError.response.data,
      });
    });

    test('throws generic error on other server errors', async () => {
      const mockError = {
        response: {
          status: 500,
          data: {
            error: 'Server error',
          },
        },
      };

      axios.post.mockRejectedValue(mockError);

      await expect(
        completeSetup('test-token', 'john.doe', 'password', 'password')
      ).rejects.toEqual({
        message: 'Server error',
        status: 500,
        data: mockError.response.data,
      });
    });

    test('throws network error when no response received', async () => {
      const mockError = {
        request: {},
      };

      axios.post.mockRejectedValue(mockError);

      await expect(
        completeSetup('test-token', 'john.doe', 'password', 'password')
      ).rejects.toEqual({
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        status: 0,
      });
    });
  });

  describe('withRetry', () => {
    test('returns result on first successful attempt', async () => {
      const mockApiCall = jest.fn().mockResolvedValue({ data: 'success' });

      const result = await withRetry(mockApiCall);

      expect(mockApiCall).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ data: 'success' });
    });

    test('retries on network error and succeeds', async () => {
      const mockApiCall = jest
        .fn()
        .mockRejectedValueOnce({ status: 0 })
        .mockResolvedValueOnce({ data: 'success' });

      const result = await withRetry(mockApiCall, 2, 10);

      expect(mockApiCall).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: 'success' });
    });

    test('does not retry on client errors (4xx except 408 and 429)', async () => {
      const mockApiCall = jest.fn().mockRejectedValue({ status: 400 });

      await expect(withRetry(mockApiCall)).rejects.toEqual({ status: 400 });

      expect(mockApiCall).toHaveBeenCalledTimes(1);
    });

    test('retries on 408 timeout error', async () => {
      const mockApiCall = jest
        .fn()
        .mockRejectedValueOnce({ status: 408 })
        .mockResolvedValueOnce({ data: 'success' });

      const result = await withRetry(mockApiCall, 2, 10);

      expect(mockApiCall).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: 'success' });
    });

    test('retries on 429 rate limit error', async () => {
      const mockApiCall = jest
        .fn()
        .mockRejectedValueOnce({ status: 429 })
        .mockResolvedValueOnce({ data: 'success' });

      const result = await withRetry(mockApiCall, 2, 10);

      expect(mockApiCall).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: 'success' });
    });

    test('throws error after max retries exceeded', async () => {
      const mockApiCall = jest.fn().mockRejectedValue({ status: 500 });

      await expect(withRetry(mockApiCall, 2, 10)).rejects.toEqual({ status: 500 });

      expect(mockApiCall).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    test('retries on server errors (5xx)', async () => {
      const mockApiCall = jest
        .fn()
        .mockRejectedValueOnce({ status: 503 })
        .mockResolvedValueOnce({ data: 'success' });

      const result = await withRetry(mockApiCall, 2, 10);

      expect(mockApiCall).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: 'success' });
    });
  });

  describe('Token Management', () => {
    describe('clearOnboardingData', () => {
      test('removes all onboarding data from localStorage', () => {
        localStorage.setItem('setupAuthToken', 'token-123');
        localStorage.setItem('setupEmployeeData', JSON.stringify({ name: 'John' }));
        localStorage.setItem('setupUsername', 'john.doe');

        clearOnboardingData();

        expect(localStorage.getItem('setupAuthToken')).toBeNull();
        expect(localStorage.getItem('setupEmployeeData')).toBeNull();
        expect(localStorage.getItem('setupUsername')).toBeNull();
      });
    });

    describe('storeOnboardingData', () => {
      test('stores auth token in localStorage', () => {
        storeOnboardingData({ authToken: 'token-123' });

        expect(localStorage.getItem('setupAuthToken')).toBe('token-123');
      });

      test('stores employee data as JSON in localStorage', () => {
        const employeeData = {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
        };

        storeOnboardingData({ employeeData });

        expect(localStorage.getItem('setupEmployeeData')).toBe(
          JSON.stringify(employeeData)
        );
      });

      test('stores username in localStorage', () => {
        storeOnboardingData({ username: 'john.doe' });

        expect(localStorage.getItem('setupUsername')).toBe('john.doe');
      });

      test('stores multiple values at once', () => {
        const employeeData = { name: 'John' };

        storeOnboardingData({
          authToken: 'token-123',
          employeeData,
          username: 'john.doe',
        });

        expect(localStorage.getItem('setupAuthToken')).toBe('token-123');
        expect(localStorage.getItem('setupEmployeeData')).toBe(
          JSON.stringify(employeeData)
        );
        expect(localStorage.getItem('setupUsername')).toBe('john.doe');
      });

      test('does not store undefined values', () => {
        storeOnboardingData({ authToken: 'token-123' });

        expect(localStorage.getItem('setupAuthToken')).toBe('token-123');
        expect(localStorage.getItem('setupEmployeeData')).toBeNull();
        expect(localStorage.getItem('setupUsername')).toBeNull();
      });
    });

    describe('getOnboardingData', () => {
      test('retrieves all onboarding data from localStorage', () => {
        const employeeData = {
          first_name: 'John',
          last_name: 'Doe',
        };

        localStorage.setItem('setupAuthToken', 'token-123');
        localStorage.setItem('setupEmployeeData', JSON.stringify(employeeData));
        localStorage.setItem('setupUsername', 'john.doe');

        const result = getOnboardingData();

        expect(result).toEqual({
          authToken: 'token-123',
          employeeData,
          username: 'john.doe',
        });
      });

      test('returns null for missing employee data', () => {
        localStorage.setItem('setupAuthToken', 'token-123');
        localStorage.setItem('setupUsername', 'john.doe');

        const result = getOnboardingData();

        expect(result).toEqual({
          authToken: 'token-123',
          employeeData: null,
          username: 'john.doe',
        });
      });

      test('returns null values when localStorage is empty', () => {
        const result = getOnboardingData();

        expect(result).toEqual({
          authToken: null,
          employeeData: null,
          username: null,
        });
      });

      test('parses employee data JSON correctly', () => {
        const employeeData = {
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane.smith@example.com',
          department: 'Marketing',
        };

        localStorage.setItem('setupEmployeeData', JSON.stringify(employeeData));

        const result = getOnboardingData();

        expect(result.employeeData).toEqual(employeeData);
      });
    });
  });
});
