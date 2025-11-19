import React, { useState, useEffect } from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';

const NotificationsPreferences = () => {
  const { preferences, updatePreferences, loading: contextLoading } = usePreferences();
  const [localPreferences, setLocalPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    theme: 'system'
  });
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Sync local state with context preferences
  useEffect(() => {
    if (preferences) {
      setLocalPreferences({
        emailNotifications: preferences.emailNotifications ?? true,
        smsNotifications: preferences.smsNotifications ?? false,
        pushNotifications: preferences.pushNotifications ?? true,
        theme: preferences.theme ?? 'system'
      });
    }
  }, [preferences]);

  // Auto-save functionality with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!contextLoading && preferences) {
        // Compare current local state with context preferences
        const hasChanges = 
          localPreferences.emailNotifications !== preferences.emailNotifications ||
          localPreferences.smsNotifications !== preferences.smsNotifications ||
          localPreferences.pushNotifications !== preferences.pushNotifications ||
          localPreferences.theme !== preferences.theme;
        
        if (hasChanges) {
          handleSave();
        }
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localPreferences]);

  const handleSave = async () => {
    setSaving(true);
    setErrorMessage('');
    const result = await updatePreferences(localPreferences);
    setSaving(false);

    if (result.success) {
      setSuccessMessage('Preferences saved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setErrorMessage(result.error || 'Failed to save preferences. Please try again.');
    }
  };

  const handleRetry = () => {
    setErrorMessage('');
    handleSave();
  };

  const handleToggle = (key) => {
    setLocalPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleThemeChange = (theme) => {
    setLocalPreferences(prev => ({
      ...prev,
      theme
    }));
  };

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="region" aria-label="Notifications and preferences settings">
      {/* Success Message */}
      {successMessage && (
        <div 
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-4 py-3 rounded-lg flex items-center"
          role="alert"
          aria-live="polite"
        >
          <span className="material-icons text-green-600 dark:text-green-400 mr-2" aria-hidden="true">check_circle</span>
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div 
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="material-icons text-red-600 dark:text-red-400 mr-2">error</span>
              <span className="text-sm font-medium">{errorMessage}</span>
            </div>
            <button
              onClick={handleRetry}
              className="ml-4 inline-flex items-center gap-1 px-3 py-1 text-sm text-red-800 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label="Retry saving preferences"
            >
              <span className="material-icons text-sm" aria-hidden="true">refresh</span>
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Notifications Section */}
      <section aria-labelledby="notification-preferences-heading" className="bg-background-light dark:bg-background-dark p-6 rounded-lg border border-border-light dark:border-border-dark">
        <h3 id="notification-preferences-heading" className="text-lg font-semibold text-text-light dark:text-text-dark mb-4 flex items-center">
          <span className="material-icons text-primary mr-2" aria-hidden="true">notifications</span>
          Notification Preferences
        </h3>
        <p className="text-sm text-subtext-light dark:text-subtext-dark mb-6">
          Choose how you want to receive notifications from the system
        </p>

        <div className="space-y-4">
          {/* Email Notifications Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg hover:bg-card-light dark:hover:bg-card-dark transition-colors">
            <div className="flex items-start space-x-3">
              <span className="material-icons text-primary mt-1" aria-hidden="true">email</span>
              <div>
                <label 
                  htmlFor="email-notifications" 
                  className="text-sm font-medium text-text-light dark:text-text-dark cursor-pointer"
                >
                  Email Notifications
                </label>
                <p className="text-xs text-subtext-light dark:text-subtext-dark mt-1" id="email-notifications-description">
                  Receive notifications via email
                </p>
              </div>
            </div>
            <button
              id="email-notifications"
              type="button"
              role="switch"
              aria-checked={localPreferences.emailNotifications}
              aria-describedby="email-notifications-description"
              aria-label="Toggle email notifications"
              onClick={() => handleToggle('emailNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                localPreferences.emailNotifications ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localPreferences.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
                aria-hidden="true"
              />
            </button>
          </div>

          {/* SMS Notifications Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg hover:bg-card-light dark:hover:bg-card-dark transition-colors">
            <div className="flex items-start space-x-3">
              <span className="material-icons text-primary mt-1" aria-hidden="true">sms</span>
              <div>
                <label 
                  htmlFor="sms-notifications" 
                  className="text-sm font-medium text-text-light dark:text-text-dark cursor-pointer"
                >
                  SMS Notifications
                </label>
                <p className="text-xs text-subtext-light dark:text-subtext-dark mt-1" id="sms-notifications-description">
                  Receive notifications via SMS
                </p>
              </div>
            </div>
            <button
              id="sms-notifications"
              type="button"
              role="switch"
              aria-checked={localPreferences.smsNotifications}
              aria-describedby="sms-notifications-description"
              aria-label="Toggle SMS notifications"
              onClick={() => handleToggle('smsNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                localPreferences.smsNotifications ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localPreferences.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
                aria-hidden="true"
              />
            </button>
          </div>

          {/* Push Notifications Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg hover:bg-card-light dark:hover:bg-card-dark transition-colors">
            <div className="flex items-start space-x-3">
              <span className="material-icons text-primary mt-1" aria-hidden="true">notifications_active</span>
              <div>
                <label 
                  htmlFor="push-notifications" 
                  className="text-sm font-medium text-text-light dark:text-text-dark cursor-pointer"
                >
                  Push Notifications
                </label>
                <p className="text-xs text-subtext-light dark:text-subtext-dark mt-1" id="push-notifications-description">
                  Receive push notifications in your browser
                </p>
              </div>
            </div>
            <button
              id="push-notifications"
              type="button"
              role="switch"
              aria-checked={localPreferences.pushNotifications}
              aria-describedby="push-notifications-description"
              aria-label="Toggle push notifications"
              onClick={() => handleToggle('pushNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                localPreferences.pushNotifications ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localPreferences.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </section>

      {/* Theme Preferences Section */}
      <section aria-labelledby="theme-preferences-heading" className="bg-background-light dark:bg-background-dark p-6 rounded-lg border border-border-light dark:border-border-dark">
        <h3 id="theme-preferences-heading" className="text-lg font-semibold text-text-light dark:text-text-dark mb-4 flex items-center">
          <span className="material-icons text-primary mr-2" aria-hidden="true">palette</span>
          Theme Preferences
        </h3>
        <p className="text-sm text-subtext-light dark:text-subtext-dark mb-6">
          Choose your preferred theme for the application
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="radiogroup" aria-label="Theme selection">
          {/* Light Theme */}
          <button
            onClick={() => handleThemeChange('light')}
            className={`p-4 rounded-lg border-2 transition-all ${
              localPreferences.theme === 'light'
                ? 'border-primary bg-primary/5'
                : 'border-border-light dark:border-border-dark hover:border-primary/50'
            }`}
            role="radio"
            aria-checked={localPreferences.theme === 'light'}
            aria-label="Light theme"
          >
            <div className="flex flex-col items-center space-y-2">
              <span className="material-icons text-3xl text-yellow-500" aria-hidden="true">light_mode</span>
              <span className="text-sm font-medium text-text-light dark:text-text-dark">Light</span>
              {localPreferences.theme === 'light' && (
                <span className="material-icons text-primary text-sm" aria-hidden="true">check_circle</span>
              )}
            </div>
          </button>

          {/* Dark Theme */}
          <button
            onClick={() => handleThemeChange('dark')}
            className={`p-4 rounded-lg border-2 transition-all ${
              localPreferences.theme === 'dark'
                ? 'border-primary bg-primary/5'
                : 'border-border-light dark:border-border-dark hover:border-primary/50'
            }`}
            role="radio"
            aria-checked={localPreferences.theme === 'dark'}
            aria-label="Dark theme"
          >
            <div className="flex flex-col items-center space-y-2">
              <span className="material-icons text-3xl text-indigo-500" aria-hidden="true">dark_mode</span>
              <span className="text-sm font-medium text-text-light dark:text-text-dark">Dark</span>
              {localPreferences.theme === 'dark' && (
                <span className="material-icons text-primary text-sm" aria-hidden="true">check_circle</span>
              )}
            </div>
          </button>

          {/* System Theme */}
          <button
            onClick={() => handleThemeChange('system')}
            className={`p-4 rounded-lg border-2 transition-all ${
              localPreferences.theme === 'system'
                ? 'border-primary bg-primary/5'
                : 'border-border-light dark:border-border-dark hover:border-primary/50'
            }`}
            role="radio"
            aria-checked={localPreferences.theme === 'system'}
            aria-label="System default theme"
          >
            <div className="flex flex-col items-center space-y-2">
              <span className="material-icons text-3xl text-gray-500" aria-hidden="true">settings_suggest</span>
              <span className="text-sm font-medium text-text-light dark:text-text-dark">System</span>
              {localPreferences.theme === 'system' && (
                <span className="material-icons text-primary text-sm" aria-hidden="true">check_circle</span>
              )}
            </div>
          </button>
        </div>
      </section>

      {/* Saving Indicator */}
      {saving && (
        <div className="flex items-center justify-center text-sm text-subtext-light dark:text-subtext-dark">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
          Saving preferences...
        </div>
      )}
    </div>
  );
};

export default NotificationsPreferences;
