import React, { useState } from 'react';
import { PageHeader, Card, Button } from '../components/ui';

// Mock data for announcements
const initialAnnouncements = [
  { 
    id: 1, 
    title: 'Diwali Celebration & Holidays', 
    date: '2025-10-20',
    author: 'Administration Office',
    content: 'The university will be closed from October 29th to November 2nd for Diwali celebrations. We wish everyone a happy and prosperous festival of lights.' 
  },
  { 
    id: 2, 
    title: 'Library Hours Extended for Exams', 
    date: '2025-10-18',
    author: 'Library Services',
    content: 'To support students during the upcoming mid-term examinations, the central library will be open 24/7 from October 25th until November 15th.' 
  },
  { 
    id: 3, 
    title: 'Annual Sports Fest "Spardha 2025"', 
    date: '2025-10-15',
    author: 'Student Council',
    content: 'Get ready for the annual sports festival, Spardha! Registrations for all events are now open at the Student Council office. The event will kick off on November 20th.' 
  },
];

const AnnouncementPage = () => {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <PageHeader
        title="University Announcements"
        description="Stay updated with the latest news and announcements"
        icon="campaign"
        actions={
          <Button
            variant="primary"
            size="md"
            icon="add"
            onClick={() => console.log('Create New Announcement')}
          >
            Create New
          </Button>
        }
      />

      <div className="p-6">
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
                    Posted by {announcement.author}
                  </p>
                </div>
                <span className="text-xs font-medium text-subtext-light dark:text-subtext-dark bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                  {announcement.date}
                </span>
              </div>
              <p className="text-sm text-text-light dark:text-text-dark leading-relaxed">
                {announcement.content}
              </p>
              <div className="flex gap-2 mt-4 pt-4 border-t border-border-light dark:border-border-dark">
                <Button
                  variant="outline"
                  size="sm"
                  icon="edit"
                  onClick={() => console.log('Edit announcement', announcement.id)}
                >
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon="delete"
                  onClick={() => console.log('Delete announcement', announcement.id)}
                >
                  Delete
                </Button>
              </div>
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
      </div>
    </div>
  );
};

export default AnnouncementPage;