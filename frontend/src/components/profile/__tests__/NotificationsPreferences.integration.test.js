import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotificationsPreferences from '../NotificationsPreferences';
import { PreferencesProvider } from '../../../contexts/PreferencesContext';

// Mock fetch
global.fetch = jest.fn();

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('NotificationsPreferences - Save and Apply Integration', () => {
  const mockToken = 'test-token-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('authToken', mockToken);
    document.documentElement.classList.remove('dark');
    
    // Re-setup matchMedia mock after clearAllMocks
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
    
    // Mock successful GET request for initial preferences
    global.fetch.mockImplementation((url, options) => {
      if (options?.method === 'PATCH') {
        // Return updated preferences
        const body = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            email_notifications: body.email_notifications ?? true,
            sms_notifications: body.sms_notifications ?? false,
            push_notifications: body.push_notifications ?? true,
            theme: body.theme ?? 'system',
            language: 'en',
            timezone: 'UTC'
          })
        });
      }
      // GET request
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          email_notifications: true,
          sms_notifications: false,
          push_notifications: true,
          theme: 'system',
          language: 'en',
          timezone: 'UTC'
        })
      });
    });
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  test('saves preferences when notification toggle is changed', async () => {
    render(
      <PreferencesProvider>
        <NotificationsPreferences />
      </PreferencesProvider>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText(/Email Notifications/i)).toBeInTheDocument();
    });

    // Find and click the email notifications toggle
    const emailToggle = screen.getByRole('switch', { name: /toggle email notifications/i });
    fireEvent.click(emailToggle);

    // Wait for auto-save (500ms debounce)
    await waitFor(() => {
      const patchCalls = global.fetch.mock.calls.filter(call => call[1]?.method === 'PATCH');
      expect(patchCalls.length).toBeGreaterThan(0);
    }, { timeout: 1000 });

    // Verify the PATCH request was made with correct data
    const patchCall = global.fetch.mock.calls.find(call => call[1]?.method === 'PATCH');
    expect(patchCall).toBeDefined();
    const requestBody = JSON.parse(patchCall[1].body);
    expect(requestBody.email_notifications).toBe(false);
  });

  test('saves preferences when theme is changed', async () => {
    render(
      <PreferencesProvider>
        <NotificationsPreferences />
      </PreferencesProvider>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText(/Theme Preferences/i)).toBeInTheDocument();
    });

    // Click on dark theme button
    const darkThemeButton = screen.getByRole('radio', { name: /dark theme/i });
    fireEvent.click(darkThemeButton);

    // Wait for auto-save
    await waitFor(() => {
      const patchCalls = global.fetch.mock.calls.filter(call => call[1]?.method === 'PATCH');
      expect(patchCalls.length).toBeGreaterThan(0);
    }, { timeout: 1000 });

    // Verify the PATCH request was made with correct theme
    const patchCall = global.fetch.mock.calls.find(call => call[1]?.method === 'PATCH');
    expect(patchCall).toBeDefined();
    const requestBody = JSON.parse(patchCall[1].body);
    expect(requestBody.theme).toBe('dark');
  });

  test('applies theme immediately when changed', async () => {
    render(
      <PreferencesProvider>
        <NotificationsPreferences />
      </PreferencesProvider>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText(/Theme Preferences/i)).toBeInTheDocument();
    });

    // Initially should not have dark class (system theme)
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Click on dark theme button
    const darkThemeButton = screen.getByRole('radio', { name: /dark theme/i });
    fireEvent.click(darkThemeButton);

    // Theme should be applied immediately (within a few ms)
    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    }, { timeout: 100 });
  });

  test('shows success message after saving', async () => {
    render(
      <PreferencesProvider>
        <NotificationsPreferences />
      </PreferencesProvider>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText(/Email Notifications/i)).toBeInTheDocument();
    });

    // Toggle a preference
    const emailToggle = screen.getByRole('switch', { name: /toggle email notifications/i });
    fireEvent.click(emailToggle);

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/Preferences saved successfully/i)).toBeInTheDocument();
    }, { timeout: 1500 });

    // Success message should disappear after 3 seconds
    await waitFor(() => {
      expect(screen.queryByText(/Preferences saved successfully/i)).not.toBeInTheDocument();
    }, { timeout: 3500 });
  });

  test('handles save errors gracefully', async () => {
    // Mock a failed PATCH request
    global.fetch.mockImplementation((url, options) => {
      if (options?.method === 'PATCH') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Network error' })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          email_notifications: true,
          sms_notifications: false,
          push_notifications: true,
          theme: 'system',
          language: 'en',
          timezone: 'UTC'
        })
      });
    });

    render(
      <PreferencesProvider>
        <NotificationsPreferences />
      </PreferencesProvider>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText(/Email Notifications/i)).toBeInTheDocument();
    });

    // Toggle a preference
    const emailToggle = screen.getByRole('switch', { name: /toggle email notifications/i });
    fireEvent.click(emailToggle);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to save preferences/i)).toBeInTheDocument();
    }, { timeout: 1500 });

    // Verify retry button is present
    expect(screen.getByRole('button', { name: /retry saving preferences/i })).toBeInTheDocument();
  });

  test('saves preferences within 500ms', async () => {
    const startTime = Date.now();
    
    render(
      <PreferencesProvider>
        <NotificationsPreferences />
      </PreferencesProvider>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText(/Email Notifications/i)).toBeInTheDocument();
    });

    // Toggle a preference
    const emailToggle = screen.getByRole('switch', { name: /toggle email notifications/i });
    fireEvent.click(emailToggle);

    // Wait for save to complete
    await waitFor(() => {
      const patchCalls = global.fetch.mock.calls.filter(call => call[1]?.method === 'PATCH');
      expect(patchCalls.length).toBeGreaterThan(0);
    }, { timeout: 1000 });

    const endTime = Date.now();
    const saveTime = endTime - startTime;

    // Should save within 500ms + some buffer for rendering
    expect(saveTime).toBeLessThan(1000);
  });

  test('multiple rapid changes save correctly', async () => {
    render(
      <PreferencesProvider>
        <NotificationsPreferences />
      </PreferencesProvider>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText(/Email Notifications/i)).toBeInTheDocument();
    });

    // Make multiple rapid changes
    const emailToggle = screen.getByRole('switch', { name: /toggle email notifications/i });
    const smsToggle = screen.getByRole('switch', { name: /toggle sms notifications/i });
    
    fireEvent.click(emailToggle);
    fireEvent.click(smsToggle);

    // Wait for saves to complete (debounced, so should only be one call)
    await waitFor(() => {
      const patchCalls = global.fetch.mock.calls.filter(call => call[1]?.method === 'PATCH');
      expect(patchCalls.length).toBeGreaterThan(0);
    }, { timeout: 1500 });

    // Verify the final state was saved
    const lastPatchCall = global.fetch.mock.calls
      .filter(call => call[1]?.method === 'PATCH')
      .pop();
    
    const requestBody = JSON.parse(lastPatchCall[1].body);
    expect(requestBody.email_notifications).toBe(false);
    expect(requestBody.sms_notifications).toBe(true);
  });
});
