# Permission Context

This directory contains the PermissionContext implementation for role-based access control in the frontend.

## PermissionContext.js

Provides a React Context for managing user authentication, roles, and permissions throughout the application.

### Features

- **Authentication State Management**: Stores user authentication data including roles, permissions, and department
- **Permission Checking**: Provides `hasPermission()` and `hasRole()` helper functions
- **Automatic Refresh**: Calls `/api/auth/me/` on app load to refresh user permissions
- **LocalStorage Persistence**: Stores auth data in localStorage for persistence across page refreshes
- **Loading State**: Provides a loading state while permissions are being fetched

### Usage

#### Wrap your app with PermissionProvider

```javascript
import { PermissionProvider } from './contexts/PermissionContext';

function App() {
  return (
    <PermissionProvider>
      {/* Your app components */}
    </PermissionProvider>
  );
}
```

#### Use the usePermission hook in components

```javascript
import { usePermission } from '../contexts/PermissionContext';

function MyComponent() {
  const { roles, permissions, hasRole, hasPermission, user, department } = usePermission();

  if (hasRole('Super Admin')) {
    return <AdminPanel />;
  }

  if (hasPermission('employee_management.manage_employees')) {
    return <EmployeeManagement />;
  }

  return <RestrictedView />;
}
```

#### Set auth data on login

```javascript
import { usePermission } from '../contexts/PermissionContext';

function LoginPage() {
  const { setAuthData } = usePermission();

  const handleLogin = async (username, password) => {
    const response = await axios.post('/api/auth/login/', { username, password });
    
    // Store auth data in context and localStorage
    setAuthData({
      roles: response.data.roles,
      permissions: response.data.permissions,
      department: response.data.department,
      user_id: response.data.user_id,
      email: response.data.email,
    });
  };
}
```

#### Clear auth data on logout

```javascript
import { usePermission } from '../contexts/PermissionContext';

function LogoutButton() {
  const { clearAuthData } = usePermission();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuthData();
    navigate('/');
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

### API Reference

#### Context Values

- `roles`: Array of role names assigned to the user
- `permissions`: Array of permission strings assigned to the user
- `department`: User's department (string or null)
- `user`: User object with id and email
- `loading`: Boolean indicating if permissions are being loaded
- `hasPermission(permission)`: Function to check if user has a specific permission
- `hasRole(role)`: Function to check if user has a specific role
- `refreshPermissions()`: Function to refresh permissions from the backend
- `setAuthData(data)`: Function to set authentication data
- `clearAuthData()`: Function to clear authentication data

### LocalStorage Keys

The context stores the following keys in localStorage:

- `authToken`: Authentication token
- `userRoles`: JSON array of role names
- `userPermissions`: JSON array of permission strings
- `userDepartment`: User's department
- `userId`: User ID
- `userEmail`: User email
