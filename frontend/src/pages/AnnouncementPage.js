import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button } from '../components/ui';
import { announcementService } from '../services/announcementService';
import { usePermission } from '../contexts/PermissionContext';

const AnnouncementPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', is_active: true });
  const { hasRole } = usePermission();
  
  const canManageAnnouncements = hasRole('HR Manager') || hasRole('Super Admin');

  // Fetch announcements on component mount
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await announcementService.getAll();
      setAnnouncements(data);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Failed to load announcements. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await announcementService.create(formData);
      setShowCreateModal(false);
      setFormData({ title: '', content: '', is_active: true });
      fetchAnnouncements(); // Refresh the list
    } catch (err) {
      console.error('Error creating announcement:', err);
      alert('Failed to create announcement. Please try again.');
    }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      is_active: announcement.is_active
    });
    setShowCreateModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await announcementService.update(editingAnnouncement.id, formData);
      setShowCreateModal(false);
      setEditingAnnouncement(null);
      setFormData({ title: '', content: '', is_active: true });
      fetchAnnouncements(); // Refresh the list
    } catch (err) {
      console.error('Error updating announcement:', err);
      alert('Failed to update announcement. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await announcementService.delete(id);
        fetchAnnouncements(); // Refresh the list
      } catch (err) {
        console.error('Error deleting announcement:', err);
        alert('Failed to delete announcement. Please try again.');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <PageHeader
        title="University Announcements"
        description="Stay updated with the latest news and announcements"
        icon="campaign"
        actions={
          canManageAnnouncements && (
            <Button
              variant="primary"
              size="md"
              icon="add"
              onClick={() => {
                setEditingAnnouncement(null);
                setFormData({ title: '', content: '', is_active: true });
                setShowCreateModal(true);
              }}
            >
              Create New
            </Button>
          )
        }
      />

      <div className="p-6">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-subtext-light dark:text-subtext-dark">Loading announcements...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card>
            <div className="text-center py-8 text-red-600 dark:text-red-400">
              <span className="material-icons text-6xl mb-4">error_outline</span>
              <p>{error}</p>
              <Button
                variant="primary"
                size="sm"
                onClick={fetchAnnouncements}
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          </Card>
        )}

        {/* Announcements List */}
        {!isLoading && !error && (
          <div className="space-y-4">
            {announcements.map(announcement => (
              <Card 
                key={announcement.id}
                className="border-l-4 border-primary"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-heading-light dark:text-heading-dark mb-1">
                      {announcement.title}
                    </h3>
                    <p className="text-sm text-subtext-light dark:text-subtext-dark">
                      Posted by {announcement.author_name || announcement.author_username}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-subtext-light dark:text-subtext-dark bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                    {formatDate(announcement.created_at)}
                  </span>
                </div>
                <p className="text-sm text-text-light dark:text-text-dark leading-relaxed">
                  {announcement.content}
                </p>
                {canManageAnnouncements && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border-light dark:border-border-dark">
                    <Button
                      variant="outline"
                      size="sm"
                      icon="edit"
                      onClick={() => handleEdit(announcement)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon="delete"
                      onClick={() => handleDelete(announcement.id)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </Card>
            ))}
            {announcements.length === 0 && (
              <Card>
                <div className="text-center py-8 text-subtext-light dark:text-subtext-dark">
                  <span className="material-icons text-6xl mb-4 opacity-50">campaign</span>
                  <p>No announcements available at this time.</p>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-heading-light dark:text-heading-dark">
                {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
              </h2>
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingAnnouncement(null);
                  setFormData({ title: '', content: '', is_active: true });
                }}
                className="text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark transition-colors"
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            
            <form onSubmit={editingAnnouncement ? handleUpdate : handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter announcement title"
                  className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                  Content *
                </label>
                <textarea
                  required
                  rows="6"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="Enter announcement content"
                  className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark"
                />
              </div>

              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-text-light dark:text-text-dark">Active (visible to all users)</span>
                </label>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingAnnouncement(null);
                    setFormData({ title: '', content: '', is_active: true });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                >
                  {editingAnnouncement ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementPage;