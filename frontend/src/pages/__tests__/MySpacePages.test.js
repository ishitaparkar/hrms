import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import MyTeamPage from '../MyTeamPage';
import MyPerformancePage from '../MyPerformancePage';
import MyAttendancePage from '../MyAttendancePage';
import MyLeavePage from '../MyLeavePage';

// Mock axios
jest.mock('axios');

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(() => 'mock-token'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = mockLocalStorage;

// Helper function to render with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('My Space Pages - Load Without Errors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('MyTeamPage', () => {
    it('should render loading state initially', () => {
      axios.get.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      renderWithRouter(<MyTeamPage />);
      
      expect(screen.getByText(/loading team information/i)).toBeInTheDocument();
    });

    it('should render without errors when data loads successfully', async () => {
      const mockData = {
        department: 'Engineering',
        manager: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          designation: 'Engineering Manager',
          email: 'john@example.com',
          phone: '123-456-7890',
        },
        teamMembers: [
          {
            id: 2,
            firstName: 'Jane',
            lastName: 'Smith',
            designation: 'Software Engineer',
            email: 'jane@example.com',
            phone: '123-456-7891',
          },
        ],
      };

      axios.get.mockResolvedValue({ data: mockData });

      renderWithRouter(<MyTeamPage />);

      await waitFor(() => {
        expect(screen.getByText('Engineering')).toBeInTheDocument();
      });

      expect(screen.getByText('Reporting Manager')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should render error state when API fails', async () => {
      axios.get.mockRejectedValue(new Error('API Error'));

      renderWithRouter(<MyTeamPage />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load team information/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  describe('MyPerformancePage', () => {
    it('should render loading state initially', () => {
      axios.get.mockImplementation(() => new Promise(() => {}));
      
      renderWithRouter(<MyPerformancePage />);
      
      expect(screen.getByText(/loading performance information/i)).toBeInTheDocument();
    });

    it('should render without errors when data loads successfully', async () => {
      const mockData = {
        appraisals: [
          {
            id: 1,
            rating: 4.5,
            date: '2025-01-15',
            reviewer: 'John Doe',
            comments: 'Great work!',
          },
        ],
        goals: [],
        achievements: [],
        trainings: [],
      };

      axios.get.mockResolvedValue({ data: mockData });

      renderWithRouter(<MyPerformancePage />);

      await waitFor(() => {
        expect(screen.getByText('Recent Appraisal')).toBeInTheDocument();
      });
    });

    it('should render error state when API fails', async () => {
      axios.get.mockRejectedValue(new Error('API Error'));

      renderWithRouter(<MyPerformancePage />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load performance information/i)).toBeInTheDocument();
      });
    });
  });

  describe('MyAttendancePage', () => {
    it('should render loading state initially', () => {
      axios.get.mockImplementation(() => new Promise(() => {}));
      
      renderWithRouter(<MyAttendancePage />);
      
      expect(screen.getByText(/loading attendance information/i)).toBeInTheDocument();
    });

    it('should render without errors when data loads successfully', async () => {
      const mockData = {
        summary: {
          month: '2025-11',
          totalDays: 30,
          presentDays: 22,
          absentDays: 2,
          lateDays: 1,
          attendancePercentage: 73.33,
        },
        records: [],
      };

      axios.get.mockResolvedValue({ data: mockData });

      renderWithRouter(<MyAttendancePage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/select month/i)).toBeInTheDocument();
      });
    });

    it('should render error state when API fails', async () => {
      axios.get.mockRejectedValue(new Error('API Error'));

      renderWithRouter(<MyAttendancePage />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load attendance information/i)).toBeInTheDocument();
      });
    });
  });

  describe('MyLeavePage', () => {
    it('should render loading state initially', () => {
      axios.get.mockImplementation(() => new Promise(() => {}));
      
      renderWithRouter(<MyLeavePage />);
      
      expect(screen.getByText(/loading leave information/i)).toBeInTheDocument();
    });

    it('should render without errors when data loads successfully', async () => {
      const mockData = {
        balances: [
          {
            leaveType: 'Casual Leave',
            total: 12,
            used: 3,
            remaining: 9,
          },
        ],
        requests: [],
        holidays: [],
      };

      axios.get.mockResolvedValue({ data: mockData });

      renderWithRouter(<MyLeavePage />);

      await waitFor(() => {
        expect(screen.getByText('Leave Balance')).toBeInTheDocument();
      });

      expect(screen.getByText('Casual Leave')).toBeInTheDocument();
    });

    it('should render error state when API fails', async () => {
      axios.get.mockRejectedValue(new Error('API Error'));

      renderWithRouter(<MyLeavePage />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load leave information/i)).toBeInTheDocument();
      });
    });
  });
});
