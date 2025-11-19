import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Reusable form components
const FormInput = ({ label, name, value, onChange, placeholder, required }) => (
  <div>
    <label className="block text-sm font-medium text-subtext-light dark:text-subtext-dark mb-1">
      {label}
    </label>
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="mt-1 block w-full p-2 border border-border-light dark:border-border-dark rounded-md bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary"
    />
  </div>
);

const FormSelect = ({ label, name, value, onChange, required, children }) => (
  <div>
    <label className="block text-sm font-medium text-subtext-light dark:text-subtext-dark mb-1">
      {label}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="mt-1 block w-full p-2 border border-border-light dark:border-border-dark rounded-md bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {children}
    </select>
  </div>
);

const FormTextarea = ({ label, name, value, onChange, rows, placeholder, required }) => (
  <div>
    <label className="block text-sm font-medium text-subtext-light dark:text-subtext-dark mb-1">
      {label}
    </label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      required={required}
      className="mt-1 block w-full p-2 border border-border-light dark:border-border-dark rounded-md bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary"
    />
  </div>
);

const RadioInput = ({ name, value, checked, onChange, label }) => (
  <label className="inline-flex items-center">
    <input
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      className="form-radio text-primary"
    />
    <span className="ml-2 text-text-light dark:text-text-dark">{label}</span>
  </label>
);

// Main Component
const PostVacancyPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    jobTitle: '',
    department: '',
    jobType: 'Full-time',
    description: '',
    requirements: '',
    jobDescriptionFile: null,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prevState) => ({
        ...prevState,
        jobDescriptionFile: e.target.files[0],
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting new vacancy:", formData);
    alert('New vacancy has been posted successfully! (Simulation)');
    navigate('/recruitment');
  };

  return (
    <div className="flex flex-col h-full">
      <header className="bg-card-light dark:bg-card-dark p-4 border-b border-border-light dark:border-border-dark flex-shrink-0">
        <h1 className="text-2xl font-semibold text-text-light dark:text-text-dark">
          Post a New Vacancy
        </h1>
      </header>

      <main className="flex-1 p-8 bg-background-light dark:bg-background-dark">
        <div className="max-w-3xl mx-auto bg-card-light dark:bg-card-dark p-8 rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Job Title / Position"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                placeholder="e.g., Assistant Professor"
                required
              />
              <FormSelect
                label="Department / Faculty"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
              >
                <option value="">-- Select Department --</option>
                <option>Faculty of Engineering</option>
                <option>Faculty of Arts & Commerce</option>
                <option>Administration</option>
                <option>Library</option>
              </FormSelect>
            </div>

            <div>
              <p className="block text-sm font-medium text-subtext-light dark:text-subtext-dark">
                Job Type
              </p>
              <div className="mt-2 flex space-x-4">
                <RadioInput
                  name="jobType"
                  value="Full-time"
                  checked={formData.jobType === 'Full-time'}
                  onChange={handleChange}
                  label="Full-time"
                />
                <RadioInput
                  name="jobType"
                  value="Part-time"
                  checked={formData.jobType === 'Part-time'}
                  onChange={handleChange}
                  label="Part-time"
                />
                <RadioInput
                  name="jobType"
                  value="Contract"
                  checked={formData.jobType === 'Contract'}
                  onChange={handleChange}
                  label="Contract"
                />
              </div>
            </div>

            <FormTextarea
              label="Job Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="5"
              placeholder="Describe the role, responsibilities, etc."
              required
            />

            <FormTextarea
              label="Requirements / Qualifications"
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              rows="3"
              placeholder="List necessary skills, degrees, experience, etc."
              required
            />

            <div>
              <label className="block text-sm font-medium text-subtext-light dark:text-subtext-dark mb-1">
                Attach Job Description (Optional)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border-light dark:border-border-dark border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <span className="material-icons text-4xl text-subtext-light mx-auto">
                    description
                  </span>
                  <div className="flex text-sm text-subtext-light">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-card-light rounded-md font-medium text-primary hover:text-blue-600 focus-within:outline-none"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="jobDescriptionFile"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-subtext-light">PDF, DOC, DOCX up to 5MB</p>
                  {formData.jobDescriptionFile && (
                    <p className="text-sm font-medium text-green-600 pt-2">
                      File selected: {formData.jobDescriptionFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 border-t border-border-light dark:border-border-dark pt-6">
              <button
                type="button"
                onClick={() => navigate('/recruitment')}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark"
              >
                Post Vacancy
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default PostVacancyPage;