import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { usePermission } from '../contexts/PermissionContext';
import PermissionError from '../components/PermissionError';
import usePermissionError from '../hooks/usePermissionError';

const RoleManagementPage = () => {
  const { hasRole } = usePermission();
  const { permissionError, handleApiError, clearPermissionError } = usePermissionError();
  
  // State management
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [roleToRevoke, setRoleToRevoke] = useState(null);
  
  // Form state for role assignment
  const [assignmentForm, setAssignmentForm] = useState({
    role_id: '',
    expires_at: '',
    notes: ''
  });

  // Fetch all users with their roles
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get('http://127.0.0.1:8000/api/auth/users/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      // Ensure response.data is an array
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        console.error('Users API response is not an array:', response.data);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      if (!handleApiError(error)) {
        alert('Failed to fetch users');
      }
    }
  };

  // Fetch all available roles
  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get('http://127.0.0.1:8000/api/auth/roles/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      // Ensure response.data is an array
      if (Array.isArray(response.data)) {
        setRoles(response.data);
      } else {
        console.error('Roles API response is not an array:', response.data);
        setRoles([]);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRoles([]);
      if (!handleApiError(error)) {
        alert('Failed to fetch roles');
      }
    }
  };

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchUsers(), fetchRoles()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Open assign role modal
  const handleOpenAssignModal = (user) => {
    setSelectedUser(user);
    setAssignmentForm({ role_id: '', expires_at: '', notes: '' });
    setShowAssignModal(true);
  };

  // Close assign role modal
  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setSelectedUser(null);
    setAssignmentForm({ role_id: '', expires_at: '', notes: '' });
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setAssignmentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit role assignment
  const handleAssignRole = async (e) => {
    e.preventDefault();
    
    if (!assignmentForm.role_id) {
      alert('Please select a role');
      return;
    }

    try {
      const payload = {
        role_id: parseInt(assignmentForm.role_id),
        notes: assignmentForm.notes
      };

      // Only include expires_at if it's set
      if (assignmentForm.expires_at) {
        payload.expires_at = new Date(assignmentForm.expires_at).toISOString();
      }

      const token = localStorage.getItem('authToken');
      await axios.post(
        `http://127.0.0.1:8000/api/auth/users/${selectedUser.id}/assign-role/`,
        payload,
        {
          headers: {
            'Authorization': `Token ${token}`
          }
        }
      );

      alert('Role assigned successfully');
      handleCloseAssignModal();
      await fetchUsers(); // Refresh user list
    } catch (error) {
      console.error('Error assigning role:', error);
      if (!handleApiError(error)) {
        if (error.response?.data?.detail) {
          alert(error.response.data.detail);
        } else {
          alert('Failed to assign role');
        }
      }
    }
  };

  // Open revoke confirmation modal
  const handleOpenRevokeModal = (user, role) => {
    setSelectedUser(user);
    setRoleToRevoke(role);
    setShowRevokeModal(true);
  };

  // Close revoke modal
  const handleCloseRevokeModal = () => {
    setShowRevokeModal(false);
    setSelectedUser(null);
    setRoleToRevoke(null);
  };

  // Confirm role revocation
  const handleRevokeRole = async () => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.post(
        `http://127.0.0.1:8000/api/auth/users/${selectedUser.id}/revoke-role/`,
        { role_id: roleToRevoke.role },
        {
          headers: {
            'Authorization': `Token ${token}`
          }
        }
      );

      alert('Role revoked successfully');
      handleCloseRevokeModal();
      await fetchUsers(); // Refresh user list
    } catch (error) {
      console.error('Error revoking role:', error);
      if (!handleApiError(error)) {
        if (error.response?.data?.detail) {
          alert(error.response.data.detail);
        } else {
          alert('Failed to revoke role');
        }
      }
    }
  };

  // Calculate time remaining for temporary roles
  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return null;
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  // Check if user is Super Admin
  if (!hasRole('Super Admin')) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600">You must be a Super Admin to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Permission Error Modal */}
      <PermissionError error={permissionError} onClose={clearPermissionError} />
      
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">Role Management</h1>
        <p className="text-sm text-subtext-light mt-1">Assign and manage user roles across the system</p>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-subtext-light">Loading users and roles...</p>
        </div>
      ) : (
        <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background-light dark:bg-gray-800 border-b border-border-light">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-text-light dark:text-text-dark">User</th>
                  <th className="px-6 py-4 text-left font-semibold text-text-light dark:text-text-dark">Email</th>
                  <th className="px-6 py-4 text-left font-semibold text-text-light dark:text-text-dark">Current Roles</th>
                  <th className="px-6 py-4 text-left font-semibold text-text-light dark:text-text-dark">Temporary Roles</th>
                  <th className="px-6 py-4 text-center font-semibold text-text-light dark:text-text-dark">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-subtext-light">
                      No users found in the system.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                  <tr key={user.id} className="border-b border-border-light hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4">
                      <div className="font-medium text-text-light dark:text-text-dark">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-xs text-subtext-light">@{user.username}</div>
                    </td>
                    <td className="px-6 py-4 text-subtext-light">{user.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map((role, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {role}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-subtext-light italic">No roles assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {user.active_role_assignments && user.active_role_assignments.length > 0 ? (
                          user.active_role_assignments
                            .filter(assignment => assignment.expires_at)
                            .map((assignment) => (
                              <div key={assignment.id} className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                  {assignment.role_name}
                                </span>
                                <span className="text-xs text-subtext-light">
                                  {getTimeRemaining(assignment.expires_at)}
                                </span>
                                <button
                                  onClick={() => handleOpenRevokeModal(user, assignment)}
                                  className="text-red-500 hover:text-red-700"
                                  title="Revoke role"
                                >
                                  <span className="material-icons text-sm">close</span>
                                </button>
                              </div>
                            ))
                        ) : (
                          <span className="text-xs text-subtext-light italic">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleOpenAssignModal(user)}
                        className="inline-flex items-center px-3 py-1.5 bg-primary text-white rounded-md hover:bg-blue-600 text-xs font-medium"
                      >
                        <span className="material-icons text-sm mr-1">add</span>
                        Assign Role
                      </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign Role Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-text-light dark:text-text-dark">
                  Assign Role to {selectedUser?.username}
                </h2>
                <button
                  onClick={handleCloseAssignModal}
                  className="text-subtext-light hover:text-text-light"
                >
                  <span className="material-icons">close</span>
                </button>
              </div>

              <form onSubmit={handleAssignRole} className="space-y-4">
                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                    Select Role *
                  </label>
                  <select
                    name="role_id"
                    value={assignmentForm.role_id}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-border-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Choose a role...</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name} ({role.permission_count} permissions)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expiration Date */}
                <div>
                  <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                    Expiration Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    name="expires_at"
                    value={assignmentForm.expires_at}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-border-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-subtext-light mt-1">
                    Leave empty for permanent role assignment
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={assignmentForm.notes}
                    onChange={handleFormChange}
                    rows="3"
                    placeholder="Add any notes about this role assignment..."
                    className="w-full px-3 py-2 border border-border-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseAssignModal}
                    className="px-4 py-2 border border-border-light rounded-md text-text-light hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600"
                  >
                    Assign Role
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Role Confirmation Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                  <span className="material-icons text-red-600">warning</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-light dark:text-text-dark">
                    Revoke Role
                  </h2>
                  <p className="text-sm text-subtext-light mt-1">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-text-light dark:text-text-dark">
                  Are you sure you want to revoke the role <strong>{roleToRevoke?.role_name}</strong> from{' '}
                  <strong>{selectedUser?.username}</strong>?
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCloseRevokeModal}
                  className="px-4 py-2 border border-border-light rounded-md text-text-light hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevokeRole}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Revoke Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagementPage;
