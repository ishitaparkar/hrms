import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const EditEmployeePage = () => {
  const navigate = useNavigate();
  const { employeeId } = useParams(); // Get the employee ID from the URL

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    personalEmail: '',
    mobileNumber: '',
    employeeId: '',
    joiningDate: '',
    department: '',
    designation: '',
  });

  // 1. Fetch the existing employee data when the page loads
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/employees/${employeeId}/`);
        // The joiningDate field needs to be in YYYY-MM-DD format for the date input
        const data = { ...response.data, joiningDate: response.data.joiningDate.split('T')[0] };
        setFormData(data); // Pre-fill the form with the fetched data
      } catch (error) {
        console.error('Error fetching employee data:', error);
        alert('Could not fetch employee data.');
      }
    };
    fetchEmployee();
  }, [employeeId]); // This effect runs whenever the employeeId changes

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 2. Handle the form submission to UPDATE the data
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Use axios.put to send the updated data. Note the URL includes the employeeId.
      await axios.put(`http://127.0.0.1:8000/api/employees/${employeeId}/`, formData);
      alert('Employee details updated successfully!');
      navigate('/employees');
    } catch (error) {
      console.error('Error updating employee:', error);
      alert(`Failed to update employee. Backend says: ${JSON.stringify(error.response.data)}`);
    }
  };

  return (
    <>
      <header className="bg-card-light dark:bg-card-dark p-4 border-b border-border-light dark:border-border-dark sticky top-0">
        <h1 className="text-2xl font-semibold text-text-light dark:text-text-dark">Edit Employee Details</h1>
      </header>
      <div className="p-8">
        <div className="bg-card-light dark:bg-card-dark p-8 rounded-lg shadow-md">
          {/* --- THIS IS THE FULL, COMPLETED FORM --- */}
          <form onSubmit={handleSubmit}>
            <section>
              <h2 className="text-lg font-semibold text-primary mb-6">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-subtext-light dark:text-subtext-dark mb-1">Full Name</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input name="firstName" value={formData.firstName} onChange={handleChange} className="w-full bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark rounded-md shadow-sm" placeholder="First Name" type="text" required />
                    <input name="lastName" value={formData.lastName} onChange={handleChange} className="w-full bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark rounded-md shadow-sm" placeholder="Last Name" type="text" required />
                  </div>
                </div>
                <div className="relative">
                  <label htmlFor="personal-email" className="block text-sm font-medium text-subtext-light dark:text-subtext-dark mb-1">Personal Email *</label>
                  <input id="personal-email" name="personalEmail" value={formData.personalEmail} onChange={handleChange} className="w-full bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark rounded-md shadow-sm pl-3 pr-10" type="email" required />
                  <span className="material-icons absolute right-3 top-8 text-subtext-light dark:text-subtext-dark">email</span>
                </div>
                <div className="relative">
                  <label htmlFor="mobile-number" className="block text-sm font-medium text-subtext-light dark:text-subtext-dark mb-1">Mobile Number *</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border-light bg-gray-50 text-subtext-light text-sm">+91</span>
                    <input id="mobile-number" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md bg-background-light" type="text" required />
                  </div>
                </div>
              </div>
            </section>
            
            <section className="mt-10">
              <h2 className="text-lg font-semibold text-primary mb-6">Work Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="employee-id" className="block text-sm font-medium text-subtext-light dark:text-subtext-dark mb-1">Staff/Faculty ID *</label>
                  <input id="employee-id" name="employeeId" value={formData.employeeId} onChange={handleChange} className="w-full bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark rounded-md shadow-sm" type="text" required />
                </div>
                <div className="relative">
                  <label htmlFor="joining-date" className="block text-sm font-medium text-subtext-light dark:text-subtext-dark mb-1">Date of Joining</label>
                  <input id="joining-date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} className="w-full bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark rounded-md shadow-sm pr-10" type="date" required />
                  <span className="material-icons absolute right-3 top-8 text-subtext-light dark:text-subtext-dark pointer-events-none">calendar_today</span>
                </div>
                <div className="relative">
                  <label htmlFor="department" className="block text-sm font-medium text-subtext-light dark:text-subtext-dark mb-1">Department / Faculty *</label>
                  <select id="department" name="department" value={formData.department} onChange={handleChange} className="w-full bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark rounded-md shadow-sm appearance-none pr-8" required>
                    <option value="">-- Select Department --</option>
                    <option value="Faculty of Engineering">Faculty of Engineering</option>
                    <option value="Faculty of Arts & Commerce">Faculty of Arts & Commerce</option>
                    <option value="Administration">Administration</option>
                  </select>
                  <span className="material-icons absolute right-3 top-8 text-subtext-light dark:text-subtext-dark pointer-events-none">expand_more</span>
                </div>
                <div className="relative">
                  <label htmlFor="designation" className="block text-sm font-medium text-subtext-light dark:text-subtext-dark mb-1">Designation / Title *</label>
                  <select id="designation" name="designation" value={formData.designation} onChange={handleChange} className="w-full bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark rounded-md shadow-sm appearance-none pr-8" required>
                    <option value="">-- Select Title --</option>
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Lecturer">Lecturer</option>
                    <option value="Administrative Officer">Administrative Officer</option>
                  </select>
                  <span className="material-icons absolute right-3 top-8 text-subtext-light dark:text-subtext-dark pointer-events-none">expand_more</span>
                </div>
              </div>
            </section>

            <div className="mt-10 pt-6 border-t border-border-light flex justify-end gap-4">
              <button type="button" onClick={() => navigate('/employees')} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
              <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-600">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditEmployeePage;