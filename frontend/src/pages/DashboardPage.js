import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { usePermission } from '../contexts/PermissionContext';
import PersonalizedGreeting from '../components/PersonalizedGreeting';
import { getApiUrl } from '../utils/api';



// --- CHART CONFIGURATIONS ---
// For now, removing unused assignments.



// --- MAIN DASHBOARD PAGE COMPONENT ---
const DashboardPage = () => {
    const { hasRole } = usePermission();
    const isEmployee = hasRole('Employee');
    const isHRManager = hasRole('HR Manager');
    const isSuperAdmin = hasRole('Super Admin');

    const [employeeData, setEmployeeData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Dynamic Data State
    const [announcements, setAnnouncements] = useState([]);
    const [events, setEvents] = useState([]);
    const [stats, setStats] = useState(null);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('authToken');
            const headers = { 'Authorization': `Token ${token}` };

            try {
                // Fetch Announcements, Events, and Stats
                const [annResponse, eventResponse] = await Promise.all([
                    axios.get(getApiUrl('/dashboard/announcements/'), { headers }),
                    axios.get(getApiUrl('/dashboard/events/'), { headers })
                ]);
                setAnnouncements(annResponse.data);
                setEvents(eventResponse.data);

                // Fetch Employee Data & Stats if needed
                if (isEmployee && !isHRManager && !isSuperAdmin) {
                    const userResponse = await axios.get(getApiUrl('/auth/me/'), { headers });
                    const employeeId = userResponse.data.employee_id;

                    const [empResponse, statsResponse] = await Promise.all([
                        axios.get(getApiUrl(`/employees/${employeeId}/`), { headers }),
                        axios.get(getApiUrl('/dashboard/stats/'), { headers })
                    ]);

                    setEmployeeData(empResponse.data);
                    setStats(statsResponse.data);
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [isEmployee, isHRManager, isSuperAdmin]);

    // Show employee dashboard for employees
    if (isEmployee && !isHRManager && !isSuperAdmin) {
        return <EmployeeDashboard employeeData={employeeData} isLoading={isLoading} announcements={announcements} events={events} stats={stats} />;
    }

    // Show HR Manager dashboard for HR Managers
    if (isHRManager || isSuperAdmin) {
        return <HRManagerDashboard announcements={announcements} events={events} />;
    }

    // Fallback (shouldn't reach here)
    return null;
};


// --- HR MANAGER DASHBOARD COMPONENT ---
const HRManagerDashboard = ({ announcements, events }) => {
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
                    <HRStatCard icon="groups" title="Total Employees" value="2,456" subtitle="+12 this month" color="blue" link="/employees" />
                    <HRStatCard icon="pending_actions" title="Pending Leave Requests" value="23" subtitle="Requires approval" color="yellow" link="/leave-tracker" />
                    <HRStatCard icon="work" title="Open Positions" value="8" subtitle="Active recruitment" color="purple" link="/recruitment" />
                    <HRStatCard icon="assignment_return" title="Pending Resignations" value="3" subtitle="Awaiting processing" color="red" link="/resignation" />
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
                    {/* Recent Human Resource Activity -> Now Dynamic Announcements */}
                    <div className="lg:col-span-2 p-6 rounded-xl bg-card-light dark:bg-card-dark shadow-sm">
                        <h3 className="text-lg font-semibold text-heading-light dark:text-heading-dark mb-4">Announcements & Activity</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {announcements.length > 0 ? (
                                announcements.map((ann, index) => (
                                    <ActivityCard
                                        key={ann.id || index}
                                        icon={ann.icon || "campaign"}
                                        title={ann.title}
                                        description={ann.description}
                                        date={new Date(ann.created_at).toLocaleDateString()}
                                        color={ann.color || "blue"}
                                    />
                                ))
                            ) : (
                                <p className="text-sm text-gray-500">No recent announcements.</p>
                            )}
                        </div>
                    </div>

                    {/* Pending Tasks & Quick Stats */}
                    <div className="space-y-6">
                        {/* Pending Tasks - Keep static for now or wire up later */}
                        <div className="p-6 rounded-xl bg-card-light dark:bg-card-dark shadow-sm">
                            <h3 className="text-lg font-semibold text-heading-light dark:text-heading-dark mb-4">Pending Tasks</h3>
                            <div className="space-y-3">
                                <TaskItem icon="pending_actions" title="Leave Approvals" count="23" link="/leave-tracker" />
                                <TaskItem icon="assignment_return" title="Resignation Reviews" count="3" link="/resignation" />
                                <TaskItem icon="work" title="Interview Schedules" count="12" link="/recruitment" />
                                <TaskItem icon="inventory_2" title="Asset Requests" count="7" link="/employee-assets" />
                            </div>
                        </div>

                        {/* Recent Events -> Now Dynamic */}
                        <div className="p-6 rounded-xl bg-card-light dark:bg-card-dark shadow-sm">
                            <h3 className="text-lg font-semibold text-heading-light dark:text-heading-dark mb-4">Upcoming Events</h3>
                            <div className="space-y-3">
                                {events.length > 0 ? (
                                    events.map((event, index) => (
                                        <EventItem
                                            key={event.id || index}
                                            dateObj={new Date(event.date_time)}
                                            title={event.title}
                                            time={new Date(event.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        />
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">No upcoming events.</p>
                                )}
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
const EmployeeDashboard = ({ employeeData, isLoading, announcements, events, stats }) => {
    if (isLoading) {
        return (
            <main className="px-4 md:px-10 py-8 flex-1 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading your dashboard...</p>
                    </div>
                </div>
            </main>
        );
    }

    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <main className="px-4 md:px-10 py-8 flex-1 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                            <PersonalizedGreeting variant="full" />
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">{currentDate}</p>
                    </div>

                    {/* Search / Actions Placeholder */}
                    <div className="mt-4 md:mt-0">
                        {/* Can add search bar or quick actions here if needed */}
                    </div>
                </div>

                {/* Stats Row */}
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Today's Stats</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <EmployeeStatCard
                            title="Attendance"
                            value={stats?.attendance?.value || "0 days"}
                            subtitle={stats?.attendance?.subtitle || "No data"}
                            borderColor="border-blue-500"
                        />
                        <EmployeeStatCard
                            title="Leave Balance"
                            value={stats?.leave?.value || "0 days"}
                            subtitle={stats?.leave?.subtitle || "No pending requests"}
                            borderColor="border-green-500"
                        />
                        <EmployeeStatCard
                            title="Hours This Week"
                            value={stats?.hours?.value || "0 hrs"}
                            subtitle={stats?.hours?.subtitle || "This week"}
                            borderColor="border-yellow-500"
                        />
                        <EmployeeStatCard
                            title="Performance"
                            value={stats?.performance?.value || "N/A"}
                            subtitle={stats?.performance?.subtitle || "Latest Rating"}
                            borderColor="border-purple-500"
                        />
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Announcements (Card Style) */}
                    <div className="lg:col-span-2">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Announcements</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {announcements && announcements.length > 0 ? (
                                announcements.map((ann, index) => (
                                    <ActivityCard
                                        key={ann.id || index}
                                        icon={ann.icon || "campaign"}
                                        title={ann.title}
                                        description={ann.description}
                                        date={new Date(ann.created_at).toLocaleDateString()}
                                        color={ann.color || "blue"}
                                    />
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 col-span-2">No recent announcements.</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Events (List Style) */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Upcoming Events</h2>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                            <div className="space-y-6">
                                {events && events.length > 0 ? (
                                    events.map((event, index) => (
                                        <EventItem
                                            key={event.id || index}
                                            dateObj={new Date(event.date_time)}
                                            title={event.title}
                                            time={new Date(event.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        />
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">No upcoming events.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

// Employee Dashboard Helper Components
const QuickActionCard = ({ icon, label, link }) => (
    <Link to={link} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card-light dark:bg-card-dark shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-icons text-primary">{icon}</span>
        </div>
        <span className="text-xs font-medium text-center text-text-light dark:text-text-dark">{label}</span>
    </Link>
);

// --- HELPER COMPONENTS (Redesigned) ---

const EmployeeStatCard = ({ title, value, subtitle, borderColor }) => {
    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border-l-4 ${borderColor} transition-transform hover:-translate-y-1`}>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{title}</p>
            <p className="text-gray-800 dark:text-white text-3xl font-bold mb-1">{value}</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs">{subtitle}</p>
        </div>
    );
};

const ActivityCard = ({ icon, title, description, date, color }) => {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        yellow: 'bg-yellow-100 text-yellow-600',
        purple: 'bg-purple-100 text-purple-600',
        red: 'bg-red-100 text-red-600',
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex flex-col h-full border border-transparent hover:border-gray-200 transition-colors">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${colorClasses[color] || colorClasses.blue} flex items-center justify-center`}>
                        <span className="material-icons text-xl">{icon}</span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white text-sm">{title}</h3>
                        <span className="text-xs text-blue-500 font-medium">Announcement</span>
                    </div>
                </div>
                <span className="text-xs text-gray-400">{date}</span>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 flex-1 mb-4 line-clamp-2">
                {description}
            </p>

            <div className="flex items-center justify-end">
                <button className="text-xs font-semibold text-gray-400 hover:text-blue-600 transition-colors">
                    Read Details
                </button>
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