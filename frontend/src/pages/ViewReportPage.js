import React from 'react';
import { useParams, Link } from 'react-router-dom';

// Mock data for Dr. Anjali Rao's completed report
const mockReportData = {
  employeeId: '1',
  name: 'Dr. Anjali Rao',
  // ... (rest of the data is the same as before)
  title: 'Professor',
  department: 'Computer Science',
  reviewPeriod: 'Annual Review 2024',
  reviewer: 'Dr. Priya Mehta (Dean)',
  ratings: [
    { competency: 'Teaching Effectiveness', score: 5, max: 5 },
    { competency: 'Research Output & Publications', score: 5, max: 5 },
    { competency: 'Student Mentorship', score: 4, max: 5 },
    { competency: 'Departmental Contribution', score: 5, max: 5 },
  ],
  strengths: 'Dr. Rao has demonstrated exceptional leadership in the new AI curriculum development. Her student feedback is consistently outstanding, and her recent publication in the "Journal of Computer Science" is a significant achievement.',
  areasForImprovement: 'While her departmental contributions are excellent, we encourage Dr. Rao to seek more cross-departmental collaboration opportunities for the upcoming year.',
  finalComments: 'An exemplary faculty member and a true asset to the Computer Science department. Recommended for a performance bonus.'
};

const ViewReportPage = () => {
  const { employeeId } = useParams();

  // --- NEW LOGIC ---
  // Check if the ID from the URL matches our specific mock data ID
  if (employeeId !== mockReportData.employeeId) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Report Not Found</h1>
        <p className="mt-2 text-subtext-light">No report is available for employee ID: {employeeId}. This feature is under construction for other employees.</p>
        <Link to="/appraisal" className="text-primary hover:underline mt-6 inline-block">&larr; Back to Appraisals List</Link>
      </div>
    );
  }

  // If the ID matches, render the full report
  return (
    <div className="flex flex-col h-full">
      <header className="bg-card-light dark:bg-card-dark p-4 border-b border-border-light dark:border-border-dark flex-shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-text-light dark:text-text-dark">Appraisal Report</h1>
          <p className="text-sm text-subtext-light">{mockReportData.name} - {mockReportData.reviewPeriod}</p>
        </div>
        <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center hover:bg-blue-600">
          <span className="material-icons mr-2 text-base">print</span> Print Report
        </button>
      </header>

      <main className="flex-1 p-8 bg-background-light dark:bg-background-dark overflow-y-auto">
        <div className="max-w-4xl mx-auto bg-card-light dark:bg-card-dark p-8 rounded-lg shadow-md">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-text-light dark:text-text-dark">{mockReportData.reviewPeriod}</h2>
            <p className="text-subtext-light">For: <span className="font-semibold">{mockReportData.name} ({mockReportData.title})</span></p>
            <p className="text-sm text-subtext-light">Reviewer: {mockReportData.reviewer}</p>
          </div>
          <Section title="Performance Ratings">
            <div className="space-y-4">
              {mockReportData.ratings.map(rating => (
                <RatingRow key={rating.competency} competency={rating.competency} score={rating.score} max={rating.max} />
              ))}
            </div>
          </Section>
          <Section title="Key Strengths">
            <p className="text-sm text-subtext-light">{mockReportData.strengths}</p>
          </Section>
          <Section title="Areas for Improvement">
            <p className="text-sm text-subtext-light">{mockReportData.areasForImprovement}</p>
          </Section>
          <Section title="Reviewer's Final Comments">
            <p className="text-sm text-subtext-light font-medium">{mockReportData.finalComments}</p>
          </Section>
          <div className="text-center mt-10">
            <Link to="/appraisal" className="text-primary hover:underline">&larr; Back to Appraisals List</Link>
          </div>
        </div>
      </main>
    </div>
  );
};

const Section = ({ title, children }) => ( /* ... (same as before) ... */ <div className="mb-8"><h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-3 border-b border-border-light pb-2">{title}</h3>{children}</div>);
const RatingRow = ({ competency, score, max }) => ( /* ... (same as before) ... */ <div className="flex justify-between items-center"><p className="text-sm text-text-light dark:text-text-dark">{competency}</p><div className="flex items-center space-x-2">{Array.from({ length: max }).map((_, i) => (<span key={i} className={`material-icons text-lg ${i < score ? 'text-yellow-500' : 'text-gray-300'}`}>star</span>))}<span className="font-bold text-sm">({score}/{max})</span></div></div>);

export default ViewReportPage;