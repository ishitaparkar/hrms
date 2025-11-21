import { BrowserRouter, Routes, Route } from "react-router-dom";

// Core Components
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { PermissionProvider } from "./contexts/PermissionContext";
import { PreferencesProvider } from "./contexts/PreferencesContext";
import { Navigate } from "react-router-dom";
import Chatbot from "./components/Chatbot"; // <--- Added Chatbot Import

// Page Components
import LoginPage from "./pages/LoginPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import DashboardPage from "./pages/DashboardPage";
import EmployeeManagementPage from "./pages/EmployeeManagementPage";
import AddEmployeePage from "./pages/AddEmployeePage";
import EmployeeDetailsPage from "./pages/EmployeeDetailsPage";
import EditEmployeePage from "./pages/EditEmployeePage";

// Other Feature Pages
import ProfilePage from "./pages/ProfilePage";
import RequirementPage from "./pages/RequirementPage";
import RecruitmentPage from "./pages/RecruitmentPage";
import EmployeeAssetsPage from "./pages/EmployeeAssetsPage";
import AttendancePage from "./pages/AttendancePage";
import LeaveTrackerPage from "./pages/LeaveTrackerPage";
import TimeTrackerPage from "./pages/TimeTrackerPage";
import AppraisalPage from "./pages/AppraisalPage";
import AnnouncementPage from "./pages/AnnouncementPage";
import ResignationPage from "./pages/ResignationPage";
import SettingsPage from "./pages/SettingsPage";

// My Space Pages
import MyTeamPage from "./pages/MyTeamPage";
import MyPerformancePage from "./pages/MyPerformancePage";
import MyAttendancePage from "./pages/MyAttendancePage";
import MyLeavePage from "./pages/MyLeavePage";

// Appraisal Subpages
import StartReviewPage from "./pages/StartReviewPage";
import ViewReportPage from "./pages/ViewReportPage";

// Payroll Pages
import PayrollPage from "./pages/PayrollPage";
import RunPayrollPage from "./pages/RunPayrollPage";

// Leave & Vacancy Pages
import RequestLeavePage from "./pages/RequestLeavePage";
import PostVacancyPage from "./pages/PostVacancyPage";

// Notes & Approvals
import NoteManagementPage from "./pages/NoteManagementPage";
import NoteDetailsPage from "./pages/NoteDetailsPage";

// Role Management
import RoleManagementPage from "./pages/RoleManagementPage";
import AuditLogPage from "./pages/AuditLogPage";

// First Login Password Change
import FirstLoginPasswordChange from "./pages/FirstLoginPasswordChange";

// Employee Onboarding
import PhoneAuthenticationPage from "./pages/PhoneAuthenticationPage";
import AccountSetupPage from "./pages/AccountSetupPage";
import PasswordSetupPage from "./pages/PasswordSetupPage";
import OnboardingRouteGuard from "./components/OnboardingRouteGuard";

function App() {
  return (
    <PermissionProvider>
      <PreferencesProvider>
        <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          
          {/* Employee Onboarding - Public routes with flow guards */}
          <Route 
            path="/phone-auth" 
            element={
              <OnboardingRouteGuard requiredStep="phone-auth">
                <PhoneAuthenticationPage />
              </OnboardingRouteGuard>
            } 
          />
          <Route 
            path="/account-setup" 
            element={
              <OnboardingRouteGuard requiredStep="account-setup">
                <AccountSetupPage />
              </OnboardingRouteGuard>
            } 
          />
          <Route 
            path="/password-setup" 
            element={
              <OnboardingRouteGuard requiredStep="password-setup">
                <PasswordSetupPage />
              </OnboardingRouteGuard>
            } 
          />

          {/* First Login Password Change - Protected but without Layout */}
          <Route element={<ProtectedRoute />}>
            <Route path="/first-login-password-change" element={<FirstLoginPasswordChange />} />
          </Route>

        {/* Protected Routes with Layout - All Authenticated Users */}
        <Route element={<ProtectedRoute />}>
          {/* Added Chatbot here */}
          <Route element={<><Layout /><Chatbot /></>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/employees" element={<EmployeeManagementPage />} />
            <Route path="/employees/:employeeId" element={<EmployeeDetailsPage />} />

            {/* Profile & Self-Service */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/my-profile" element={<Navigate to="/profile" replace />} />

            {/* My Space Pages */}
            <Route path="/my-team" element={<MyTeamPage />} />
            <Route path="/my-performance" element={<MyPerformancePage />} />
            <Route path="/my-attendance" element={<MyAttendancePage />} />
            <Route path="/my-leave" element={<MyLeavePage />} />

            {/* Attendance & Leave */}
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/leave-tracker" element={<LeaveTrackerPage />} />
            <Route path="/request-leave" element={<RequestLeavePage />} />
            <Route path="/time-tracker" element={<TimeTrackerPage />} />

            {/* Announcements & Resignation */}
            <Route path="/announcement" element={<AnnouncementPage />} />
            <Route path="/resignation" element={<ResignationPage />} />
          </Route>
        </Route>

        {/* Payroll Routes - All authenticated users (filtered by role in component) */}
        <Route element={<ProtectedRoute />}>
          {/* Added Chatbot here */}
          <Route element={<><Layout /><Chatbot /></>}>
            <Route path="/payroll" element={<PayrollPage />} />
            <Route path="/recruitment" element={<RecruitmentPage />} />
            <Route path="/employee-assets" element={<EmployeeAssetsPage />} />
          </Route>
        </Route>

        {/* HR Manager & Super Admin Routes */}
        <Route element={<ProtectedRoute requiredPermission="authentication.manage_employees" />}>
          {/* Added Chatbot here */}
          <Route element={<><Layout /><Chatbot /></>}>
            <Route path="/add-employee" element={<AddEmployeePage />} />
            <Route path="/employees/edit/:employeeId" element={<EditEmployeePage />} />
            <Route path="/requirement-raising" element={<RequirementPage />} />
            <Route path="/post-vacancy" element={<PostVacancyPage />} />
            <Route path="/notes-approvals" element={<NoteManagementPage />} />
            <Route path="/notes-approvals/:noteId" element={<NoteDetailsPage />} />
            <Route path="/run-payroll" element={<RunPayrollPage />} />
          </Route>
        </Route>

        {/* Appraisal Routes - Department Head, HR Manager & Super Admin */}
        <Route element={<ProtectedRoute />}>
          {/* Added Chatbot here */}
          <Route element={<><Layout /><Chatbot /></>}>
            <Route path="/appraisal" element={<AppraisalPage />} />
            <Route path="/appraisal/start/:employeeId" element={<StartReviewPage />} />
            <Route path="/appraisal/report/:employeeId" element={<ViewReportPage />} />
          </Route>
        </Route>

        {/* Admin Routes - Super Admin Only */}
        <Route element={<ProtectedRoute requiredRole="Super Admin" />}>
          {/* Added Chatbot here */}
          <Route element={<><Layout /><Chatbot /></>}>
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/role-management" element={<RoleManagementPage />} />
            <Route path="/audit-logs" element={<AuditLogPage />} />
          </Route>
        </Route>
      </Routes>
        </BrowserRouter>
      </PreferencesProvider>
    </PermissionProvider>
  );
}

export default App;