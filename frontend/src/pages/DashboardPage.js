import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { usePermission } from '../contexts/PermissionContext';
import PersonalizedGreeting from '../components/PersonalizedGreeting';

// Import Chart.js components and register them.
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// --- CHART CONFIGURATIONS ---

const barChartData = {
    labels: ['Arts & Sci', 'Engineering', 'Medicine', 'Business', 'Law', 'Admin'],
    datasets: [{
        label: '# of Employees',
        data: [450, 320, 280, 210, 150, 380],
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 6,
    }]
};

const doughnutChartData = {
    labels: ['Faculty', 'Staff', 'Student Workers', 'Adjuncts'],
    datasets: [{
        label: 'Employee Distribution',
        data: [1250, 850, 256, 100],
        backgroundColor: ['rgba(79, 70, 229, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)'],
        borderColor: '#FFFFFF',
        borderWidth: 4,
    }]
};

const chartOptions = {
    bar: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true }, x: { grid: { display: false } } }
    },
    doughnut: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        cutout: '70%',
    }
};

// --- MAIN DASHBOARD PAGE COMPONENT ---
const DashboardPage = () => {
    const { hasRole } = usePermission();
    const isEmployee = hasRole('Employee');
    const isHRManager = hasRole('HR Manager');
    const isSuperAdmin = hasRole('Super Admin');
    
    const [employeeData, setEmployeeData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Fetch employee data for personalized dashboard
    useEffect(() => {
        const fetchEmployeeData = async () => {
            if (isEmployee && !isHRManager && !isSuperAdmin) {
                try {
                    const token = localStorage.getItem('authToken');
                    const userResponse = await axios.get('http://127.0.0.1:8000/api/auth/me/', {
                        headers: { 'Authorization': `Token ${token}` }
                    });
                    const employeeId = userResponse.data.employee_id;
                    
                    const empResponse = await axios.get(`http://127.0.0.1:8000/api/employees/${employeeId}/`, {
                        headers: { 'Authorization': `Token ${token}` }
                    });
                    
                    setEmployeeData(empResponse.data);
                } catch (error) {
                    console.error("Error fetching employee data:", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        };
        
        fetchEmployeeData();
    }, [isEmployee, isHRManager, isSuperAdmin]);
    
    // Show employee dashboard for employees
    if (isEmployee && !isHRManager && !isSuperAdmin) {
        return <EmployeeDashboard employeeData={employeeData} isLoading={isLoading} />;
    }
    
    // Show HR Manager dashboard for HR Managers
    if (isHRManager || isSuperAdmin) {
        return <HRManagerDashboard />;
    }
    
    // Fallback (shouldn't reach here)
    return null;
};


// --- HR MANAGER DASHBOARD COMPONENT ---
const HRManagerDashboard = () => {
    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    return (
        <main className="px-4 md:px-10 py-8 flex-1 bg-background-light dark:bg-background-dark">
            <div className="max-w-7xl mx-auto">
                {/* Welcome Header */}
                <div className="mb-6">
                    <h1 className="text-heading-light dark:text-heading-dark tracking-tight text-3xl font-bold">
                        <PersonalizedGreeting variant="full" /> 👋
                    </h1>
                    <p className="text-text-light dark:text-text-dark text-sm">{currentDate}</p>
                </div>

                {/* HR Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 my-4">
                    <HRStatCard 
                        icon="groups" 
                        title="Total Employees" 
                        value="2,456" 
                        subtitle="+12 this month"
                        color="blue"
                        link="/employees"
                    />
                    <HRStatCard 
                        icon="pending_actions" 
                        title="Pending Leave Requests" 
                        value="23" 
                        subtitle="Requires approval"
                        color="yellow"
                        link="/leave-tracker"
                    />
                    <HRStatCard 
                        icon="work" 
                        title="Open Positions" 
                        value="8" 
                        subtitle="Active recruitment"
                        color="purple"
                        link="/recruitment"
                    />
                    <HRStatCard 
                        icon="assignment_return" 
                        title="Pending Resignations" 
                        value="3" 
                        subtitle="Awaiting processing"
                        color="red"
                        link="/resignation"
                    />
                </div>

                {/* Quick Actions */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-heading-light dark:text-heading-dark mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        <QuickActionCard icon="person_add" label="Add Employee" link="/add-employee" />
                        <QuickActionCard icon="approval" label="Approve Leaves" link="/leave-tracker" />
                        <QuickActionCard icon="receipt" label="Process Payroll" link="/run-payroll" />
                        <QuickActionCard icon="post_add" label="Post Job" link="/post-vacancy" />
                        <QuickActionCard icon="campaign" label="Create Announcement" link="/announcement" />
                        <QuickActionCard icon="description" label="View Reports" link="/employees" />
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent HR Activity */}
                    <div className="lg:col-span-2 p-6 rounded-xl bg-card-light dark:bg-card-dark shadow-sm">
                        <h3 className="text-lg font-semibold text-heading-light dark:text-heading-dark mb-4">Recent HR Activity</h3>
                        <div className="space-y-4">
                            <ActivityItem 
                                icon="person_add" 
                                title="New Employee Onboarded" 
                                description="John Smith joined as Assistant Professor in CS Department"
                                time="2 hours ago"
                                color="green"
                            />
                            <ActivityItem 
                                icon="check_circle" 
                                title="Leave Request Approved" 
                                description="Approved 5 leave requests for November"
                                time="4 hours ago"
                                color="blue"
                            />
                            <ActivityItem 
                                icon="receipt_long" 
                                title="Payroll Processed" 
                                description="October 2025 payroll completed for 2,456 employees"
                                time="1 day ago"
                                color="purple"
                            />
                            <ActivityItem 
                                icon="work" 
                                title="Position Filled" 
                                description="Lab Technician position filled - Physics Department"
                                time="2 days ago"
                                color="yellow"
                            />
                        </div>
                    </div>

                    {/* Pending Tasks & Quick Stats */}
                    <div className="space-y-6">
                        {/* Pending Tasks */}
                        <div className="p-6 rounded-xl bg-card-light dark:bg-card-dark shadow-sm">
                            <h3 className="text-lg font-semibold text-heading-light dark:text-heading-dark mb-4">Pending Tasks</h3>
                            <div className="space-y-3">
                                <TaskItem 
                                    icon="pending_actions" 
                                    title="Leave Approvals" 
                                    count="23" 
                                    link="/leave-tracker"
                                />
                                <TaskItem 
                                    icon="assignment_return" 
                                    title="Resignation Reviews" 
                                    count="3" 
                                    link="/resignation"
                                />
                                <TaskItem 
                                    icon="work" 
                                    title="Interview Schedules" 
                                    count="12" 
                                    link="/recruitment"
                                />
                                <TaskItem 
                                    icon="inventory_2" 
                                    title="Asset Requests" 
                                    count="7" 
                                    link="/employee-assets"
                                />
                            </div>
                        </div>

                        {/* Department Summary */}
                        <div className="p-6 rounded-xl bg-card-light dark:bg-card-dark shadow-sm">
                            <h3 className="text-lg font-semibold text-heading-light dark:text-heading-dark mb-4">Department Summary</h3>
                            <div className="space-y-3">
                                <DepartmentItem dept="Engineering" count="450" />
                                <DepartmentItem dept="Arts & Sciences" count="380" />
                                <DepartmentItem dept="Medicine" count="320" />
                                <DepartmentItem dept="Business" count="280" />
                                <DepartmentItem dept="Others" count="1,026" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

// HR Manager Dashboard Helper Components
const HRStatCard = ({ icon, title, value, subtitle, color, link }) => {
    const colorClasses = {
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
        red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
        green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    };
    
    return (
        <Link to={link} className="block">
            <div className="flex flex-col gap-2 rounded-xl p-6 bg-card-light dark:bg-card-dark shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-2`}>
                    <span className="material-icons text-2xl">{icon}</span>
                </div>
                <p className="text-text-light dark:text-text-dark text-sm font-medium">{title}</p>
                <p className="text-heading-light dark:text-heading-dark tracking-tight text-2xl font-bold">{value}</p>
                <p className="text-subtext-light text-xs">{subtitle}</p>
            </div>
        </Link>
    );
};

const TaskItem = ({ icon, title, count, link }) => (
    <Link to={link} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-icons text-primary text-sm">{icon}</span>
            </div>
            <span className="text-sm font-medium text-text-light dark:text-text-dark">{title}</span>
        </div>
        <span className="text-sm font-bold text-primary">{count}</span>
    </Link>
);

const DepartmentItem = ({ dept, count }) => (
    <div className="flex items-center justify-between">
        <span className="text-sm text-subtext-light">{dept}</span>
        <span className="text-sm font-semibold text-heading-light dark:text-heading-dark">{count}</span>
    </div>
);

// --- HELPER COMPONENTS ---

const StatCard = ({ icon, title, value, change, isPositive }) => (
    <div className="flex flex-col gap-2 rounded-xl p-6 bg-card-light dark:bg-card-dark shadow-sm">
        <p className="text-text-light dark:text-text-dark text-sm font-medium">{title}</p>
        <p className="text-heading-light dark:text-heading-dark tracking-tight text-3xl font-bold">{value}</p>
        <p className={`${isPositive ? 'text-green-600' : 'text-red-600'} text-sm font-medium flex items-center gap-1`}>
            <span className="material-symbols-outlined text-base">{isPositive ? 'arrow_upward' : 'arrow_downward'}</span>
            <span>{change}</span>
        </p>
    </div>
);

const OpenPositionsTable = () => {
    const positions = [
        { title: 'Assistant Professor, Computer Science', dept: 'School of Engineering', date: '2025-10-15', status: 'Open' },
        { title: 'Administrative Assistant', dept: 'College of Arts & Sciences', date: '2025-10-12', status: 'Open' },
        { title: 'Research Lab Technician', dept: 'Department of Biology', date: '2025-09-28', status: 'Interviewing' },
        { title: 'Librarian', dept: 'University Library', date: '2025-09-25', status: 'Closed' },
    ];
    
    const getStatusBadge = (status) => {
        switch (status) {
            case 'Open': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">{status}</span>;
            case 'Interviewing': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">{status}</span>;
            case 'Closed': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">{status}</span>;
            default: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    return (
        <table className="w-full text-sm text-left text-text-light dark:text-text-dark">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/60">
                <tr>
                    <th className="px-6 py-3">Job Title</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Date Posted</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
            </thead>
            <tbody>
                {positions.map(pos => (
                    <tr key={pos.title} className="bg-card-light border-b dark:bg-card-dark dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <th scope="row" className="px-6 py-4 font-medium text-heading-light whitespace-nowrap dark:text-heading-dark">{pos.title}</th>
                        <td className="px-6 py-4">{pos.dept}</td>
                        <td className="px-6 py-4">{pos.date}</td>
                        <td className="px-6 py-4">{getStatusBadge(pos.status)}</td>
                        <td className="px-6 py-4 text-right"><Link className="font-medium text-primary hover:underline" to="/recruitment">View</Link></td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

// --- EMPLOYEE DASHBOARD COMPONENT ---
const EmployeeDashboard = ({ employeeData, isLoading }) => {
    if (isLoading) {
        return (
            <main className="px-4 md:px-10 py-8 flex-1 bg-background-light dark:bg-background-dark">
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-subtext-light">Loading your dashboard...</p>
                    </div>
                </div>
            </main>
        );
    }
    
    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    return (
        <main className="px-4 md:px-10 py-8 flex-1 bg-background-light dark:bg-background-dark">
            <div className="max-w-7xl mx-auto">
                {/* Welcome Header */}
                <div className="mb-6">
                    <h1 className="text-heading-light dark:text-heading-dark tracking-tight text-3xl font-bold">
                        <PersonalizedGreeting variant="full" /> 👋
                    </h1>
                    <p className="text-text-light dark:text-text-dark text-sm">{currentDate}</p>
                </div>

                {/* Personal Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 my-4">
                    <EmployeeStatCard 
                        icon="event_available" 
                        title="Attendance This Month" 
                        value="22/23 days" 
                        subtitle="95.7% present"
                        color="blue"
                        link="/attendance"
                    />
                    <EmployeeStatCard 
                        icon="beach_access" 
                        title="Leave Balance" 
                        value="12 days" 
                        subtitle="3 pending requests"
                        color="green"
                        link="/leave-tracker"
                    />
                    <EmployeeStatCard 
                        icon="schedule" 
                        title="Hours This Week" 
                        value="38.5 hrs" 
                        subtitle="Target: 40 hrs"
                        color="purple"
                        link="/time-tracker"
                    />
                    <EmployeeStatCard 
                        icon="grade" 
                        title="Performance Score" 
                        value="4.5/5.0" 
                        subtitle="Excellent"
                        color="yellow"
                        link="/appraisal"
                    />
                </div>

                {/* Quick Actions */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-heading-light dark:text-heading-dark mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        <QuickActionCard icon="event_note" label="Request Leave" link="/request-leave" />
                        <QuickActionCard icon="receipt" label="View Payroll" link="/payroll" />
                        <QuickActionCard icon="person" label="My Profile" link="/my-profile" />
                        <QuickActionCard icon="inventory_2" label="My Assets" link="/employee-assets" />
                        <QuickActionCard icon="work" label="Job Opportunities" link="/recruitment" />
                        <QuickActionCard icon="campaign" label="Announcements" link="/announcement" />
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Activity */}
                    <div className="lg:col-span-2 p-6 rounded-xl bg-card-light dark:bg-card-dark shadow-sm">
                        <h3 className="text-lg font-semibold text-heading-light dark:text-heading-dark mb-4">Recent Activity</h3>
                        <div className="space-y-4">
                            <ActivityItem 
                                icon="check_circle" 
                                title="Leave Request Approved" 
                                description="Your casual leave for Nov 20-22 has been approved"
                                time="2 hours ago"
                                color="green"
                            />
                            <ActivityItem 
                                icon="receipt_long" 
                                title="Payslip Generated" 
                                description="October 2025 salary slip is now available"
                                time="1 day ago"
                                color="blue"
                            />
                            <ActivityItem 
                                icon="campaign" 
                                title="New Announcement" 
                                description="Annual performance review cycle has started"
                                time="3 days ago"
                                color="purple"
                            />
                            <ActivityItem 
                                icon="inventory_2" 
                                title="Asset Assigned" 
                                description="New laptop (LP-1234) has been assigned to you"
                                time="1 week ago"
                                color="yellow"
                            />
                        </div>
                    </div>

                    {/* Upcoming Events & Profile Summary */}
                    <div className="space-y-6">
                        {/* Profile Summary */}
                        <div className="p-6 rounded-xl bg-card-light dark:bg-card-dark shadow-sm">
                            <h3 className="text-lg font-semibold text-heading-light dark:text-heading-dark mb-4">Profile Summary</h3>
                            {employeeData && (
                                <div className="space-y-3">
                                    <ProfileItem label="Employee ID" value={employeeData.employeeId} />
                                    <ProfileItem label="Department" value={employeeData.department} />
                                    <ProfileItem label="Designation" value={employeeData.designation} />
                                    <ProfileItem label="Joining Date" value={employeeData.joiningDate} />
                                    <Link 
                                        to="/my-profile" 
                                        className="block mt-4 text-center text-primary hover:underline text-sm font-medium"
                                    >
                                        View Full Profile →
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Upcoming Events */}
                        <div className="p-6 rounded-xl bg-card-light dark:bg-card-dark shadow-sm">
                            <h3 className="text-lg font-semibold text-heading-light dark:text-heading-dark mb-4">Upcoming Events</h3>
                            <div className="space-y-3">
                                <EventItem date="Nov 20" title="Team Meeting" time="10:00 AM" />
                                <EventItem date="Nov 25" title="Performance Review" time="2:00 PM" />
                                <EventItem date="Dec 1" title="Holiday - University Day" time="All Day" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

// Employee Dashboard Helper Components
const EmployeeStatCard = ({ icon, title, value, subtitle, color, link }) => {
    const colorClasses = {
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
        yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    };
    
    return (
        <Link to={link} className="block">
            <div className="flex flex-col gap-2 rounded-xl p-6 bg-card-light dark:bg-card-dark shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-2`}>
                    <span className="material-icons text-2xl">{icon}</span>
                </div>
                <p className="text-text-light dark:text-text-dark text-sm font-medium">{title}</p>
                <p className="text-heading-light dark:text-heading-dark tracking-tight text-2xl font-bold">{value}</p>
                <p className="text-subtext-light text-xs">{subtitle}</p>
            </div>
        </Link>
    );
};

const QuickActionCard = ({ icon, label, link }) => (
    <Link to={link} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card-light dark:bg-card-dark shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-icons text-primary">{icon}</span>
        </div>
        <span className="text-xs font-medium text-center text-text-light dark:text-text-dark">{label}</span>
    </Link>
);

const ActivityItem = ({ icon, title, description, time, color }) => {
    const colorClasses = {
        green: 'bg-green-100 text-green-600',
        blue: 'bg-blue-100 text-blue-600',
        purple: 'bg-purple-100 text-purple-600',
        yellow: 'bg-yellow-100 text-yellow-600',
    };
    
    return (
        <div className="flex items-start gap-3 pb-4 border-b border-border-light dark:border-border-dark last:border-0">
            <div className={`w-10 h-10 rounded-full ${colorClasses[color]} flex items-center justify-center flex-shrink-0`}>
                <span className="material-icons text-lg">{icon}</span>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-heading-light dark:text-heading-dark">{title}</p>
                <p className="text-xs text-subtext-light mt-1">{description}</p>
                <p className="text-xs text-subtext-light mt-1">{time}</p>
            </div>
        </div>
    );
};

const ProfileItem = ({ label, value }) => (
    <div className="flex justify-between items-center">
        <span className="text-sm text-subtext-light">{label}:</span>
        <span className="text-sm font-medium text-heading-light dark:text-heading-dark">{value}</span>
    </div>
);

const EventItem = ({ date, title, time }) => (
    <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary">{date.split(' ')[0]}</span>
            <span className="text-xs text-primary">{date.split(' ')[1]}</span>
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-heading-light dark:text-heading-dark">{title}</p>
            <p className="text-xs text-subtext-light">{time}</p>
        </div>
    </div>
);

export default DashboardPage;