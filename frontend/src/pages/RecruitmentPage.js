import React from 'react';
import { usePermission } from '../contexts/PermissionContext';
import { PageHeader, Card, Button } from '../components/ui';

// Mock data for candidates in the pipeline
const candidates = [
  { id: 1, name: 'Aarav Sharma', position: 'Asst. Professor, CS', status: 'Applied', appliedDate: '2025-10-20' },
  { id: 2, name: 'Sanya Verma', position: 'Lab Technician, Physics', status: 'Screening', appliedDate: '2025-10-18' },
  { id: 3, name: 'Rohan Mehta', position: 'Asst. Professor, CS', status: 'Interview', appliedDate: '2025-10-15' },
  { id: 4, name: 'Priya Singh', position: 'Junior Librarian', status: 'Offer Made', appliedDate: '2025-10-12' },
  { id: 5, name: 'Karan Malhotra', position: 'Asst. Professor, CS', status: 'Hired', appliedDate: '2025-10-10' },
  { id: 6, name: 'Isha Gupta', position: 'Admissions Counselor', status: 'Rejected', appliedDate: '2025-10-08' },
];

// Mock data for job opportunities (for employees)
const jobOpportunities = [
  { id: 1, title: 'Assistant Professor - Computer Science', department: 'CS', type: 'Full-time', posted: '2025-10-20', deadline: '2025-11-20' },
  { id: 2, title: 'Lab Technician - Physics', department: 'Physics', type: 'Full-time', posted: '2025-10-18', deadline: '2025-11-15' },
  { id: 3, title: 'Junior Librarian', department: 'Library', type: 'Full-time', posted: '2025-10-15', deadline: '2025-11-10' },
  { id: 4, title: 'Admissions Counselor', department: 'Admissions', type: 'Contract', posted: '2025-10-12', deadline: '2025-11-05' },
];

