import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RunPayrollPage = () => {
  const navigate = useNavigate();
  // State to manage the current step of the payroll wizard
  const [currentStep, setCurrentStep] = useState(1);

  // Mock data for the payroll run
  const payrollSummary = {
    period: 'October 2025',
    totalEmployees: 132,
    totalPayable: '₹85,40,000',
    attendanceDiscrepancies: 3,
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">Run Payroll for {payrollSummary.period}</h1>
          <p className="text-sm text-subtext-light">Follow the steps below to process and finalize salary payments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Column: Step Checklist */}
        <div className="lg:col-span-1">
          <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-md">
            <ul className="space-y-4">
              <Step title="Confirm Period" stepNumber={1} currentStep={currentStep} />
              <Step title="Verify Attendance" stepNumber={2} currentStep={currentStep} />
              <Step title="Review Payroll" stepNumber={3} currentStep={currentStep} />
              <Step title="Finalize & Pay" stepNumber={4} currentStep={currentStep} />
            </ul>
          </div>
        </div>

        {/* Right Column: Content for the current step */}
        <div className="lg:col-span-3">
          <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-md">
            {/* Step 1 Content */}
            
            {currentStep === 1 && (
            <StepContent title="Step 1: Confirm Payroll Period">
                <p className="text-subtext-light mb-4">
                You are about to run payroll for the selected employees.
                </p>
                <div className="p-4 bg-background-light rounded-lg space-y-2">
                <InfoRow label="Payroll For" value={payrollSummary.period} />
                {/* In a real app, this number would be dynamic */}
                <InfoRow label="Number of Employees Selected" value="[# of selected]" />
                </div>
                <div className="text-right mt-6">
                <button onClick={() => setCurrentStep(2)} className="bg-primary text-white px-4 py-2 rounded-lg">Confirm & Proceed</button>
                </div>
            </StepContent>
            )}  

            {/* Step 2 Content */}
            {currentStep === 2 && (
              <StepContent title="Step 2: Verify Attendance & Time Tracking">
                <p className="text-subtext-light mb-4">
                  Payroll calculations are based on attendance. Please resolve any discrepancies from the Time Tracker.
                </p>
                <div className={`p-4 rounded-lg ${payrollSummary.attendanceDiscrepancies > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                  <p className="font-semibold">
                    {payrollSummary.attendanceDiscrepancies} attendance discrepancies found.
                  </p>
                  <p className="text-sm">These must be resolved in the <a href="/time-tracker" className="underline font-medium">Time Tracker</a> before proceeding.</p>
                </div>
                <div className="flex justify-between mt-6">
                  <button onClick={() => setCurrentStep(1)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg">Back</button>
                  <button 
                    onClick={() => setCurrentStep(3)}
                    disabled={payrollSummary.attendanceDiscrepancies > 0}
                    className="bg-primary text-white px-4 py-2 rounded-lg disabled:bg-gray-400"
                  >
                    Proceed to Review
                  </button>
                </div>
              </StepContent>
            )}

            {/* Add Steps 3 and 4 here as you build them out */}
            {currentStep >= 3 && (
               <StepContent title="Step 3 & 4">
                 <p className="text-subtext-light">Review and Finalization steps are under construction.</p>
                 <div className="flex justify-between mt-6">
                   <button onClick={() => setCurrentStep(2)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg">Back</button>
                 </div>
               </StepContent>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- HELPER COMPONENTS for the Wizard ---
const Step = ({ title, stepNumber, currentStep }) => {
    const isCompleted = currentStep > stepNumber;
    const isActive = currentStep === stepNumber;
    return (
        <li className="flex items-center space-x-3">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isCompleted ? 'bg-green-500' : isActive ? 'bg-primary' : 'bg-gray-300'}`}>
                <span className="material-icons text-white text-base">{isCompleted ? 'check' : stepNumber}</span>
            </div>
            <span className={`font-medium ${isActive ? 'text-primary' : 'text-text-light'}`}>{title}</span>
        </li>
    );
};

const StepContent = ({ title, children }) => (
    <div>
        <h2 className="text-xl font-bold text-text-light dark:text-text-dark mb-2">{title}</h2>
        {children}
    </div>
);

const InfoRow = ({ label, value }) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-subtext-light">{label}:</span>
        <span className="font-semibold text-text-light dark:text-text-dark">{value}</span>
    </div>
);


export default RunPayrollPage;