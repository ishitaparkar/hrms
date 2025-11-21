import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// --- NEW: Inject Font Dynamically ---
const link = document.createElement('link');
link.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200";
link.rel = "stylesheet";
document.head.appendChild(link);
// ------------------------------------

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);