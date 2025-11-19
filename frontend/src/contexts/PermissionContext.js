import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create the Permission Context
const PermissionContext = createContext({
  roles: [],
  permissions: [],
  department: null,
  user: null,
  loading: true,
  hasPermission: (permission) => false,
  hasRole: (role) => false,
  refreshPermissions: () => {},
  setAuthData: (data) => {},
  clearAuthData: () => {},
});

// Custom hook to use the Permission Context
export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  return context;
};

// Permission Provider Component
export const PermissionProvider = ({ children }) => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [department, setDepartment] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    firstName: null,
    lastName: null,
    fullName: null,
    employeeId: null,
    requiresPasswordChange: false,
  });

  // Function to check if user has a specific permission
  const hasPermission = (permission) => {
    if (!permission) return true;
    return permissions.includes(permission);
  };

  // Function to check if user has a specific role
  const hasRole = (role) => {
    if (!role) return true;
    return roles.includes(role);
  };

  // Function to set authentication data from login response
  const setAuthData = (data) => {
    const { 
      roles: userRoles = [], 
      permissions: userPermissions = [], 
      department: userDepartment = null, 
      user_id, 
      email,
      first_name = null,
      last_name = null,
      full_name = null,
      employee_id = null,
      requires_password_change = false
    } = data;
    
    setRoles(userRoles);
    setPermissions(userPermissions);
    setDepartment(userDepartment);
    setUser({ id: user_id, email });
    
    // Set employee name data with fallback values
    setUserData({
      firstName: first_name,
      lastName: last_name,
      fullName: full_name,
      employeeId: employee_id,
      requiresPasswordChange: requires_password_change,
    });
    
    // Store in localStorage for persistence
    localStorage.setItem('userRoles', JSON.stringify(userRoles));
    localStorage.setItem('userPermissions', JSON.stringify(userPermissions));
    localStorage.setItem('userDepartment', userDepartment || '');
    localStorage.setItem('userId', user_id);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userFirstName', first_name || '');
    localStorage.setItem('userLastName', last_name || '');
    localStorage.setItem('userFullName', full_name || '');
    localStorage.setItem('userEmployeeId', employee_id || '');
    localStorage.setItem('requiresPasswordChange', requires_password_change ? 'true' : 'false');
    
    setLoading(false);
  };

  // Function to clear authentication data on logout
  const clearAuthData = () => {
    setRoles([]);
    setPermissions([]);
    setDepartment(null);
    setUser(null);
    setUserData({
      firstName: null,
      lastName: null,
      fullName: null,
      employeeId: null,
      requiresPasswordChange: false,
    });
    
    // Clear from localStorage
    localStorage.removeItem('userRoles');
    localStorage.removeItem('userPermissions');
    localStorage.removeItem('userDepartment');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userFirstName');
    localStorage.removeItem('userLastName');
    localStorage.removeItem('userFullName');
    localStorage.removeItem('userEmployeeId');
    localStorage.removeItem('requiresPasswordChange');
    localStorage.removeItem('authToken');
    
    // Clear axios default header
    delete axios.defaults.headers.common['Authorization'];
  };

  // Function to refresh permissions from the backend
  const refreshPermissions = async () => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Set authorization header
      axios.defaults.headers.common['Authorization'] = `Token ${token}`;
      
      // Call /api/auth/me/ to get current user data
      const response = await axios.get('http://127.0.0.1:8000/api/auth/me/');
      
      const { 
        user: userDataFromApi, 
        roles: userRoles, 
        permissions: userPermissions, 
        profile,
        first_name = null,
        last_name = null,
        full_name = null,
        employee_id = null,
        requires_password_change = false
      } = response.data;
      
      setRoles(userRoles);
      setPermissions(userPermissions);
      setDepartment(profile?.department || null);
      setUser({
        id: userDataFromApi.id,
        email: userDataFromApi.email,
        username: userDataFromApi.username,
        firstName: userDataFromApi.first_name,
        lastName: userDataFromApi.last_name,
      });
      
      // Set employee name data with fallback values
      setUserData({
        firstName: first_name,
        lastName: last_name,
        fullName: full_name,
        employeeId: employee_id,
        requiresPasswordChange: requires_password_change,
      });
      
      // Update localStorage
      localStorage.setItem('userRoles', JSON.stringify(userRoles));
      localStorage.setItem('userPermissions', JSON.stringify(userPermissions));
      localStorage.setItem('userDepartment', profile?.department || '');
      localStorage.setItem('userId', userDataFromApi.id);
      localStorage.setItem('userEmail', userDataFromApi.email);
      localStorage.setItem('userFirstName', first_name || '');
      localStorage.setItem('userLastName', last_name || '');
      localStorage.setItem('userFullName', full_name || '');
      localStorage.setItem('userEmployeeId', employee_id || '');
      localStorage.setItem('requiresPasswordChange', requires_password_change ? 'true' : 'false');
      
    } catch (error) {
      console.error('Failed to refresh permissions:', error);
      
      // If token is invalid, clear auth data
      if (error.response && error.response.status === 401) {
        clearAuthData();
      }
    } finally {
      setLoading(false);
    }
  };

  // Load permissions from localStorage on mount and refresh from backend
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    if (token) {
      // Load from localStorage first for immediate access
      const storedRoles = localStorage.getItem('userRoles');
      const storedPermissions = localStorage.getItem('userPermissions');
      const storedDepartment = localStorage.getItem('userDepartment');
      const storedUserId = localStorage.getItem('userId');
      const storedUserEmail = localStorage.getItem('userEmail');
      const storedFirstName = localStorage.getItem('userFirstName');
      const storedLastName = localStorage.getItem('userLastName');
      const storedFullName = localStorage.getItem('userFullName');
      const storedEmployeeId = localStorage.getItem('userEmployeeId');
      const storedRequiresPasswordChange = localStorage.getItem('requiresPasswordChange');
      
      if (storedRoles) setRoles(JSON.parse(storedRoles));
      if (storedPermissions) setPermissions(JSON.parse(storedPermissions));
      if (storedDepartment) setDepartment(storedDepartment);
      if (storedUserId && storedUserEmail) {
        setUser({ id: parseInt(storedUserId), email: storedUserEmail });
      }
      
      // Load employee name data with fallback to null
      setUserData({
        firstName: storedFirstName || null,
        lastName: storedLastName || null,
        fullName: storedFullName || null,
        employeeId: storedEmployeeId || null,
        requiresPasswordChange: storedRequiresPasswordChange === 'true',
      });
      
      // Then refresh from backend to ensure data is up-to-date
      refreshPermissions();
    } else {
      setLoading(false);
    }
  }, []);

  const value = {
    roles,
    permissions,
    department,
    user,
    userData,
    loading,
    hasPermission,
    hasRole,
    refreshPermissions,
    setAuthData,
    clearAuthData,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export default PermissionContext;
