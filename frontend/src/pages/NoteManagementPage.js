import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// This helper function is now defined here to be used by the component.
// It derives the overall status from an array of approval steps.
const getOverallStatus = (approvals) => {
    const isRejected = approvals.find(a => a.status === 'Rejected');
    if (isRejected) return `Rejected by ${isRejected.role}`;
    
    const firstPending = approvals.find(a => a.status === 'Pending');
    if (firstPending) return `Pending ${firstPending.role} Approval`;

    return 'Fully Approved';
};

const NoteManagementPage = () => {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAndPrepareNotes = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/employees/');
        let employeesData = response.data.results || response.data || [];

        // Simulate note data for each real employee, including a realistic approval chain
        const simulatedNotes = employeesData.map((employee, index) => {
          const approvalChains = [
            [{ role: 'Campus Admin', status: 'Approved' }, { role: 'Finance Officer', status: 'Pending' }],
            [{ role: 'Campus Admin', status: 'Approved' }, { role: 'Finance Officer', status: 'Approved' }, { role: 'Registrar', status: 'Pending'}],
            [{ role: 'Campus Admin', status: 'Rejected' }],
            [{ role: 'Campus Admin', status: 'Approved' }, { role: 'Finance Officer', status: 'Approved' }, { role: 'Registrar', status: 'Approved'}],
          ];
          const approvals = approvalChains[index % approvalChains.length];

          return {
            id: `N-00${employee.id}`,
            title: `Proposal from ${employee.department}`,
            initiator: `${employee.firstName} ${employee.lastName}`,
            department: employee.department,
            submittedDate: `2025-10-${25 > index ? 25 - index : 1}`, // Prevents invalid dates
            // The status is now CALCULATED, not hardcoded, ensuring it matches the detail page
            status: getOverallStatus(approvals), 
          };
        });
        setNotes(simulatedNotes);
      } catch (error) {
        console.error("Error fetching data for notes:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAndPrepareNotes();
  }, []);

  // The getStatusBadge function is now correctly included.
  const getStatusBadge = (status) => {
    if (status.includes('Approved')) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">{status}</span>;
    if (status.includes('Pending')) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">{status}</span>;
    if (status.includes('Rejected')) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">{status}</span>;
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{status}</span>;
  };

  return (
    <div className="p-8">
      {/* The header section is correctly included. */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">Note & Proposal Workflow</h1>
          <p className="text-sm text-subtext-light">Track the approval status of all official notes.</p>
        </div>
        <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center hover:bg-blue-600">
          <span className="material-icons mr-2 text-base">add</span> Create New Note
        </button>
      </div>

      <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-sm overflow-x-auto">
        {isLoading ? (
          <div className="text-center py-8 text-subtext-light">Loading notes...</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-subtext-light dark:text-subtext-dark uppercase bg-background-light">
              <tr>
                <th className="px-6 py-3">Note ID</th>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Initiator (Department)</th>
                <th className="px-6 py-3">Date Submitted</th>
                <th className="px-6 py-3">Current Status</th>
                <th className="px-6 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((note) => (
                <tr key={note.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{note.id}</td>
                  <td className="px-6 py-4 font-semibold text-text-light dark:text-white">{note.title}</td>
                  <td className="px-6 py-4">{note.initiator} <span className="text-subtext-light">({note.department})</span></td>
                  <td className="px-6 py-4">{note.submittedDate}</td>
                  <td className="px-6 py-4">{getStatusBadge(note.status)}</td>
                  <td className="px-6 py-4 text-center">
                      <Link to={`/notes-approvals/${note.id}`} className="text-primary hover:underline text-xs">View Details</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default NoteManagementPage;