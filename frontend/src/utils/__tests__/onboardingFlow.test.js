import {
  getCurrentOnboardingStep,
  clearOnboardingData,
  hasValidSetupToken,
  getNextOnboardingStep,
  getPreviousOnboardingStep,
  canAccessStep,
  setSetupAuthToken,
  setSetupEmployeeData,
  setSetupUsername,
  getSetupEmployeeData,
  getSetupAuthToken,
  getSetupUsername,
} from '../onboardingFlow';

describe('onboardingFlow utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('getCurrentOnboardingStep', () => {
    it('should return "phone-auth" when no data is stored', () => {
      expect(getCurrentOnboardingStep()).toBe('phone-auth');
    });

    it('should return "account-setup" when auth token and employee data are stored', () => {
      localStorage.setItem('setupAuthToken', 'test-token');
      localStorage.setItem('setupEmployeeData', JSON.stringify({ name: 'Test' }));
      expect(getCurrentOnboardingStep()).toBe('account-setup');
    });

    it('should return "password-setup" when all setup data is stored', () => {
      localStorage.setItem('setupAuthToken', 'test-token');
      localStorage.setItem('setupEmployeeData', JSON.stringify({ name: 'Test' }));
      localStorage.setItem('setupUsername', 'test.user');
      expect(getCurrentOnboardingStep()).toBe('password-setup');
    });

    it('should return "complete" when regular auth token exists', () => {
      localStorage.setItem('authToken', 'regular-token');
      expect(getCurrentOnboardingStep()).toBe('complete');
    });
  });

  describe('clearOnboardingData', () => {
    it('should clear all onboarding-related data', () => {
      localStorage.setItem('setupAuthToken', 'test-token');
      localStorage.setItem('setupEmployeeData', JSON.stringify({ name: 'Test' }));
      localStorage.setItem('setupUsername', 'test.user');

      clearOnboardingData();

      expect(localStorage.getItem('setupAuthToken')).toBeNull();
      expect(localStorage.getItem('setupEmployeeData')).toBeNull();
      expect(localStorage.getItem('setupUsername')).toBeNull();
    });
  });

  describe('hasValidSetupToken', () => {
    it('should return true when setup token exists', () => {
      localStorage.setItem('setupAuthToken', 'test-token');
      expect(hasValidSetupToken()).toBe(true);
    });

    it('should return false when setup token does not exist', () => {
      expect(hasValidSetupToken()).toBe(false);
    });
  });

  describe('getNextOnboardingStep', () => {
    it('should return correct next step for phone-auth', () => {
      expect(getNextOnboardingStep('phone-auth')).toBe('/account-setup');
    });

    it('should return correct next step for account-setup', () => {
      expect(getNextOnboardingStep('account-setup')).toBe('/password-setup');
    });

    it('should return correct next step for password-setup', () => {
      expect(getNextOnboardingStep('password-setup')).toBe('/dashboard');
    });

    it('should return phone-auth for unknown step', () => {
      expect(getNextOnboardingStep('unknown')).toBe('/phone-auth');
    });
  });

  describe('getPreviousOnboardingStep', () => {
    it('should return correct previous step for account-setup', () => {
      expect(getPreviousOnboardingStep('account-setup')).toBe('/phone-auth');
    });

    it('should return correct previous step for password-setup', () => {
      expect(getPreviousOnboardingStep('password-setup')).toBe('/account-setup');
    });

    it('should return phone-auth for unknown step', () => {
      expect(getPreviousOnboardingStep('unknown')).toBe('/phone-auth');
    });
  });

  describe('canAccessStep', () => {
    it('should allow access to phone-auth without any tokens', () => {
      expect(canAccessStep('phone-auth')).toBe(true);
    });

    it('should allow access to account-setup with auth token and employee data', () => {
      localStorage.setItem('setupAuthToken', 'test-token');
      localStorage.setItem('setupEmployeeData', JSON.stringify({ name: 'Test' }));
      expect(canAccessStep('account-setup')).toBe(true);
    });

    it('should deny access to account-setup without auth token', () => {
      localStorage.setItem('setupEmployeeData', JSON.stringify({ name: 'Test' }));
      expect(canAccessStep('account-setup')).toBe(false);
    });

    it('should allow access to password-setup with all required data', () => {
      localStorage.setItem('setupAuthToken', 'test-token');
      localStorage.setItem('setupEmployeeData', JSON.stringify({ name: 'Test' }));
      localStorage.setItem('setupUsername', 'test.user');
      expect(canAccessStep('password-setup')).toBe(true);
    });

    it('should deny access to password-setup without username', () => {
      localStorage.setItem('setupAuthToken', 'test-token');
      localStorage.setItem('setupEmployeeData', JSON.stringify({ name: 'Test' }));
      expect(canAccessStep('password-setup')).toBe(false);
    });
  });

  describe('setters and getters', () => {
    it('should set and get setup auth token', () => {
      setSetupAuthToken('test-token');
      expect(getSetupAuthToken()).toBe('test-token');
    });

    it('should set and get setup employee data', () => {
      const employeeData = { name: 'Test User', email: 'test@example.com' };
      setSetupEmployeeData(employeeData);
      expect(getSetupEmployeeData()).toEqual(employeeData);
    });

    it('should set and get setup username', () => {
      setSetupUsername('test.user');
      expect(getSetupUsername()).toBe('test.user');
    });

    it('should return null for employee data when not set', () => {
      expect(getSetupEmployeeData()).toBeNull();
    });

    it('should return null for employee data when JSON is invalid', () => {
      localStorage.setItem('setupEmployeeData', 'invalid-json');
      expect(getSetupEmployeeData()).toBeNull();
    });

    it('should return null for auth token when not set', () => {
      expect(getSetupAuthToken()).toBeNull();
    });

    it('should return null for username when not set', () => {
      expect(getSetupUsername()).toBeNull();
    });
  });
});
