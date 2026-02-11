import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { usePermission } from '../contexts/PermissionContext';
import { getApiUrl } from '../utils/api';
import './LoginPage.css';
import logoImage from '../assets/logo_main.jpg';

const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuthData } = usePermission();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post(getApiUrl('/auth/login/'), {
        username: username,
        password: password,
      });

      console.log("Login successful:", response.data);

      const token = response.data.token;
      localStorage.setItem('authToken', token);
      axios.defaults.headers.common['Authorization'] = `Token ${token}`;

      setAuthData({
        roles: response.data.roles || [],
        permissions: response.data.permissions || [],
        department: response.data.department || null,
        user_id: response.data.user_id,
        email: response.data.email,
        first_name: response.data.first_name,
        last_name: response.data.last_name,
        full_name: response.data.full_name,
        employee_id: response.data.employee_id,
        requires_password_change: response.data.requires_password_change,
      });

      if (response.data.requires_password_change) {
        navigate('/first-login-password-change');
      } else {
        navigate('/dashboard');
      }

    } catch (err) {
      console.error("Login failed:", err.response);
      setError('Invalid username or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-sans">
      {/* LEFT SIDE: Logo instead of Background Image */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-white items-center justify-center p-12 border-r border-gray-100">
        <div className="flex flex-col items-center justify-center">
          <img
            src={logoImage}
            alt="University Logo"
            className="max-w-md w-full object-contain drop-shadow-sm"
          />
        </div>
      </div>

      {/* RIGHT SIDE: Login Form */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col justify-center items-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md space-y-8">

          {/* Header */}
          <div className="text-left">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Login to University HRMS</h2>
            <p className="mt-2 text-sm text-gray-500">Please enter your details to continue.</p>
          </div>

          {/* Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-100 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="sr-only">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email or Username"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition-colors"
              >
                {isLoading ? 'Signing In...' : 'Continue'}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          {/* Social / Alternative Logins (Placeholders) */}
          <div className="space-y-3">
            <button type="button" className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <span className="material-icons text-gray-400 mr-2 text-lg">smartphone</span>
              Continue with Mobile
            </button>
            <button type="button" className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <img src="https://www.svgrepo.com/show/355117/microsoft.svg" alt="Microsoft" className="h-5 w-5 mr-2" />
              Continue with Microsoft
            </button>
            <button type="button" className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5 mr-2" />
              Continue with Google
            </button>
          </div>

          {/* Footer App Badges (Visual only) */}
          <div className="pt-8">
            <div className="flex justify-center space-x-4">
              {/* Placeholders for App Store buttons */}
              <div className="h-10 w-32 bg-black rounded-md flex items-center justify-center text-white text-xs cursor-not-allowed opacity-80">
                <span className="material-icons mr-1">apple</span> App Store
              </div>
              <div className="h-10 w-32 bg-black rounded-md flex items-center justify-center text-white text-xs cursor-not-allowed opacity-80">
                <span className="material-icons mr-1">android</span> Google Play
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-gray-400">
              By logging in, you agree to the <button className="underline hover:text-gray-500">Terms of Use</button> and <button className="underline hover:text-gray-500">Privacy Policy</button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;