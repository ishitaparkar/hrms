import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import OnboardingRouteGuard from '../OnboardingRouteGuard';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Test component
const TestComponent = ({ step }) => <div>Test Component for {step}</div>;

describe('OnboardingRouteGuard', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    mockNavigate.mockClear();
  });

  describe('phone-auth step', () => {
    it('should allow access to phone-auth without any tokens', () => {
      render(
        <BrowserRouter>
          <OnboardingRouteGuard requiredStep="phone-auth">
            <TestComponent step="phone-auth" />
          </OnboardingRouteGuard>
        </BrowserRouter>
      );

      expect(screen.getByText('Test Component for phone-auth')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should redirect to dashboard if user is already authenticated', async () => {
      localStorage.setItem('authToken', 'test-auth-token');

      render(
        <BrowserRouter>
          <OnboardingRouteGuard requiredStep="phone-auth">
            <TestComponent step="phone-auth" />
          </OnboardingRouteGuard>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });
  });

  describe('account-setup step', () => {
    it('should allow access with valid auth token and employee data', () => {
      localStorage.setItem('setupAuthToken', 'test-setup-token');
      localStorage.setItem('setupEmployeeData', JSON.stringify({ name: 'Test User' }));

      render(
        <BrowserRouter>
          <OnboardingRouteGuard requiredStep="account-setup">
            <TestComponent step="account-setup" />
          </OnboardingRouteGuard>
        </BrowserRouter>
      );

      expect(screen.getByText('Test Component for account-setup')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should redirect to phone-auth if auth token is missing', async () => {
      localStorage.setItem('setupEmployeeData', JSON.stringify({ name: 'Test User' }));

      render(
        <BrowserRouter>
          <OnboardingRouteGuard requiredStep="account-setup">
            <TestComponent step="account-setup" />
          </OnboardingRouteGuard>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/phone-auth', { replace: true });
      });
    });

    it('should redirect to phone-auth if employee data is missing', async () => {
      localStorage.setItem('setupAuthToken', 'test-setup-token');

      render(
        <BrowserRouter>
          <OnboardingRouteGuard requiredStep="account-setup">
            <TestComponent step="account-setup" />
          </OnboardingRouteGuard>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/phone-auth', { replace: true });
      });
    });
  });

  describe('password-setup step', () => {
    it('should allow access with all required data', () => {
      localStorage.setItem('setupAuthToken', 'test-setup-token');
      localStorage.setItem('setupEmployeeData', JSON.stringify({ name: 'Test User' }));
      localStorage.setItem('setupUsername', 'test.user');

      render(
        <BrowserRouter>
          <OnboardingRouteGuard requiredStep="password-setup">
            <TestComponent step="password-setup" />
          </OnboardingRouteGuard>
        </BrowserRouter>
      );

      expect(screen.getByText('Test Component for password-setup')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should redirect to phone-auth if username is missing', async () => {
      localStorage.setItem('setupAuthToken', 'test-setup-token');
      localStorage.setItem('setupEmployeeData', JSON.stringify({ name: 'Test User' }));

      render(
        <BrowserRouter>
          <OnboardingRouteGuard requiredStep="password-setup">
            <TestComponent step="password-setup" />
          </OnboardingRouteGuard>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/phone-auth', { replace: true });
      });
    });

    it('should redirect to phone-auth if auth token is missing', async () => {
      localStorage.setItem('setupEmployeeData', JSON.stringify({ name: 'Test User' }));
      localStorage.setItem('setupUsername', 'test.user');

      render(
        <BrowserRouter>
          <OnboardingRouteGuard requiredStep="password-setup">
            <TestComponent step="password-setup" />
          </OnboardingRouteGuard>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/phone-auth', { replace: true });
      });
    });
  });

  describe('authenticated user handling', () => {
    it('should redirect authenticated users to dashboard from any onboarding step', async () => {
      localStorage.setItem('authToken', 'regular-auth-token');
      localStorage.setItem('setupAuthToken', 'test-setup-token');
      localStorage.setItem('setupEmployeeData', JSON.stringify({ name: 'Test User' }));

      render(
        <BrowserRouter>
          <OnboardingRouteGuard requiredStep="account-setup">
            <TestComponent step="account-setup" />
          </OnboardingRouteGuard>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });
  });
});
