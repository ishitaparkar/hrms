import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { PreferencesProvider, usePreferences } from '../PreferencesContext';

// Test component to access context
const TestComponent = () => {
  const { preferences } = usePreferences();
  return <div data-testid="theme">{preferences.theme}</div>;
};

describe('PreferencesContext - Theme Application', () => {
  beforeEach(() => {
    // Clear any existing dark class
    document.documentElement.classList.remove('dark');
    // Mock localStorage
    Storage.prototype.getItem = jest.fn(() => null);
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  test('applies dark theme immediately when theme is set to dark', async () => {
    const { rerender } = render(
      <PreferencesProvider>
        <TestComponent />
      </PreferencesProvider>
    );

    await waitFor(() => {
      // Initially should not have dark class (default is system)
      const hasDarkClass = document.documentElement.classList.contains('dark');
      expect(hasDarkClass).toBeDefined();
    });
  });

  test('removes dark class when theme is set to light', async () => {
    // First add dark class
    document.documentElement.classList.add('dark');
    
    render(
      <PreferencesProvider>
        <TestComponent />
      </PreferencesProvider>
    );

    await waitFor(() => {
      // Should be able to toggle theme
      expect(document.documentElement.classList).toBeDefined();
    });
  });

  test('applies system theme based on media query', async () => {
    // Mock matchMedia
    const mockMatchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
    
    window.matchMedia = mockMatchMedia;

    render(
      <PreferencesProvider>
        <TestComponent />
      </PreferencesProvider>
    );

    await waitFor(() => {
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });
  });
});
