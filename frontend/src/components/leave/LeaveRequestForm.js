import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../ui/Button';

/**
 * LeaveRequestForm Component
 * 
 * Modal form for submitting a new leave request
 * 
 * @param {boolean} isOpen - Whether the modal is open
 * @param {Function} onClose - Callback to close the modal
 * @param {Function} onSubmit - Callback to handle form submission
 * @param {Array} leaveTypes - Available leave types
 */
const LeaveRequestForm = ({ isOpen, onClose, onSubmit, leaveTypes = [] }) => {
  const [formData, setFormData] = useState({
    leaveType: leaveTypes[0] || 'Casual Leave',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const modalRef = React.useRef(null);
  const previousFocusRef = React.useRef(null);

  // Focus management
  React.useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      // Focus the first input when modal opens
      setTimeout(() => {
        const firstInput = modalRef.current?.querySelector('select, input, textarea');
        firstInput?.focus();
      }, 100);
    } else if (previousFocusRef.current) {
      // Restore focus when modal closes
      previousFocusRef.current.focus();
    }
  }, [isOpen]);

  // Handle Escape key
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isSubmitting]);

  // Focus trap - keep focus within modal
  React.useEffect(() => {
    if (!isOpen) return;

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      
      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.startDate || !formData.endDate) {
      setError('Please select both start and end dates');
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    
    if (end < start) {
      setError('End date cannot be before start date');
      return;
    }

    if (!formData.reason.trim()) {
      setError('Please provide a reason for your leave');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        days: calculateDays()
      });
      
      // Reset form
      setFormData({
        leaveType: leaveTypes[0] || 'Casual Leave',
        startDate: '',
        endDate: '',
        reason: '',
      });
      setError('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        leaveType: leaveTypes[0] || 'Casual Leave',
        startDate: '',
        endDate: '',
        reason: '',
      });
      setError('');
      onClose();
    }
  };

  const days = calculateDays();

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-request-title"
    >
      <div 
        ref={modalRef}
        className="bg-card-light dark:bg-card-dark rounded-lg sm:rounded-xl shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border-light dark:border-border-dark">
          <h2 
            id="leave-request-title"
            className="text-lg sm:text-2xl font-bold text-heading-light dark:text-heading-dark flex items-center gap-2"
          >
            <span className="material-icons text-primary text-xl sm:text-2xl">event_busy</span>
            Request Leave
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-subtext-light hover:text-text-light dark:text-subtext-dark dark:hover:text-text-dark transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-2">
              <span className="material-icons text-red-600 dark:text-red-400 text-sm">error</span>
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Leave Type */}
          <div>
            <label 
              htmlFor="leaveType" 
              className="block text-sm font-medium text-text-light dark:text-text-dark mb-2"
            >
              Leave Type <span className="text-red-500">*</span>
            </label>
            <select
              id="leaveType"
              name="leaveType"
              value={formData.leaveType}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              {leaveTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label 
                htmlFor="startDate" 
                className="block text-sm font-medium text-text-light dark:text-text-dark mb-2"
              >
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
            <div>
              <label 
                htmlFor="endDate" 
                className="block text-sm font-medium text-text-light dark:text-text-dark mb-2"
              >
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                min={formData.startDate || new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
          </div>

          {/* Days Calculation */}
          {days > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                <span className="material-icons text-sm">info</span>
                Total days: <strong>{days} day{days !== 1 ? 's' : ''}</strong>
              </p>
            </div>
          )}

          {/* Reason */}
          <div>
            <label 
              htmlFor="reason" 
              className="block text-sm font-medium text-text-light dark:text-text-dark mb-2"
            >
              Reason for Leave <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              rows="4"
              placeholder="Please provide a brief explanation for your leave request..."
              className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-border-light dark:border-border-dark">
            <Button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              variant="primary"
              icon={isSubmitting ? null : "send"}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin material-icons text-sm mr-2">refresh</span>
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

LeaveRequestForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  leaveTypes: PropTypes.arrayOf(PropTypes.string),
};

export default LeaveRequestForm;
