import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark">
      {/* Skip to main content link for keyboard navigation */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>
      
      <Sidebar role="navigation" aria-label="Main navigation" />
      
      <main id="main-content" role="main" className="flex-1 overflow-y-auto">
        <Outlet /> {/* The page content (e.g., DashboardPage) will be rendered here */}
      </main>
    </div>
  );
};

export default Layout;