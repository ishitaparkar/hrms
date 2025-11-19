# Menu Structure Quick Reference

## Overview

This document provides a quick reference for the new menu structure in the University HRMS system.

---

## Menu Structure by Role

### HR Manager / Super Admin

```
┌─────────────────────────────────────┐
│ 📊 Admin Dashboard                  │
├─────────────────────────────────────┤
│ 📋 Requirement Raising              │
├─────────────────────────────────────┤
│ 👥 Recruitment                      │
├─────────────────────────────────────┤
│ 📝 Notes & Approvals                │
├─────────────────────────────────────┤
│ 👤 My Space ▼                       │
│    ├─ 👤 Profile                    │
│    ├─ 💰 Payroll                    │
│    ├─ 🏢 Assets                     │
│    ├─ 📅 Attendance                 │
│    ├─ 🌴 Leaves                     │
│    ├─ ⏱️ Time Tracker               │
│    └─ ⭐ Performance                │
├─────────────────────────────────────┤
│ 🏢 Employee Management ▼            │
│    ├─ 📋 Staff Directory            │
│    └─ ➕ Add New Staff              │
├─────────────────────────────────────┤
│ 📢 Announcement                     │
├─────────────────────────────────────┤
│ 📤 Resignation Management           │
└─────────────────────────────────────┘
```

### Regular Employee

```
┌─────────────────────────────────────┐
│ 📊 Dashboard                        │
├─────────────────────────────────────┤
│ 👤 My Space ▼                       │
│    ├─ 👤 Profile                    │
│    ├─ 💰 Payroll                    │
│    ├─ 🏢 Assets                     │
│    ├─ 📅 Attendance                 │
│    ├─ 🌴 Leaves                     │
│    ├─ ⏱️ Time Tracker               │
│    └─ ⭐ Performance                │
├─────────────────────────────────────┤
│ 📢 Announcements                    │
└─────────────────────────────────────┘
```

---

## What's in "My Space"?

**My Space** contains all your personal information and self-service functions:

| Menu Item | Description | What You Can Do |
|-----------|-------------|-----------------|
| 👤 **Profile** | Your account and employee profile | View/edit personal info, change password, manage 2FA |
| 💰 **Payroll** | Your salary information | View salary slips, payment history |
| 🏢 **Assets** | Company assets assigned to you | View assigned laptops, phones, equipment |
| 📅 **Attendance** | Your attendance records | Clock in/out, view attendance history |
| 🌴 **Leaves** | Your leave requests | Request leave, view leave balance, track status |
| ⏱️ **Time Tracker** | Your time logs | Track time on tasks, view time reports |
| ⭐ **Performance** | Your performance reviews | View appraisals, feedback, goals |

---

## What's in "Employee Management"?

**Employee Management** contains functions for managing other employees (HR Manager/Admin only):

| Menu Item | Description | What You Can Do |
|-----------|-------------|-----------------|
| 📋 **Staff Directory** | List of all employees | View, search, filter employees; access employee details |
| ➕ **Add New Staff** | Create new employee records | Add new employees to the system |

---

## Profile Page Structure

The unified Profile page has two tabs:

### Tab 1: Account Settings

Manage your account security and preferences:

```
┌─────────────────────────────────────────────┐
│ 🔒 Change Password                          │
│    • Current password                       │
│    • New password                           │
│    • Confirm password                       │
├─────────────────────────────────────────────┤
│ 🔐 Two-Factor Authentication                │
│    • Enable/disable 2FA                     │
│    • QR code for setup                      │
│    • Backup codes                           │
├─────────────────────────────────────────────┤
│ 📜 Login History                            │
│    • Recent login activity                  │
│    • Device information                     │
│    • Location and time                      │
└─────────────────────────────────────────────┘
```

### Tab 2: Employee Profile

View and edit your employee information:

```
┌──────────────────────┬──────────────────────┐
│ 📧 Contact Info      │ 💼 Job Information   │
│  • Email             │  • Employee ID       │
│  • Phone             │  • Designation       │
│  • Address           │  • Department        │
│                      │  • Joining Date      │
├──────────────────────┴──────────────────────┤
│ 🏢 Assigned Assets                          │
│  • Laptop: MacBook Pro 16-inch              │
│  • Phone: iPhone 13 Pro                     │
└─────────────────────────────────────────────┘
```

