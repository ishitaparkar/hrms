import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import InfoRow from '../components/ui/InfoRow';

const MyTeamPage = () => {
  const [teamData, setTeamData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTeamData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');
      const response = await axios.get('http://127.0.0.1:8000/api/employees/my-team/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setTeamData(response.data);
    } catch (err) {
      console.error('Error fetching team data:', err);
      setError('Failed to load team information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  if (isLoading) {
    return (
      <main className="flex-1 bg-background-light dark:bg-background-dark">
        <PageHeader 
          title="My Team" 
          description="View your team members and manager information"
          icon="groups"
        />
        <div className="px-4 md:px-10 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-subtext-light">Loading team information...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 bg-background-light dark:bg-background-dark">
        <PageHeader 
          title="My Team" 
          description="View your team members and manager information"
          icon="groups"
        />
        <div className="px-4 md:px-10 py-8">
          <Card>
            <div className="text-center py-8">
              <span className="material-icons text-red-500 text-5xl mb-4">error_outline</span>
              <p className="text-text-light dark:text-text-dark mb-4">{error}</p>
              <button
                onClick={fetchTeamData}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label="Retry loading team data"
              >
                <span className="material-icons" aria-hidden="true">refresh</span>
                Retry
              </button>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-background-light dark:bg-background-dark" role="main" aria-label="My Team">
      <PageHeader 
        title="My Team" 
        description="View your team members and manager information"
        icon="groups"
      />
      
      <div className="px-4 sm:px-6 md:px-10 py-6 md:py-8">
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
          {/* Department Info */}
          {teamData?.department && (
            <Card>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl font-semibold text-heading-light dark:text-heading-dark">
                    {teamData.department}
                  </h2>
                  <p className="text-sm text-subtext-light mt-1">
                    {teamData.teamMembers?.length || 0} team member{teamData.teamMembers?.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-icons text-primary text-2xl sm:text-3xl">business</span>
                </div>
              </div>
            </Card>
          )}

          {/* Manager Section */}
          {teamData?.manager ? (
            <section aria-labelledby="manager-heading">
              <h3 id="manager-heading" className="text-lg font-semibold text-heading-light dark:text-heading-dark mb-4">
                Reporting Manager
              </h3>
              <ManagerCard manager={teamData.manager} />
            </section>
          ) : null}

          {/* Team Members Section */}
          <section aria-labelledby="team-members-heading">
            <h3 id="team-members-heading" className="text-lg font-semibold text-heading-light dark:text-heading-dark mb-4">
              Team Members
            </h3>
            {teamData?.teamMembers && teamData.teamMembers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="Team members list">
                {teamData.teamMembers.map((member) => (
                  <TeamMemberCard key={member.id} member={member} />
                ))}
              </div>
            ) : (
              <Card>
                <div className="text-center py-12" role="status" aria-label="No team members">
                  <span className="material-icons text-subtext-light text-6xl mb-4" aria-hidden="true">group_off</span>
                  <p className="text-text-light dark:text-text-dark font-medium mb-2">
                    No team members found
                  </p>
                  <p className="text-sm text-subtext-light">
                    There are currently no other team members in your department.
                  </p>
                </div>
              </Card>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

// Manager Card Component
const ManagerCard = ({ manager }) => {
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <Card className="border-l-4 border-primary">
      <div className="flex flex-col sm:flex-row items-start gap-4">
        {/* Profile Image or Initials */}
        <div className="flex-shrink-0 mx-auto sm:mx-0">
          {manager.profileImage ? (
            <img 
              src={manager.profileImage} 
              alt={`${manager.firstName} ${manager.lastName}`}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xl sm:text-2xl font-bold text-primary">
                {getInitials(manager.firstName, manager.lastName)}
              </span>
            </div>
          )}
        </div>

        {/* Manager Details */}
        <div className="flex-1 w-full space-y-3 sm:space-y-4">
          <div className="text-center sm:text-left">
            <h4 className="text-lg sm:text-xl font-semibold text-heading-light dark:text-heading-dark">
              {manager.firstName} {manager.lastName}
            </h4>
            <p className="text-sm text-primary font-medium mt-1">
              {manager.designation}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <InfoRow 
              icon="email" 
              label="Email" 
              value={manager.email || 'Not available'}
            />
            <InfoRow 
              icon="phone" 
              label="Phone" 
              value={manager.phone || 'Not available'}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

// Team Member Card Component
const TeamMemberCard = ({ member }) => {
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <Card hover className="h-full" role="listitem">
      <article aria-label={`Team member: ${member.firstName} ${member.lastName}`}>
      <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
        {/* Profile Image or Initials */}
        {member.profileImage ? (
          <img 
            src={member.profileImage} 
            alt={`${member.firstName} ${member.lastName}`}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <span className="text-xl sm:text-2xl font-bold text-white">
              {getInitials(member.firstName, member.lastName)}
            </span>
          </div>
        )}

        {/* Member Details */}
        <div className="flex-1 w-full">
          <h4 className="text-base sm:text-lg font-semibold text-heading-light dark:text-heading-dark break-words">
            {member.firstName} {member.lastName}
          </h4>
          <p className="text-xs sm:text-sm text-primary font-medium mt-1">
            {member.designation}
          </p>
        </div>

        {/* Contact Info */}
        <div className="w-full space-y-2 sm:space-y-3 pt-3 sm:pt-4 border-t border-border-light dark:border-border-dark">
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm">
            <span className="material-icons text-primary text-base sm:text-lg flex-shrink-0" aria-hidden="true">email</span>
            <span className="text-text-light dark:text-text-dark truncate" aria-label={`Email: ${member.email || 'Not available'}`}>
              {member.email || 'Not available'}
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm">
            <span className="material-icons text-primary text-base sm:text-lg flex-shrink-0" aria-hidden="true">phone</span>
            <span className="text-text-light dark:text-text-dark" aria-label={`Phone: ${member.phone || 'Not available'}`}>
              {member.phone || 'Not available'}
            </span>
          </div>
        </div>
      </div>
      </article>
    </Card>
  );
};

export default MyTeamPage;
