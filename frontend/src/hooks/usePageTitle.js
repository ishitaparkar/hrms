import { useEffect } from 'react';

/**
 * Custom hook to set the page title for accessibility
 * @param {string} title - The page title to set
 */
const usePageTitle = (title) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} - University HRMS` : 'University HRMS';
    
    // Cleanup: restore previous title when component unmounts
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};

export default usePageTitle;
