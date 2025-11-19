import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import AppraisalCard from '../components/performance/AppraisalCard';
import GoalsSection from '../components/performance/GoalsSection';
import AchievementsSection from '../components/performance/AchievementsSection';
import TrainingSection from '../components/performance/TrainingSection';

const MyPerformancePage = () => {
  const [performanceData, setPerformanceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPerformanceData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');
      const response = await axios.get('http://127.0.0.1:8000/api/performance/my-performance/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setPerformanceData(response.data);
    } catch (err) {
      console.error('Error fetching performance data:', err);
      setError('Failed to load performance information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  if (isLoading) {
    return (
      <main className="flex-1 bg-background-light dark:bg-background-dark">
        <PageHeader 
          title="My Performance" 
          description="Track your performance metrics, goals, and achievements"
          icon="trending_up"
        />
        <div className="px-4 md:px-10 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-subtext-light">Loading performance information...</p>
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
          title="My Performance" 
          description="Track your performance metrics, goals, and achievements"
          icon="trending_up"
        />
        <div className="px-4 md:px-10 py-8">
          <Card>
            <div className="text-center py-8">
              <span className="material-icons text-red-500 text-5xl mb-4">error_outline</span>
              <p className="text-text-light dark:text-text-dark mb-4">{error}</p>
              <button
                onClick={fetchPerformanceData}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label="Retry loading performance data"
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

  // Get the most recent appraisal
  const recentAppraisal = performanceData?.appraisals?.[0];

  return (
    <main className="flex-1 bg-background-light dark:bg-background-dark" role="main" aria-label="My Performance">
      <PageHeader 
        title="My Performance" 
        description="Track your performance metrics, goals, and achievements"
        icon="trending_up"
      />
      
      <div className="px-4 md:px-10 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Recent Appraisal Section */}
          {recentAppraisal ? (
            <section aria-labelledby="appraisal-heading">
              <h3 id="appraisal-heading" className="text-lg font-semibold text-heading-light dark:text-heading-dark mb-4">
                Recent Appraisal
              </h3>
              <AppraisalCard appraisal={recentAppraisal} />
            </section>
          ) : (
            <Card title="Recent Appraisal" icon="assessment">
              <div className="text-center py-12" role="status" aria-label="No appraisals available">
                <span className="material-icons text-subtext-light text-6xl mb-4" aria-hidden="true">assessment</span>
                <p className="text-text-light dark:text-text-dark font-medium mb-2">
                  No appraisals yet
                </p>
                <p className="text-sm text-subtext-light">
                  Your performance appraisals will appear here once completed.
                </p>
              </div>
            </Card>
          )}

          {/* Goals Section */}
          <GoalsSection goals={performanceData?.goals} />

          {/* Achievements Section */}
          <AchievementsSection achievements={performanceData?.achievements} />

          {/* Training Section */}
          <TrainingSection trainings={performanceData?.trainings} />
        </div>
      </div>
    </main>
  );
};

export default MyPerformancePage;
