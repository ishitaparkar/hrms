import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotificationsPreferences from '../NotificationsPreferences';
import { PreferencesProvider } from '../../../contexts/PreferencesContext';
import axios from 'axios';

jest.mock('axios');

describe('NotificationsPreferences', () => {
  const mockPreferences = {
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    theme: 'light'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: mockPreferences });
  });

  test('loads and displays preferences', async () => {
    render(
      <PreferencesProvider>
        <NotificationsPreferences />
      </PreferencesProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Email Notifications/i)).toBeInTheDocument();
    });
  });

  test('saves preferences when changed', async () => {
    axios.patch.mockResolvedValue({ data: { ...mockPreferences, email_notifications: false } });

    render(
      <PreferencesProvider>
        <NotificationsPreferences />
      </PreferencesProvider>
    );

    await waitFor(() => {
      const toggle = screen.getAllByRole('checkbox')[0];
      if (toggle) {
        fireEvent.click(toggle);
      }
    });

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});
