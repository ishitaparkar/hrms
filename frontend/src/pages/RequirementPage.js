import React, { useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Mock data
const existingRequirements = [
  { id: "REQ-001", position: "Assistant Professor", department: "Computer Science", date: "2025-10-15", status: "Approved" },
  { id: "REQ-002", position: "Lab Technician", department: "Physics", date: "2025-10-18", status: "Pending" },
  { id: "REQ-003", position: "Admissions Counselor", department: "Admissions Office", date: "2025-10-20", status: "Rejected" },
  { id: "REQ-004", position: "Junior Librarian", department: "Library", date: "2025-10-21", status: "Pending" },
];

const RequirementPage = () => {
  const [formData, setFormData] = useState({ position: "", department: "", positions: 1, justification: "" });

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = (e) => { e.preventDefault(); alert("Request submitted!"); };

  // Stats calculation
  const stats = existingRequirements.reduce((acc, req) => {
    acc.total += 1;
    acc[req.status.toLowerCase()] = (acc[req.status.toLowerCase()] || 0) + 1;
    return acc;
  }, { total: 0 });

  // Chart data with shades of blue and grey
  const chartData = {
    labels: ["Approved", "Pending", "Rejected"],
    datasets: [
      {
        label: "Number of Requests",
        data: [stats.approved || 0, stats.pending || 0, stats.rejected || 0],
        backgroundColor: ["#3B82F6", "#60A5FA", "#94A3B8"], // blue and grey shades
        borderRadius: 6,
      },
    ],
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved": return "bg-blue-100 text-blue-800";
      case "Pending": return "bg-blue-200 text-blue-900";
      case "Rejected": return "bg-gray-200 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <header className="sticky top-0 bg-card-light dark:bg-card-dark p-4 rounded shadow-md z-10">
        <h1 className="text-2xl font-bold text-text-light dark:text-text-dark">HR Hiring Dashboard</h1>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 shadow rounded p-4 flex flex-col items-start">
          <p className="text-sm text-subtext-light dark:text-subtext-dark">Total Requests</p>
          <p className="text-xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded p-4 flex flex-col items-start">
          <p className="text-sm text-subtext-light dark:text-subtext-dark">Approved</p>
          <p className="text-xl font-bold">{stats.approved || 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded p-4 flex flex-col items-start">
          <p className="text-sm text-subtext-light dark:text-subtext-dark">Pending</p>
          <p className="text-xl font-bold">{stats.pending || 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded p-4 flex flex-col items-start">
          <p className="text-sm text-subtext-light dark:text-subtext-dark">Rejected</p>
          <p className="text-xl font-bold">{stats.rejected || 0}</p>
        </div>
      </div>

      {/* Form + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1 bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Raise New Request</h3>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block mb-1 text-sm">Position</label>
              <input type="text" name="position" value={formData.position} onChange={handleInputChange} className="w-full px-3 py-2 rounded border" required />
            </div>
            <div>
              <label className="block mb-1 text-sm">Department</label>
              <select name="department" value={formData.department} onChange={handleInputChange} className="w-full px-3 py-2 rounded border" required>
                <option value="">-- Select --</option>
                <option>Faculty of Engineering</option>
                <option>Faculty of Arts & Commerce</option>
                <option>Administration</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm">Positions Count</label>
              <input type="number" min="1" name="positions" value={formData.positions} onChange={handleInputChange} className="w-full px-3 py-2 rounded border" />
            </div>
            <div>
              <label className="block mb-1 text-sm">Justification</label>
              <textarea name="justification" value={formData.justification} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 rounded border" />
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">Submit</button>
          </form>
        </div>

        {/* Chart */}
        <div className="lg:col-span-2 bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Requests Status Overview</h3>
          <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-md mt-6">
        <h3 className="text-lg font-semibold mb-4">Submitted Requests</h3>
        {existingRequirements.length === 0 ? (
          <div className="text-center py-10 text-subtext-light">No requests yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-y-2">
              <thead className="text-xs uppercase bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left">ID</th>
                  <th className="px-6 py-3 text-left">Position</th>
                  <th className="px-6 py-3 text-left">Department</th>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {existingRequirements.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                    <td className="px-6 py-3 font-medium">{req.id}</td>
                    <td className="px-6 py-3">{req.position}</td>
                    <td className="px-6 py-3">{req.department}</td>
                    <td className="px-6 py-3">{req.date}</td>
                    <td className={`px-4 py-2 ${getStatusBadge(req.status)} rounded-full text-center w-24`}>
                      {req.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequirementPage;