---

## Navigation Paths

### Common Tasks

| Task | Navigation Path |
|------|----------------|
| View your profile | My Space → Profile |
| Change password | My Space → Profile → Account Settings tab |
| Request leave | My Space → Leaves → Request Leave |
| View salary slip | My Space → Payroll |
| Check attendance | My Space → Attendance |
| View assigned assets | My Space → Assets |
| Track time | My Space → Time Tracker |
| View all employees | Employee Management → Staff Directory |
| Add new employee | Employee Management → Add New Staff |

### URL Mapping

| Old URL | New URL | Status |
|---------|---------|--------|
| `/profile` | `/profile` | ✅ Active |
| `/my-profile` | `/profile` | ↪️ Redirects to `/profile` |
| `/employees` | `/employees` | ✅ Active (Staff Directory) |
| `/employees/add` | `/employees/add` | ✅ Active (Add New Staff) |

---

## Migration Notes

### For Users

**What Changed:**
- "Admin Account" and "My Profile" merged into single "Profile" page
- "Employee" dropdown renamed to "My Space" (for personal items)
- New "Employee Management" dropdown (for managing staff)

**What Stayed the Same:**
- All features are still available
- No data was lost or changed
- Same permissions and access controls
- All URLs still work (old ones redirect)

### For Developers

**Code Changes:**
- `ProfilePage.js` now handles both account and employee profile
- `MyProfilePage.js` deprecated (functionality moved to ProfilePage)
- `Sidebar.js` updated with new menu structure
- Routes updated in `App.js`

**Import Changes:**
- No import changes needed for ProfilePage
- Remove references to MyProfilePage in new code

---

## Visual Comparison

### Before (Old Structure)

```
Employee ▼
├─ Staff Directory
├─ Add New Staff
├─ My Profile          ← Personal item mixed with management
├─ Payroll             ← Personal item mixed with management
└─ Employee Assets     ← Personal item mixed with management

Admin Account          ← Separate from My Profile (confusing!)
```

### After (New Structure)

```
My Space ▼             ← All personal items grouped
├─ Profile             ← Unified account + employee profile
├─ Payroll
├─ Assets
├─ Attendance
├─ Leaves
├─ Time Tracker
└─ Performance

Employee Management ▼  ← Management functions separated
├─ Staff Directory
└─ Add New Staff
```

---

## Benefits of New Structure

### For Users

✅ **Clearer Organization**: Personal items vs management functions clearly separated

✅ **Less Confusion**: Single profile page instead of two separate ones

✅ **Easier Navigation**: Logical grouping makes features easier to find

✅ **Better UX**: Consistent design and intuitive menu structure

### For Developers

✅ **Simpler Code**: One profile component instead of two

✅ **Better Maintainability**: Clear separation of concerns

✅ **Consistent Patterns**: Standardized UI components

✅ **Easier Testing**: Fewer components to test

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt + M` | Open My Space menu |
| `Alt + E` | Open Employee Management menu |
| `Alt + P` | Go to Profile page |
| `Alt + D` | Go to Dashboard |

*Note: Keyboard shortcuts may vary by browser and operating system*

---

## Troubleshooting

### "I can't find My Profile"

**Solution:** It's now called "Profile" and is located under "My Space" → "Profile"

### "Where is the Employee menu?"

**Solution:** It's been split into two menus:
- "My Space" for your personal items
- "Employee Management" for managing staff

### "I don't see Employee Management"

**Solution:** This menu is only visible to HR Managers and Super Admins. Regular employees won't see it.

### "My bookmark doesn't work"

**Solution:** Old bookmarks should automatically redirect. If not, update your bookmark to the new URL structure.

---

## Quick Tips

💡 **Tip 1**: Use "My Space" for anything related to YOU (your profile, your payroll, your leaves)

💡 **Tip 2**: Use "Employee Management" for managing OTHER employees (only if you're HR Manager/Admin)

💡 **Tip 3**: The Profile page has tabs - click between "Account Settings" and "Employee Profile" to see different information

💡 **Tip 4**: All pages now have consistent design - look for the same button styles and card layouts everywhere

💡 **Tip 5**: Dark mode works consistently across all pages - toggle it in your system settings

---

*Last Updated: November 2025*

*For detailed information, see the [HR Manager User Guide](USER_GUIDE_HR_MANAGER.md)*
