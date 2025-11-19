import React, { createContext, useContext, useState, useEffect } from 'react';

const PreferencesContext = createContext();

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

export const PreferencesProvider = ({ children }) => {
  const CACHE_KEY = 'userPreferences';
  const CACHE_EXPIRY_KEY = 'userPreferencesExpiry';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Initialize preferences from cache or defaults
  const [preferences, setPreferences] = useState(() => {
    const cached = getCachedPreferences();
    return cached || {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      theme: 'system',
      language: 'en',
      timezone: 'UTC'
    };
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to get cached preferences
  function getCachedPreferences() {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
      
      if (cached && expiry) {
        const expiryTime = parseInt(expiry, 10);
        if (Date.now() < expiryTime) {
          return JSON.parse(cached);
        } else {
          // Cache expired, remove it
          localStorage.removeItem(CACHE_KEY);
          localStorage.removeItem(CACHE_EXPIRY_KEY);
        }
      }
    } catch (err) {
      console.error('Error reading cached preferences:', err);
    }
    return null;
  }

  // Helper function to cache preferences
  function cachePreferences(prefs) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(prefs));
      localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
    } catch (err) {
      console.error('Error caching preferences:', err);
    }
  }

  // Load preferences from API on mount
  useEffect(() => {
    fetchPreferences();
  }, []);

  // Apply theme changes
  useEffect(() => {
    applyTheme(preferences.theme);
  }, [preferences.theme]);

  // Listen for system theme changes when theme is set to 'system'
  useEffect(() => {
    if (preferences.theme !== 'system' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e) => {
      const root = document.documentElement;
      if (e.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    // Add listener for system theme changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    }

    // Cleanup listener on unmount or when theme changes
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      }
    };
  }, [preferences.theme]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      // Check if we have valid cached data
      const cached = getCachedPreferences();
      if (cached) {
        setPreferences(cached);
        setLoading(false);
        // Still fetch in background to update cache
        fetchPreferencesFromAPI();
        return;
      }

      // No cache, fetch from API
      await fetchPreferencesFromAPI();
    } catch (err) {
      console.error('Error fetching preferences:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchPreferencesFromAPI = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('http://localhost:8000/api/auth/preferences/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Convert snake_case to camelCase for consistency
        const normalizedData = {
          emailNotifications: data.email_notifications ?? true,
          smsNotifications: data.sms_notifications ?? false,
          pushNotifications: data.push_notifications ?? true,
          theme: data.theme ?? 'system',
          language: data.language ?? 'en',
          timezone: data.timezone ?? 'UTC'
        };
        setPreferences(normalizedData);
        cachePreferences(normalizedData);
      }
    } catch (err) {
      console.error('Error fetching preferences from API:', err);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Convert camelCase to snake_case for API
      const apiUpdates = {};
      if ('emailNotifications' in updates) apiUpdates.email_notifications = updates.emailNotifications;
      if ('smsNotifications' in updates) apiUpdates.sms_notifications = updates.smsNotifications;
      if ('pushNotifications' in updates) apiUpdates.push_notifications = updates.pushNotifications;
      if ('theme' in updates) apiUpdates.theme = updates.theme;
      if ('language' in updates) apiUpdates.language = updates.language;
      if ('timezone' in updates) apiUpdates.timezone = updates.timezone;

      const response = await fetch('http://localhost:8000/api/auth/preferences/', {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiUpdates)
      });

      if (response.ok) {
        const data = await response.json();
        // Convert snake_case to camelCase for consistency
        const normalizedData = {
          emailNotifications: data.email_notifications ?? true,
          smsNotifications: data.sms_notifications ?? false,
          pushNotifications: data.push_notifications ?? true,
          theme: data.theme ?? 'system',
          language: data.language ?? 'en',
          timezone: data.timezone ?? 'UTC'
        };
        setPreferences(normalizedData);
        cachePreferences(normalizedData); // Cache the updated preferences
        return { success: true, data: normalizedData };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update preferences');
      }
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const applyTheme = (theme) => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else if (theme === 'system') {
      // Check system preference
      if (window.matchMedia) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      } else {
        // Fallback to light theme if matchMedia is not available
        root.classList.remove('dark');
      }
    }
  };

  const value = {
    preferences,
    loading,
    error,
    updatePreferences,
    refreshPreferences: fetchPreferences
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};
