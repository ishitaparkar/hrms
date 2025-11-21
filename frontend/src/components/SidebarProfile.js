import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SidebarProfile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- HELPER: Fix Image URLs ---
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    let url = imagePath;
    if (!imagePath.startsWith('http')) {
        url = `http://localhost:8000${imagePath}`;
    }
    return `${url}?t=${new Date().getTime()}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const authResponse = await fetch('http://localhost:8000/api/auth/me/', {
          headers: { 'Authorization': `Token ${token}` }
        });
        
        if (authResponse.ok) {
          const authData = await authResponse.json();
          let finalData = {
            name: authData.username,
            role: authData.role || 'User',
            image: null
          };

          if (authData.employee_id) {
            const empResponse = await fetch(`http://localhost:8000/api/employees/${authData.employee_id}/`, {
              headers: { 'Authorization': `Token ${token}` }
            });
            
            if (empResponse.ok) {
              const empData = await empResponse.json();
              finalData.name = `${empData.firstName} ${empData.lastName}`;
              finalData.image = getImageUrl(empData.profile_picture);
              finalData.role = empData.designation || finalData.role;
            }
          }
          setUserData(finalData);
        }
      } catch (error) {
        console.error("Sidebar Profile Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading || !userData) return null;

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=3b82f6&color=fff&size=64`;

  return (
    <button 
      onClick={() => navigate('/profile')}
      className="flex items-center w-full gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group mb-1"
    >
      {/* Avatar Image */}
      <div className="relative flex-shrink-0">
          <img 
              src={userData.image || defaultAvatar} 
              alt="Profile" 
              className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-600"
              onError={(e) => { e.target.src = defaultAvatar; }} 
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
      </div>

      {/* Text Info */}
      <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-light dark:text-text-dark truncate leading-tight">
              {userData.name}
          </p>
          <p className="text-xs text-subtext-light dark:text-subtext-dark truncate mt-0.5">
              {userData.role}
          </p>
      </div>

      {/* Arrow Icon */}
      <span className="material-icons text-gray-400 text-lg group-hover:text-primary">
          chevron_right
      </span>
    </button>
  );
};

export default SidebarProfile;