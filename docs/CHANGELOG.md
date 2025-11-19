# Changelog

All notable changes to the University HRMS project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - November 2025

### Added

#### User Interface
- **Unified Profile Page**: Merged ProfilePage and MyProfilePage into a single component with tabbed interface
  - Account Settings tab for password, 2FA, and login history
  - Employee Profile tab for contact info, job info, and assets
  - Role badges display in profile header
  - Responsive design with mobile support

- **Reorganized Sidebar Menu**:
  - New "My Space" dropdown for personal items (Profile, Payroll, Assets, Attendance, Leaves, Time Tracker, Performance)
  - Renamed "Employee" to "Employee Management" for HR Manager/Admin
  - Clear separation between personal and management functions
  - Updated icons for better visual distinction

- **UI Component Library**:
  - PageHeader component for consistent page headers
  - Card component for standardized content display
  - Button component with multiple variants (primary, secondary, danger, success, outline)
  - InfoCard and InfoRow components for profile-like displays
  - Full dark mode support across all components
  - Responsive design patterns

#### Backend
- **Module Reorganization**:
  - Created dedicated `employee_management` module for Employee, Department, and Designation models
  - Created dedicated `leave_management` module for LeaveRequest and LeaveType models
  - Improved code organization and maintainability
  - Updated import paths across the codebase

#### Documentation
- **User Documentation**:
  - Comprehensive HR Manager User Guide
  - Menu Structure Quick Reference
  - FAQ section for common questions
  - Navigation guide for common tasks

- **Developer Documentation**:
  - Backend Module Organization Guide
  - API endpoint documentation
  - Testing strategies and examples
  - Migration guide for code updates

- **Component Documentation**:
  - Enhanced UI Component Library documentation
  - Real-world usage examples
  - Component development guidelines
  - Design tokens and theming guide

### Changed

#### User Interface
- **Consistent Design Across All Pages**:
  - Standardized headers on all pages
  - Uniform card components
  - Consistent button styles
  - Improved dark mode support
  - Better responsive layouts

- **Updated Pages**:
  - EmployeeManagementPage.js - Applied consistent UI patterns
  - LeaveTrackerPage.js - Applied consistent UI patterns
  - PayrollPage.js - Applied consistent UI patterns
  - AttendancePage.js - Applied consistent UI patterns
  - TimeTrackerPage.js - Applied consistent UI patterns
  - AppraisalPage.js - Applied consistent UI patterns
  - AnnouncementPage.js - Applied consistent UI patterns
  - ResignationPage.js - Applied consistent UI patterns
  - RecruitmentPage.js - Applied consistent UI patterns
  - EmployeeAssetsPage.js - Applied consistent UI patterns

#### Navigation
- **Route Updates**:
  - `/my-profile` now redirects to `/profile`
  - Unified profile route for all users
  - Backward compatibility maintained

### Deprecated

- **MyProfilePage.js**: Functionality merged into ProfilePage.js
  - Old route `/my-profile` still works (redirects to `/profile`)
  - Component kept for backward compatibility but not actively used

### Fixed

- **UI Consistency Issues**:
  - Fixed dark mode inconsistencies across pages
  - Resolved duplicate menu items in sidebar
  - Improved mobile responsiveness
  - Fixed button style inconsistencies

- **Navigation Issues**:
  - Resolved confusion between "Admin Account" and "My Profile"
  - Fixed menu organization for better UX
  - Improved role-based menu visibility

### Security

- No security changes in this release
- All existing authentication and authorization mechanisms remain in place
- RBAC (Role-Based Access Control) continues to function as before

---

## [1.0.0] - Previous Release

### Initial Features

#### Authentication & Authorization
- User authentication with JWT tokens
- Role-Based Access Control (RBAC)
- Multiple roles: Super Admin, HR Manager, Employee
- Permission-based access to features
- Two-Factor Authentication (2FA)
- Login history tracking

#### Employee Management
- Employee records management
- Department and designation management
- Employee profile with contact and job information
- Asset assignment tracking

#### Leave Management
- Leave request submission
- Leave approval workflow
- Leave balance tracking
- Multiple leave types support

#### Attendance & Time Tracking
- Attendance clock in/out
- Attendance history
- Time tracker for tasks
- Time reports

#### Payroll
- Salary information
- Payroll records
- Payment history

#### Other Features
- Dashboard with overview
- Announcements
- Resignation management
- Recruitment module
- Performance appraisals
- Notes and approvals

---

## Upgrade Guide

### From 1.x to 2.0

#### For End Users

**No action required!** The upgrade is seamless:
- Old bookmarks will automatically redirect
- All features remain accessible
- Menu items have been reorganized for better UX
- Profile page now combines account and employee information

**What to expect:**
1. "My Profile" is now "Profile" under "My Space"
2. "Admin Account" has been merged into "Profile"
3. Personal items are now grouped under "My Space"
4. Employee management functions are under "Employee Management"

#### For Developers

**Frontend Changes:**

1. **Update Profile Page References**:
```javascript
// Old
import MyProfilePage from './pages/MyProfilePage';

// New (if needed)
import ProfilePage from './pages/ProfilePage';
```

2. **Update Sidebar Menu Logic**:
- Review custom sidebar modifications
- Ensure role-based menu visibility works correctly
- Test menu navigation

3. **Update Component Imports**:
```javascript
// New UI components available
import { PageHeader, Card, Button, InfoCard, InfoRow } from './components/ui';
```

**Backend Changes:**

1. **Update Model Imports**:
```python
# Old
from authentication.models import Employee, LeaveRequest

# New
from employee_management.models import Employee
from leave_management.models import LeaveRequest
```

2. **Run Migrations**:
```bash
python manage.py migrate employee_management
python manage.py migrate leave_management
```

3. **Update Tests**:
- Update import statements in tests
- Verify all tests pass after migration

**Testing Checklist:**

- [ ] Profile page loads correctly
- [ ] Both profile tabs work (Account Settings, Employee Profile)
- [ ] Menu navigation works for all roles
- [ ] All pages display consistently
- [ ] Dark mode works across all pages
- [ ] Mobile responsiveness is maintained
- [ ] API endpoints function correctly
- [ ] All tests pass

---

## Future Roadmap

### Planned Features

#### Version 2.1
- [ ] Advanced search and filtering
- [ ] Bulk operations for employee management
- [ ] Export functionality for reports
- [ ] Email notifications
- [ ] Calendar integration

#### Version 2.2
- [ ] Mobile app (React Native)
- [ ] Offline support
- [ ] Push notifications
- [ ] Advanced analytics dashboard

#### Version 3.0
- [ ] Multi-tenant support
- [ ] Advanced reporting engine
- [ ] Integration with external HR systems
- [ ] AI-powered insights
- [ ] Workflow automation

---

## Support

For questions or issues:

- **Users**: See [USER_GUIDE_HR_MANAGER.md](USER_GUIDE_HR_MANAGER.md)
- **Developers**: See [DEVELOPER_GUIDE_BACKEND.md](DEVELOPER_GUIDE_BACKEND.md)
- **Bug Reports**: Contact your system administrator
- **Feature Requests**: Submit through your project management system

---

## Contributors

Thanks to all contributors who made this release possible!

---

*Last Updated: November 2025*
