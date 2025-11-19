# University HRMS Documentation

Welcome to the University HRMS documentation. This directory contains comprehensive guides for users, developers, and administrators.

## Table of Contents

- [User Documentation](#user-documentation)
- [Developer Documentation](#developer-documentation)
- [Component Documentation](#component-documentation)
- [Quick Reference](#quick-reference)
- [Quick Links](#quick-links)

---

## User Documentation

### HR Manager User Guide

**File:** `USER_GUIDE_HR_MANAGER.md`

Comprehensive guide for HR Managers covering:
- New menu structure and navigation
- Unified profile page usage
- Managing personal information
- Employee management functions
- UI improvements and features
- Frequently asked questions

**Target Audience:** HR Managers, Super Admins, End Users

**Topics Covered:**
- Menu organization ("My Space" vs "Employee Management")
- Profile page with Account Settings and Employee Profile tabs
- Navigation guide for common tasks
- Dark mode and responsive design
- Troubleshooting and FAQs

---

## Developer Documentation

### Backend Module Organization Guide

**File:** `DEVELOPER_GUIDE_BACKEND.md`

Technical guide for backend developers covering:
- Module structure and organization
- Employee Management module
- Leave Management module
- API design and best practices
- Testing strategies
- Migration guide

**Target Audience:** Backend Developers, System Architects

**Topics Covered:**
- Django app structure
- Model definitions and relationships
- API endpoints and serializers
- Import patterns and dependencies
- Unit and integration testing
- Troubleshooting common issues

---

## Quick Reference

### Menu Structure Quick Reference

**File:** `MENU_STRUCTURE_REFERENCE.md`

Quick reference guide for the new menu structure:
- Visual menu layouts by role
- "My Space" vs "Employee Management" breakdown
- Profile page structure
- Navigation paths for common tasks
- URL mapping and redirects
- Visual comparisons (before/after)
- Troubleshooting tips

**Target Audience:** All Users

**Topics Covered:**
- Menu structure diagrams
- Feature location guide
- Quick navigation tips
- Common troubleshooting

### Changelog

**File:** `CHANGELOG.md`

Complete history of changes to the system:
- Version history
- New features and improvements
- Bug fixes and deprecations
- Upgrade guides
- Future roadmap

**Target Audience:** All Users, Developers, Project Managers

**Topics Covered:**
- Release notes
- Breaking changes
- Migration guides
- Planned features

---

## Component Documentation

### UI Component Library

**File:** `frontend/src/components/ui/README.md`

Complete reference for the UI component library:
- PageHeader component
- Card component
- Button component
- InfoCard and InfoRow components
- Design tokens and theming
- Real-world examples
- Component development guidelines

**Target Audience:** Frontend Developers, UI/UX Designers

**Topics Covered:**
- Component API and props
- Usage examples
- Design system tokens
- Dark mode support
- Responsive design patterns
- Best practices and patterns

### Additional Component Documentation

**Permission Context:**
- File: `frontend/src/contexts/README.md`
- Role-based access control in React
- Authentication state management
- Permission checking utilities

---

## Quick Links

### For End Users

- **Getting Started**: Read the [HR Manager User Guide](USER_GUIDE_HR_MANAGER.md)
- **Menu Navigation**: See [Menu Structure Quick Reference](MENU_STRUCTURE_REFERENCE.md)
- **Profile Page**: Learn about the [Unified Profile](USER_GUIDE_HR_MANAGER.md#unified-profile-page)
- **FAQs**: Check [Frequently Asked Questions](USER_GUIDE_HR_MANAGER.md#frequently-asked-questions)
- **What's New**: See [Changelog](CHANGELOG.md)

### For Developers

- **Backend Setup**: See [Backend Module Organization](DEVELOPER_GUIDE_BACKEND.md)
- **Frontend Components**: Read [UI Component Library](../frontend/src/components/ui/README.md)
- **API Reference**: Check [API Endpoints](DEVELOPER_GUIDE_BACKEND.md#api-endpoints)
- **Testing**: See [Testing Strategies](DEVELOPER_GUIDE_BACKEND.md#testing)

### For Designers

- **Design System**: See [Design Tokens](../frontend/src/components/ui/README.md#design-tokens)
- **Component Examples**: Check [Real-World Examples](../frontend/src/components/ui/README.md#real-world-examples)
- **UI Patterns**: Review [Best Practices](../frontend/src/components/ui/README.md#best-practices)

---

## Project Structure

```
university-hrms/
├── backend/                          # Django backend
│   ├── authentication/               # Auth and RBAC
│   ├── employee_management/          # Employee models
│   ├── leave_management/             # Leave models
│   ├── hrms_core/                    # Project settings
│   └── ...
├── frontend/                         # React frontend
│   ├── src/
│   │   ├── components/               # React components
│   │   │   └── ui/                   # UI component library
│   │   ├── contexts/                 # React contexts
│   │   ├── pages/                    # Page components
│   │   └── ...
│   └── ...
├── docs/                             # Documentation (this directory)
│   ├── README.md                     # This file
│   ├── USER_GUIDE_HR_MANAGER.md      # User guide
│   └── DEVELOPER_GUIDE_BACKEND.md    # Developer guide
└── .kiro/specs/                      # Feature specifications
    └── hr-manager-improvements/
        ├── requirements.md           # Requirements document
        ├── design.md                 # Design document
        └── tasks.md                  # Implementation tasks
```

---

## Recent Updates

### Version 2.0 (November 2025)

**Major Features:**
- ✅ Unified Profile page with tabbed interface
- ✅ Reorganized sidebar menu ("My Space" and "Employee Management")
- ✅ Consistent UI design across all pages
- ✅ Enhanced dark mode support
- ✅ Improved responsive design
- ✅ Reusable UI component library
- ✅ Backend module reorganization

**Documentation Updates:**
- Added comprehensive HR Manager User Guide
- Created Backend Module Organization Guide
- Enhanced UI Component Library documentation
- Added real-world component examples
- Created documentation index (this file)

---

## Contributing

### Documentation Guidelines

When updating documentation:

1. **Keep it current**: Update docs when features change
2. **Be clear and concise**: Use simple language and examples
3. **Include examples**: Show, don't just tell
4. **Use proper formatting**: Follow Markdown best practices
5. **Add screenshots**: Visual aids help understanding (when applicable)
6. **Test examples**: Ensure code examples actually work
7. **Update the index**: Add new docs to this README

### Documentation Structure

Each documentation file should include:
- Clear title and overview
- Table of contents (for longer docs)
- Organized sections with headers
- Code examples where applicable
- Links to related documentation
- Last updated date

---

## Getting Help

### For Users

1. Check the [User Guide](USER_GUIDE_HR_MANAGER.md)
2. Review the [FAQs](USER_GUIDE_HR_MANAGER.md#frequently-asked-questions)
3. Contact your system administrator
4. Contact HR department for policy questions

### For Developers

1. Review the relevant developer guide
2. Check the component documentation
3. Look at code examples in the docs
4. Review the design specifications in `.kiro/specs/`
5. Contact the development team

### Support Channels

- **Technical Issues**: Contact IT Support
- **Feature Requests**: Submit through your project management system
- **Bug Reports**: Use your issue tracking system
- **Documentation Issues**: Contact the documentation team

---

## Additional Resources

### External Documentation

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Material Icons](https://fonts.google.com/icons)

### Internal Resources

- **Design Specifications**: `.kiro/specs/hr-manager-improvements/`
- **Backend README**: `backend/authentication/README_RBAC.md`
- **Frontend README**: `frontend/README.md`
- **Component Examples**: `frontend/src/components/ui/EXAMPLES.md`

---

## Changelog

### November 2025

- Created comprehensive documentation structure
- Added HR Manager User Guide
- Added Backend Module Organization Guide
- Enhanced UI Component Library documentation
- Created Menu Structure Quick Reference
- Added Changelog with version history
- Created documentation index

### Future Plans

- Add API documentation with Swagger/OpenAPI
- Create video tutorials for common tasks
- Add troubleshooting guides
- Create onboarding documentation for new developers
- Add deployment and infrastructure documentation
- Add screenshots and diagrams to user guide

---

*Last Updated: November 2025*

*For questions or suggestions about this documentation, please contact the development team.*