const RecruitmentPage = () => {
  const { hasRole } = usePermission();
  const isEmployee = hasRole('Employee');
  const isSuperAdmin = hasRole('Super Admin');
  const isHRManager = hasRole('HR Manager');
  
  // State for application modal
  const [showApplicationModal, setShowApplicationModal] = React.useState(false);
  const [selectedJob, setSelectedJob] = React.useState(null);
  const [applicationData, setApplicationData] = React.useState({
    coverLetter: '',
    resume: null,
  });
  
  const handleApplyClick = (job) => {
    setSelectedJob(job);
    setShowApplicationModal(true);
  };
  
  const handleSubmitApplication = (e) => {
    e.preventDefault();
    // Here you would normally send the application to the backend
    alert(`Application submitted for: ${selectedJob.title}\n\nCover Letter: ${applicationData.coverLetter}\n\nYour application has been received and will be reviewed by HR.`);
    setShowApplicationModal(false);
    setApplicationData({ coverLetter: '', resume: null });
    setSelectedJob(null);
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Applied': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">Applied</span>;
      case 'Screening': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">Screening</span>;
      case 'Interview': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200">Interview</span>;
      case 'Offer Made': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200">Offer Made</span>;
      case 'Hired': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200">Hired</span>;
      case 'Rejected': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200">Rejected</span>;
      default: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">{status}</span>;
    }
  };

  // Employee view: Show job opportunities
  if (isEmployee) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <PageHeader
          title="Job Opportunities"
          description="Browse and apply for internal job postings."
          icon="work"
        />

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon="work" title="Open Positions" value="4" />
            <StatCard icon="send" title="My Applications" value="0" />
            <StatCard icon="schedule" title="Application Deadline" value="Soon" />
            <StatCard icon="trending_up" title="Career Growth" value="High" />
          </div>
          
          <Card
            title="Available Positions"
            icon="list_alt"
            noPadding
            actions={
              <div className="relative">
                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-subtext-light dark:text-subtext-dark text-sm">search</span>
                <input 
                  type="text" 
                  placeholder="Search jobs..." 
                  className="pl-10 pr-4 py-2 rounded-lg bg-background-light dark:bg-gray-800 border border-border-light dark:border-border-dark text-text-light dark:text-text-dark text-sm focus:ring-2 focus:ring-primary focus:outline-none" 
                />
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-subtext-light dark:text-subtext-dark uppercase bg-background-light dark:bg-background-dark">
                  <tr>
                    <th className="px-6 py-3">Job Title</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Posted Date</th>
                    <th className="px-6 py-3">Deadline</th>
                    <th className="px-6 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {jobOpportunities.map((job) => (
                    <tr key={job.id} className="border-b border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800/50 text-text-light dark:text-text-dark">
                      <td className="px-6 py-4 font-medium">{job.title}</td>
                      <td className="px-6 py-4">{job.department}</td>
                      <td className="px-6 py-4">{job.type}</td>
                      <td className="px-6 py-4">{job.posted}</td>
                      <td className="px-6 py-4">{job.deadline}</td>
                      <td className="px-6 py-4 text-center">
                        <Button 
                          variant="primary"
                          size="sm"
                          onClick={() => handleApplyClick(job)}
                        >
                          Apply Now
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        
        {/* Application Modal */}
        {showApplicationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-heading-light dark:text-heading-dark">Apply for Position</h2>
                <button 
                  onClick={() => setShowApplicationModal(false)}
                  className="text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark transition-colors"
                >
                  <span className="material-icons">close</span>
                </button>
              </div>
              
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-lg text-heading-light dark:text-heading-dark">{selectedJob.title}</h3>
                <p className="text-sm text-subtext-light dark:text-subtext-dark">Department: {selectedJob.department} | Type: {selectedJob.type}</p>
                <p className="text-sm text-subtext-light dark:text-subtext-dark">Deadline: {selectedJob.deadline}</p>
              </div>
              
              <form onSubmit={handleSubmitApplication}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                    Cover Letter *
                  </label>
                  <textarea
                    required
                    rows="6"
                    value={applicationData.coverLetter}
                    onChange={(e) => setApplicationData({...applicationData, coverLetter: e.target.value})}
                    placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                    className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                    Resume/CV (Optional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setApplicationData({...applicationData, resume: e.target.files[0]})}
                    className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark"
                  />
                  <p className="text-xs text-subtext-light dark:text-subtext-dark mt-1">Accepted formats: PDF, DOC, DOCX (Max 5MB)</p>
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowApplicationModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                  >
                    Submit Application
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // HR Manager & Super Admin view: Show recruitment pipeline
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <PageHeader
        title="Recruitment Overview"
        description="Manage all active candidate pipelines."
        icon="people"
        actions={
          <Button
            to="/post-vacancy"
            variant="primary"
            icon="post_add"
          >
            Post New Vacancy
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon="folder_open" title="Total Active Candidates" value="34" />
          <StatCard icon="event" title="Interviews This Week" value="5" />
          <StatCard icon="pending" title="New Applicants" value="12" />
          <StatCard icon="person_add" title="Hired This Month" value="2" />
        </div>
        
        <Card
          title="All Candidates"
          icon="group"
          noPadding
          actions={
            <div className="relative">
              <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-subtext-light dark:text-subtext-dark text-sm">search</span>
              <input 
                type="text" 
                placeholder="Search by name..." 
                className="pl-10 pr-4 py-2 rounded-lg bg-background-light dark:bg-gray-800 border border-border-light dark:border-border-dark text-text-light dark:text-text-dark text-sm focus:ring-2 focus:ring-primary focus:outline-none" 
              />
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-subtext-light dark:text-subtext-dark uppercase bg-background-light dark:bg-background-dark">
                <tr>
                  <th className="px-6 py-3">Candidate Name</th>
                  <th className="px-6 py-3">Applied For</th>
                  <th className="px-6 py-3">Application Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => (
                  <tr key={candidate.id} className="border-b border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800/50 text-text-light dark:text-text-dark">
                    <td className="px-6 py-4 font-medium">{candidate.name}</td>
                    <td className="px-6 py-4">{candidate.position}</td>
                    <td className="px-6 py-4">{candidate.appliedDate}</td>
                    <td className="px-6 py-4">{getStatusBadge(candidate.status)}</td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-primary hover:underline text-sm font-medium transition-colors">
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value }) => (
  <div className="bg-card-light dark:bg-card-dark p-5 rounded-xl shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow">
    <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-full">
      <span className="material-icons text-primary text-2xl">{icon}</span>
    </div>
    <div>
      <p className="text-sm font-medium text-subtext-light dark:text-subtext-dark">{title}</p>
      <p className="text-2xl font-bold text-heading-light dark:text-heading-dark">{value}</p>
    </div>
  </div>
);

export default RecruitmentPage;