import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProfilePage from '../ProfilePage';

// Mock fetch
global.fetch = jest.fn();

// Mock the contexts
jest.mock('../../contexts/PermissionContext', () => ({
  usePermission: () => ({
    roles: ['Employee'],
    user: {
      username: 'testuser',
      email: 'test@example.com'
    },
    permissions: []
  })
}));

jest.mock('../../contexts/PreferencesContext', () => ({
  usePreferences: () => ({
    preferences: {
      theme: 'light',
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true
    },
    updatePreferences: jest.fn()
  }),
  PreferencesProvider: ({ children }) => <div>{children}</div>
}));

// Mock the child components
jest.mock('../../components/profile/DocumentsSection', () => {
  return function DocumentsSection() {
    return <div data-testid="documents-section">Documents Section</div>;
  };
});

jest.mock('../../components/profile/NotificationsPreferences', () => {
  return function NotificationsPreferences() {
    return <div data-testid="notifications-preferences">Notifications Preferences</div>;
  };
});

describe('ProfilePage - Tab Functionality', () => {
  const mockProfileData = {
    username: 'testuser',
    email: 'test@example.com',
    employee_id: 1
  };

  const mockEmployeeData = {
    id: 1,
    employeeId: 'EMP001',
    firstName: 'Test',
    lastName: 'User',
    personalEmail: 'test@personal.com',
    mobileNumber: '1234567890',
    department: 'Engineering',
    designation: 'Developer',
    joiningDate: '2024-01-01'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fetch responses
    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/auth/profile/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProfileData)
        });
      }
      if (url.includes('/api/employees/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEmployeeData)
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  const renderProfilePage = () => {
    return render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );
  };

  test('displays Employee Profile tab as default active tab', async () => {
    renderProfilePage();

    await waitFor(() => {
      const employeeTab = screen.getByRole('tab', { name: /Employee Profile/i });
      expect(employeeTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  test('displays tabs in correct order (Employee Profile, Account Settings)', async () => {
    renderProfilePage();

    await waitFor(() => {
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(2);
      expect(tabs[0]).toHaveTextContent(/Employee Profile/i);
      expect(tabs[1]).toHaveTextContent(/Account Settings/i);
    });
  });

  test('switches to Account Settings tab when clicked', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Employee Profile/i })).toBeInTheDocument();
    });

    const accountTab = screen.getByRole('tab', { name: /Account Settings/i });
    fireEvent.click(accountTab);

    await waitFor(() => {
      expect(accountTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tab', { name: /Employee Profile/i })).toHaveAttribute('aria-selected', 'false');
    });
  });

  test('switches back to Employee Profile tab when clicked', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Employee Profile/i })).toBeInTheDocument();
    });

    // Switch to Account Settings
    const accountTab = screen.getByRole('tab', { name: /Account Settings/i });
    fireEvent.click(accountTab);

    await waitFor(() => {
      expect(accountTab).toHaveAttribute('aria-selected', 'true');
    });

    // Switch back to Employee Profile
    const employeeTab = screen.getByRole('tab', { name: /Employee Profile/i });
    fireEvent.click(employeeTab);

    await waitFor(() => {
      expect(employeeTab).toHaveAttribute('aria-selected', 'true');
      expect(accountTab).toHaveAttribute('aria-selected', 'false');
    });
  });

  test('displays visual indicator for active tab', async () => {
    renderProfilePage();

    await waitFor(() => {
      const employeeTab = screen.getByRole('tab', { name: /Employee Profile/i });
      expect(employeeTab).toHaveClass('text-primary', 'border-b-2', 'border-primary');
    });

    const accountTab = screen.getByRole('tab', { name: /Account Settings/i });
    fireEvent.click(accountTab);

    await waitFor(() => {
      expect(accountTab).toHaveClass('text-primary', 'border-b-2', 'border-primary');
    });
  });

  test('supports keyboard navigation with Enter key', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Employee Profile/i })).toBeInTheDocument();
    });

    const accountTab = screen.getByRole('tab', { name: /Account Settings/i });
    fireEvent.keyDown(accountTab, { key: 'Enter' });

    await waitFor(() => {
      expect(accountTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  test('supports keyboard navigation with Space key', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Employee Profile/i })).toBeInTheDocument();
    });

    const accountTab = screen.getByRole('tab', { name: /Account Settings/i });
    fireEvent.keyDown(accountTab, { key: ' ' });

    await waitFor(() => {
      expect(accountTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  test('supports keyboard navigation with Arrow keys', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Employee Profile/i })).toBeInTheDocument();
    });

    const employeeTab = screen.getByRole('tab', { name: /Employee Profile/i });
    
    // Press ArrowRight to move to next tab
    fireEvent.keyDown(employeeTab, { key: 'ArrowRight' });

    await waitFor(() => {
      const accountTab = screen.getByRole('tab', { name: /Account Settings/i });
      expect(accountTab).toHaveAttribute('aria-selected', 'true');
    });

    // Press ArrowLeft to move back
    const accountTab = screen.getByRole('tab', { name: /Account Settings/i });
    fireEvent.keyDown(accountTab, { key: 'ArrowLeft' });

    await waitFor(() => {
      expect(employeeTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  test('displays Employee Profile content when tab is active', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByTestId('documents-section')).toBeInTheDocument();
      expect(screen.getByText(/Job Information/i)).toBeInTheDocument();
    });
  });

  test('displays Account Settings content when tab is active', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Account Settings/i })).toBeInTheDocument();
    });

    const accountTab = screen.getByRole('tab', { name: /Account Settings/i });
    fireEvent.click(accountTab);

    await waitFor(() => {
      expect(screen.getByTestId('notifications-preferences')).toBeInTheDocument();
      expect(screen.getByText(/Change Password/i)).toBeInTheDocument();
    });
  });

  test('maintains proper tabindex for keyboard navigation', async () => {
    renderProfilePage();

    await waitFor(() => {
      const employeeTab = screen.getByRole('tab', { name: /Employee Profile/i });
      const accountTab = screen.getByRole('tab', { name: /Account Settings/i });
      
      // Active tab should have tabindex 0
      expect(employeeTab).toHaveAttribute('tabindex', '0');
      // Inactive tab should have tabindex -1
      expect(accountTab).toHaveAttribute('tabindex', '-1');
    });

    // Switch tabs
    const accountTab = screen.getByRole('tab', { name: /Account Settings/i });
    fireEvent.click(accountTab);

    await waitFor(() => {
      const employeeTab = screen.getByRole('tab', { name: /Employee Profile/i });
      
      // Now account tab should have tabindex 0
      expect(accountTab).toHaveAttribute('tabindex', '0');
      // And employee tab should have tabindex -1
      expect(employeeTab).toHaveAttribute('tabindex', '-1');
    });
  });
});
