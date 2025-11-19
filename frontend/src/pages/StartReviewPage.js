import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

// Mock data for the employee being reviewed
const mockEmployeeData = {
  employeeId: '2',
  name: 'Prof. Vikram Kumar',
  title: 'Associate Professor',
  department: 'Mathematics',
};

const StartReviewPage = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  
  const [reviewData, setReviewData] = useState({ strengths: '', improvements: '', comments: '' });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setReviewData(prevState => ({ ...prevState, [name]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting review for Employee ID:", employeeId, reviewData);
    alert('Review has been submitted! (Simulation)');
    navigate('/appraisal');
  };

  // --- NEW LOGIC ---
  // Check if the ID from the URL matches our specific mock data ID
  if (employeeId !== mockEmployeeData.employeeId) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Cannot Start Review</h1>
        <p className="mt-2 text-subtext-light">No review is available to start for employee ID: {employeeId}. This feature is under construction for other employees.</p>
        <Link to="/appraisal" className="text-primary hover:underline mt-6 inline-block">&larr; Back to Appraisals List</Link>
      </div>
    );
  }
  
  // If the ID matches, render the full form
  return (
    <div className="flex flex-col h-full">
      <header className="bg-card-light dark:bg-card-dark p-4 border-b border-border-light dark:border-border-dark flex-shrink-0">
        <h1 className="text-2xl font-semibold text-text-light dark:text-text-dark">Conduct Performance Review</h1>
      </header>
      <main className="flex-1 p-8 bg-background-light dark:bg-background-dark overflow-y-auto">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-card-light dark:bg-card-dark p-8 rounded-lg shadow-md">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-text-light dark:text-text-dark">Annual Review 2025</h2>
            <p className="text-subtext-light">For: <span className="font-semibold">{mockEmployeeData.name} ({mockEmployeeData.title})</span></p>
          </div>
          <div className="mb-6">
            <label htmlFor="strengths" className="block text-lg font-semibold text-text-light dark:text-text-dark mb-2">Key Strengths</label>
            <textarea id="strengths" name="strengths" rows="4" value={reviewData.strengths} onChange={handleChange} className="w-full bg-background-light dark:bg-gray-800 border-border-light dark:border-border-dark rounded-md shadow-sm" placeholder="Enter comments on the employee's key strengths..."></textarea>
          </div>
          <div className="mb-6">
            <label htmlFor="improvements" className="block text-lg font-semibold text-text-light dark:text-text-dark mb-2">Areas for Improvement</label>
            <textarea id="improvements" name="improvements" rows="4" value={reviewData.improvements} onChange={handleChange} className="w-full bg-background-light dark:bg-gray-800 border-border-light dark:border-border-dark rounded-md shadow-sm" placeholder="Enter comments on areas where the employee can improve..."></textarea>
          </div>
          <div className="mb-8">
            <label htmlFor="comments" className="block text-lg font-semibold text-text-light dark:text-text-dark mb-2">Final Comments</label>
            <textarea id="comments" name="comments" rows="3" value={reviewData.comments} onChange={handleChange} className="w-full bg-background-light dark:bg-gray-800 border-border-light dark:border-border-dark rounded-md shadow-sm" placeholder="Enter any final summary or comments..."></textarea>
          </div>
          <div className="flex justify-end gap-4 border-t border-border-light pt-6">
            <Link to="/appraisal" className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">Cancel</Link>
            <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-600">Submit Final Review</button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default StartReviewPage;