import React from 'react';

// This is a reusable component for displaying one announcement.
// It receives `title`, `date`, `author`, and `content` as props.
const AnnouncementCard = ({ title, date, author, content }) => {
  return (
    <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-md border-l-4 border-primary">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-text-light dark:text-text-dark">{title}</h3>
        <span className="text-xs font-medium text-subtext-light dark:text-subtext-dark">{date}</span>
      </div>
      <p className="text-sm text-subtext-light dark:text-subtext-dark mb-4">Posted by {author}</p>
      <p className="text-sm text-text-light dark:text-text-dark">
        {content}
      </p>
    </div>
  );
};

export default AnnouncementCard;