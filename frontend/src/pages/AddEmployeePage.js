import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PhoneInput from '../components/ui/PhoneInput';
import { getApiUrl } from '../utils/api';

const SectionTitle = ({ title }) => (
  <h2 className="text-lg font-semibold text-primary mb-6 col-span-full">{title}</h2>
);

const FormInput = ({ label, name, ...props }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-subtext-light mb-1">
      {label}
    </label>
    <input
      id={name}
      name={name}
      {...props}
      className="w-full bg-background-light dark:bg-gray-800 border border-border-light rounded-md shadow-sm px-3 py-2"
    />
  </div>
);

const FormSelect = ({ label, name, children, ...props }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-subtext-light mb-1">
      {label}
    </label>
    <select
      id={name}
      name={name}
      {...props}
      className="w-full bg-background-light dark:bg-gray-800 border border-border-light rounded-md shadow-sm px-3 py-2"
    >
      {children}
    </select>
  </div>
);

const AddEmployeePage = () => {
  const navigate = useNavigate();

  // ==========================================================================
  // 1. OCR / DOCUMENT SCANNING LOGIC
  // ==========================================================================
  const fileInputRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);

  // Helper: Convert OCR date (DD/MM/YYYY or DD-MM-YYYY) to ISO (YYYY-MM-DD)
  const convertDateToISO = (dateStr) => {
    if (!dateStr) return '';
    // Split by forward slash or dash
    const parts = dateStr.split(/[/-]/);
    if (parts.length === 3) {
        // Assuming format is DD-MM-YYYY or DD/MM/YYYY
        if (parts[0].length === 2 && parts[2].length === 4) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        // Assuming format is YYYY-MM-DD
        if (parts[0].length === 4) {
            return dateStr;
        }
    }
    return '';
  };

  const handleScanClick = () => {
    // Trigger the hidden file input click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanning(true);
    const uploadData = new FormData();
    uploadData.append('document', file);

    try {
        const token = localStorage.getItem('authToken');
        
        // Call the backend OCR endpoint
        const response = await axios.post(getApiUrl('/parse-document/'), uploadData, {
            headers: { 
              'Authorization': `Token ${token}`, 
              'Content-Type': 'multipart/form-data' 
            }
        });

        if (response.data.success) {
            const { email, phone, dob, name_guess } = response.data.data;
            
            // Logic to split the Name Guess into First and Last Name
            let newFirst = '';
            let newLast = '';
            if (name_guess) {
                const parts = name_guess.split(' ');
                newFirst = parts[0]; // First word is First Name
                if (parts.length > 1) {
                  newLast = parts.slice(1).join(' '); // Rest is Last Name
                }
            }

            // Auto-fill the form state
            setFormData(prev => ({
                ...prev,
                firstName: newFirst || prev.firstName,
                lastName: newLast || prev.lastName,
                personalEmail: email || prev.personalEmail,
                // Clean phone number (remove non-digits, keep last 10)
                mobileNumber: phone ? phone.replace(/\D/g, '').slice(-10) : prev.mobileNumber,
                dateOfBirth: convertDateToISO(dob) || prev.dateOfBirth
            }));
            
            alert("Document scanned successfully! Please review the auto-filled fields.");
        }
    } catch (error) {
        console.error("OCR Error", error);
        if (error.response && error.response.status === 403) {
            alert("Permission Denied: Only HR Managers or Super Admins can use the scanner.");
        } else {
            alert("Could not scan document. Please enter details manually or try a clearer image.");
        }
    } finally {
        setIsScanning(false);
        e.target.value = ''; // Reset file input so same file can be selected again
    }
  };
  // ==========================================================================


  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    personalEmail: '',
    mobileNumber: '',
    countryCode: '+91',
    gender: 'Male',
    employeeId: '',
    officialEmail: '',
    department: '',
    designation: '',
    joiningDate: '',
    employeeType: 'Full Time Employees',
    employmentStatus: 'Active',
    probationPeriod: '',
    highestQualification: '',
    experienceYears: '',
    previousInstitution: '',
    bankAccountNumber: '',
    ifscCode: '',
    panNumber: '',
    dateOfBirth: '',
    maritalStatus: 'Single',
    presentAddress: '',
    permanentAddress: '',
  });

  const [validationErrors, setValidationErrors] = useState({
    personalEmail: '',
    mobileNumber: '',
  });

  const designationOptions = {
    'Faculty of Engineering': [
      'Professor',
      'Assistant Professor',
      'Associate Professor',
      'Lab Assistant',
      'Technical Staff',
    ],
    'Faculty of Arts & Commerce': [
      'Professor',
      'Lecturer',
      'Teaching Assistant',
      'Department Coordinator',
    ],
    'Faculty of Design': ['Professor', 'Design Mentor', 'Studio Assistant'],
    'Faculty of Management': [
      'Professor',
      'Visiting Faculty',
      'Research Coordinator',
    ],
    'Faculty of Foreign Language Department': [
      'Professor',
      'Language Instructor',
      'Translator',
    ],
    Administration: [
      'HR Manager',
      'Admin Officer',
      'Clerk',
      'Accountant',
      'IT Support Staff',
      'Receptionist',
    ],
  };

  // Email validation function (RFC 5322 compliant)
  const validateEmail = (email) => {
    if (!email) return true; // Empty is valid if not required
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone validation function
  const validatePhone = (phone, countryCode) => {
    if (!phone) return true; // Empty is valid if not required
    
    // Remove formatting characters
    const digits = phone.replace(/\D/g, '');
    
    // Check length (10-15 digits)
    if (digits.length < 10 || digits.length > 15) {
      return false;
    }
    
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Update form data
    if (name === 'department') {
      setFormData({ ...formData, department: value, designation: '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    // Real-time validation
    if (name === 'personalEmail') {
      if (value && !validateEmail(value)) {
        setValidationErrors({
          ...validationErrors,
          personalEmail: 'Please enter a valid email address (e.g., user@example.com)',
        });
      } else {
        setValidationErrors({
          ...validationErrors,
          personalEmail: '',
        });
      }
    }

    if (name === 'mobileNumber') {
      if (value && !validatePhone(value, formData.countryCode)) {
        setValidationErrors({
          ...validationErrors,
          mobileNumber: 'Phone number must be between 10 and 15 digits',
        });
      } else {
        setValidationErrors({
          ...validationErrors,
          mobileNumber: '',
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate before submission
    const errors = {};
    
    if (!validateEmail(formData.personalEmail)) {
      errors.personalEmail = 'Please enter a valid email address (e.g., user@example.com)';
    }
    
    if (!validatePhone(formData.mobileNumber, formData.countryCode)) {
      errors.mobileNumber = 'Phone number must be between 10 and 15 digits';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    console.log('Submitting form data:', formData);
    
    try {
      // Combine country code and phone number for submission
      // Add space after country code to satisfy backend validation
      const submissionData = {
        ...formData,
        mobileNumber: formData.countryCode + ' ' + formData.mobileNumber.replace(/\D/g, ''),
      };
      
      await axios.post(getApiUrl('/employees/'), submissionData, {
          headers: {
            'Authorization': `Token ${localStorage.getItem('authToken')}`
          }
      });
      alert('Employee added successfully!');
      navigate('/employees');
    } catch (error) {
      console.error('Error adding employee:', error);
      
      // Handle validation errors from backend
      if (error.response?.data) {
        const backendErrors = {};
        const data = error.response.data;
        
        if (data.personalEmail) {
          backendErrors.personalEmail = Array.isArray(data.personalEmail) 
            ? data.personalEmail[0] 
            : data.personalEmail;
        }
        
        if (data.mobileNumber) {
          backendErrors.mobileNumber = Array.isArray(data.mobileNumber) 
            ? data.mobileNumber[0] 
            : data.mobileNumber;
        }
        
        if (Object.keys(backendErrors).length > 0) {
          setValidationErrors(backendErrors);
        }
        
        alert(
          `Failed to add staff member: ${
            JSON.stringify(data)
          }`
        );
      } else {
        alert(`Failed to add staff member: ${error.message}`);
      }
    }
  };

  return (
    <div className="p-8">
      <div className="bg-card-light dark:bg-card-dark p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-text-light dark:text-text-dark mb-8">
          Add Employee
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* ===== BASIC INFORMATION SECTION (With Scanner) ===== */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            
            {/* Custom Header with Scan Button */}
            <div className="col-span-full flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 pb-4 border-b border-border-light">
                <h2 className="text-lg font-semibold text-primary">Basic Information</h2>
                
                <div className="mt-2 sm:mt-0">
                    {/* Hidden File Input */}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        style={{display: 'none'}} 
                        accept="image/*, .pdf" 
                        onChange={handleFileScan}
                    />
                    {/* Visible Scan Button */}
                    <button
                        type="button"
                        onClick={handleScanClick}
                        disabled={isScanning}
                        className="flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium shadow-sm"
                    >
                        {isScanning ? (
                            <>
                                <span className="animate-spin h-4 w-4 border-2 border-blue-700 border-t-transparent rounded-full"></span>
                                Scanning...
                            </>
                        ) : (
                            <>
                                <span className="material-icons text-sm">document_scanner</span>
                                Auto-fill from ID/Resume
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-subtext-light mb-1">
                Name
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full bg-background-light dark:bg-gray-800 border border-border-light rounded-md shadow-sm px-3 py-2"
                />
                <input
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full bg-background-light dark:bg-gray-800 border border-border-light rounded-md shadow-sm px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-subtext-light mb-1">
                Gender *
              </label>
              <div className="flex items-center space-x-4 mt-2">
                <label>
                  <input
                    type="radio"
                    name="gender"
                    value="Male"
                    checked={formData.gender === 'Male'}
                    onChange={handleChange}
                    className="form-radio"
                  />{' '}
                  Male
                </label>
                <label>
                  <input
                    type="radio"
                    name="gender"
                    value="Female"
                    checked={formData.gender === 'Female'}
                    onChange={handleChange}
                    className="form-radio"
                  />{' '}
                  Female
                </label>
              </div>
            </div>

            <div>
              <label
                htmlFor="personalEmail"
                className="block text-sm font-medium text-subtext-light mb-1"
              >
                Personal Email *
              </label>
              <input
                id="personalEmail"
                name="personalEmail"
                type="email"
                value={formData.personalEmail}
                onChange={handleChange}
                required
                className={`w-full bg-background-light dark:bg-gray-800 border rounded-md shadow-sm px-3 py-2 ${
                  validationErrors.personalEmail
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-border-light'
                }`}
              />
              {validationErrors.personalEmail && (
                <p className="mt-1 text-sm text-red-500">
                  {validationErrors.personalEmail}
                </p>
              )}
            </div>

            <PhoneInput
              label="Mobile Number"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleChange}
              countryCode={formData.countryCode}
              onCountryCodeChange={handleChange}
              required
              error={validationErrors.mobileNumber}
            />
          </div>

          {/* ===== WORK INFORMATION ===== */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            <SectionTitle title="Work Information" />

            <FormInput
              label="Employee ID *"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              required
            />
            <FormInput
              label="Official Email *"
              name="officialEmail"
              type="email"
              value={formData.officialEmail}
              onChange={handleChange}
              required
            />
            <FormInput
              label="Date of Joining *"
              name="joiningDate"
              type="date"
              value={formData.joiningDate}
              onChange={handleChange}
              required
            />

            <FormSelect
              label="Department *"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
            >
              <option value="">-- Select Department --</option>
              {Object.keys(designationOptions).map((dept) => (
                <option key={dept}>{dept}</option>
              ))}
            </FormSelect>

            <FormSelect
              label="Designation *"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              required
              disabled={!formData.department}
            >
              <option value="">
                {formData.department
                  ? '-- Select Designation --'
                  : 'Select a Department first'}
              </option>
              {formData.department &&
                designationOptions[formData.department].map((designation) => (
                  <option key={designation}>{designation}</option>
                ))}
            </FormSelect>

            <FormSelect
              label="Employee Type"
              name="employeeType"
              value={formData.employeeType}
              onChange={handleChange}
            >
              <option>Full Time Employees</option>
              <option>Part Time</option>
            </FormSelect>

            <FormSelect
              label="Employment Status"
              name="employmentStatus"
              value={formData.employmentStatus}
              onChange={handleChange}
            >
              <option>Active</option>
              <option>On Leave</option>
              <option>Resigned</option>
            </FormSelect>

            <FormInput
              label="Probation Period (in months)"
              name="probationPeriod"
              type="number"
              min="0"
              value={formData.probationPeriod}
              onChange={handleChange}
            />
          </div>

          {/* ===== QUALIFICATION & EXPERIENCE ===== */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            <SectionTitle title="Qualification & Experience" />
            <FormInput
              label="Highest Qualification"
              name="highestQualification"
              value={formData.highestQualification}
              onChange={handleChange}
            />
            <FormInput
              label="Years of Experience"
              name="experienceYears"
              type="number"
              min="0"
              value={formData.experienceYears}
              onChange={handleChange}
            />
            <FormInput
              label="Previous Institution / Company"
              name="previousInstitution"
              value={formData.previousInstitution}
              onChange={handleChange}
            />
          </div>

          {/* ===== PAYROLL INFORMATION ===== */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            <SectionTitle title="Payroll Information" />
            <FormInput
              label="Bank Account Number"
              name="bankAccountNumber"
              value={formData.bankAccountNumber}
              onChange={handleChange}
            />
            <FormInput
              label="IFSC Code"
              name="ifscCode"
              value={formData.ifscCode}
              onChange={handleChange}
            />
            <FormInput
              label="PAN Number"
              name="panNumber"
              value={formData.panNumber}
              onChange={handleChange}
            />
          </div>

          {/* ===== PERSONAL INFORMATION ===== */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            <SectionTitle title="Personal Information" />
            <FormInput
              label="Date of Birth *"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
            />
            <FormSelect
              label="Marital Status *"
              name="maritalStatus"
              value={formData.maritalStatus}
              onChange={handleChange}
              required
            >
              <option>Single</option>
              <option>Married</option>
            </FormSelect>
            <div></div>
            <FormInput
              label="Present Address"
              name="presentAddress"
              value={formData.presentAddress}
              onChange={handleChange}
            />
            <FormInput
              label="Permanent Address"
              name="permanentAddress"
              value={formData.permanentAddress}
              onChange={handleChange}
            />
          </div>

          {/* ===== ACTION BUTTONS ===== */}
          <div className="mt-10 pt-6 border-t border-border-light flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/employees')}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              Save Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeePage;