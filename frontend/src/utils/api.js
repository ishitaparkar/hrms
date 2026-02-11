/**
 * Centralized API configuration
 * All API calls should use these utilities to ensure consistent URL handling
 */

// Get the base API URL from environment variable or use default
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

/**
 * Build a full API URL from a relative path
 * @param {string} path - The API endpoint path (e.g., '/auth/me/', '/employees/')
 * @returns {string} - The full API URL
 */
export const getApiUrl = (path) => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  // Remove trailing slash from base URL if present
  const cleanBase = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return `${cleanBase}/${cleanPath}`;
};

/**
 * Get the media URL for uploaded files (images, documents, etc.)
 * @param {string} path - The media file path from the backend
 * @returns {string} - The full media URL
 */
export const getMediaUrl = (path) => {
  if (!path) return '';
  
  // If it's already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Extract base URL without /api suffix
  const baseUrl = API_BASE_URL.replace('/api', '');
  
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${cleanPath}`;
};

export default {
  API_BASE_URL,
  getApiUrl,
  getMediaUrl
};
