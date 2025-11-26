import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

/**
 * Get authentication headers with token
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    }
  };
};

/**
 * Announcement Service
 * Handles all API calls related to announcements
 */
export const announcementService = {
  /**
   * Get all announcements
   * @param {string} search - Optional search query
   * @returns {Promise} Array of announcements
   */
  getAll: async (search = '') => {
    try {
      const url = search 
        ? `${API_BASE_URL}/announcements/?search=${encodeURIComponent(search)}`
        : `${API_BASE_URL}/announcements/`;
      const response = await axios.get(url, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error fetching announcements:', error);
      throw error;
    }
  },

  /**
   * Get a single announcement by ID
   * @param {number} id - Announcement ID
   * @returns {Promise} Announcement object
   */
  getById: async (id) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/announcements/${id}/`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching announcement ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new announcement
   * @param {Object} data - Announcement data {title, content, is_active}
   * @returns {Promise} Created announcement object
   */
  create: async (data) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/announcements/`,
        data,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  },

  /**
   * Update an existing announcement
   * @param {number} id - Announcement ID
   * @param {Object} data - Updated announcement data
   * @returns {Promise} Updated announcement object
   */
  update: async (id, data) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/announcements/${id}/`,
        data,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating announcement ${id}:`, error);
      throw error;
    }
  },

  /**
   * Partially update an announcement
   * @param {number} id - Announcement ID
   * @param {Object} data - Partial announcement data
   * @returns {Promise} Updated announcement object
   */
  partialUpdate: async (id, data) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/announcements/${id}/`,
        data,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error partially updating announcement ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete an announcement
   * @param {number} id - Announcement ID
   * @returns {Promise}
   */
  delete: async (id) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/announcements/${id}/`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error deleting announcement ${id}:`, error);
      throw error;
    }
  },
};

export default announcementService;
