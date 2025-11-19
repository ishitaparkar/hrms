import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { usePermission } from '../contexts/PermissionContext';

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
      const response = await axios.post('http://127.0.0.1:8000/api/auth/login/', {
        username: username,
        password: password,
      });

      console.log("Login successful:", response.data);
      
      // Store token
      const token = response.data.token;
      localStorage.setItem('authToken', token);
      axios.defaults.headers.common['Authorization'] = `Token ${token}`;
      
      // Store roles, permissions, and department using PermissionContext
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
      
      // Check if user needs to change password on first login
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
    <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
      <div className="w-full max-w-md p-8 space-y-8 bg-card-light dark:bg-card-dark rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">
            University HRMS Portal
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-subtext-light dark:text-subtext-dark">
                Username
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Enter your admin username"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-subtext-light dark:text-subtext-dark">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} // <-- THIS LINE IS NOW CORRECT
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-600 disabled:bg-gray-400"
            >
              {isLoading ? 'Signing In...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;