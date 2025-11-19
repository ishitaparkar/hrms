# UI Component Library

A collection of reusable UI components for the University HRMS system. These components provide consistent styling, dark mode support, and follow accessibility best practices.

## Table of Contents

- [Installation](#installation)
- [Components](#components)
  - [PageHeader](#pageheader)
  - [Card](#card)
  - [Button](#button)
  - [InfoCard](#infocard)
  - [InfoRow](#inforow)
- [Design Tokens](#design-tokens)
- [Best Practices](#best-practices)

## Installation

Import components from the UI library:

```javascript
import { PageHeader, Card, Button, InfoCard, InfoRow } from '../components/ui';
```

Or import individual components:

```javascript
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
```

## Components

### PageHeader

A consistent header component for all pages with title, description, and optional actions.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | string | Yes | - | The main page title |
| `description` | string | No | - | Optional description text below the title |
| `actions` | ReactNode | No | - | Optional action buttons or elements to display on the right |
| `icon` | string | No | - | Optional Material Icons icon name to display before the title |
| `className` | string | No | '' | Optional additional CSS classes |

#### Examples

**Basic Usage:**
```javascript
<PageHeader 
  title="Employee Management" 
  description="Manage all employee records and information"
/>
```

**With Icon:**
```javascript
<PageHeader 
  title="Dashboard" 
  description="Welcome to your dashboard"
  icon="dashboard"
/>
```

**With Actions:**
```javascript
<PageHeader 
  title="Leave Requests" 
  description="Review and approve leave requests"
  actions={
    <>
      <Button variant="secondary" icon="filter_list">Filter</Button>
      <Button variant="primary" icon="add">New Request</Button>
    </>
  }
/>
```

---

### Card

A standardized card component for content display with consistent styling.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | ReactNode | Yes | - | The content to display inside the card |
| `title` | string | No | - | Optional card title |
| `icon` | string | No | - | Optional Material Icons icon name to display before the title |
| `actions` | ReactNode | No | - | Optional action buttons or elements to display in the header |
| `className` | string | No | '' | Optional additional CSS classes |
| `noPadding` | boolean | No | false | If true, removes default padding (useful for tables) |
| `hover` | boolean | No | false | If true, adds hover effect |

#### Examples

**Basic Usage:**
```javascript
<Card>
  <p>This is card content</p>
</Card>
```

**With Title and Icon:**
```javascript
<Card title="Recent Activity" icon="history">
  <ul>
    <li>Activity 1</li>
    <li>Activity 2</li>
  </ul>
</Card>
```

**With Actions:**
```javascript
<Card 
  title="Employee List" 
  icon="people"
  actions={
    <Button variant="outline" size="sm" icon="download">Export</Button>
  }
>
  {/* Employee list content */}
</Card>
```

**No Padding (for tables):**
```javascript
<Card title="Data Table" noPadding>
  <table className="w-full">
    {/* Table content */}
  </table>
</Card>
```

**With Hover Effect:**
```javascript
<Card hover>
  <p>This card has a hover effect</p>
</Card>
```

---

### Button

A standardized button component with multiple variants and sizes.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | ReactNode | No | - | The button content (text, icons, etc.) |
| `variant` | string | No | 'primary' | Button style: 'primary', 'secondary', 'danger', 'success', 'outline' |
| `size` | string | No | 'md' | Button size: 'sm', 'md', 'lg' |
| `icon` | string | No | - | Optional Material Icons icon name |
| `iconPosition` | string | No | 'left' | Icon position: 'left' or 'right' |
| `fullWidth` | boolean | No | false | If true, button takes full width |
| `disabled` | boolean | No | false | If true, button is disabled |
| `type` | string | No | 'button' | Button type: 'button', 'submit', 'reset' |
| `onClick` | function | No | - | Click handler function |
| `to` | string | No | - | If provided, renders as a Link component (react-router-dom) |
| `className` | string | No | '' | Optional additional CSS classes |

#### Examples

**Primary Button:**
```javascript
<Button variant="primary">Save Changes</Button>
```

**Secondary Button:**
```javascript
<Button variant="secondary">Cancel</Button>
```

**Danger Button:**
```javascript
<Button variant="danger">Delete</Button>
```

**Success Button:**
```javascript
<Button variant="success">Approve</Button>
```

**Outline Button:**
```javascript
<Button variant="outline">Learn More</Button>
```

**With Icon:**
```javascript
<Button variant="primary" icon="add">Add Employee</Button>
```

**Icon Only:**
```javascript
<Button variant="primary" icon="edit" />
```

**Icon on Right:**
```javascript
<Button variant="primary" icon="arrow_forward" iconPosition="right">
  Next
</Button>
```

**Different Sizes:**
```javascript
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
```

**Full Width:**
```javascript
<Button fullWidth variant="primary">Submit Form</Button>
```

**As Link (React Router):**
```javascript
<Button to="/employees" variant="primary">View Employees</Button>
```

**Submit Button:**
```javascript
<Button type="submit" variant="primary">Submit</Button>
```

**Disabled:**
```javascript
<Button disabled variant="primary">Processing...</Button>
```

---

### InfoCard

A specialized card component for displaying information sections with a title and icon. Commonly used in profile pages and detail views.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | string | Yes | - | The card title |
| `icon` | string | No | - | Optional Material Icons icon name |
| `children` | ReactNode | Yes | - | The content (typically InfoRow components) |
| `className` | string | No | '' | Optional additional CSS classes |

#### Examples

**Basic Usage:**
```javascript
<InfoCard title="Contact Information" icon="contact_mail">
  <InfoRow icon="email" label="Email" value="john@example.com" />
  <InfoRow icon="phone" label="Phone" value="+1 234 567 8900" />
</InfoCard>
```

**Multiple InfoRows:**
```javascript
<InfoCard title="Job Information" icon="work">
  <InfoRow icon="badge" label="Employee ID" value="EMP001" />
  <InfoRow icon="person" label="Designation" value="Senior Developer" />
  <InfoRow icon="school" label="Department" value="Engineering" />
  <InfoRow icon="calendar_today" label="Joining Date" value="2020-01-15" />
</InfoCard>
```

---

### InfoRow

A component for displaying a single row of information with an icon, label, and value. Typically used inside InfoCard components.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `icon` | string | Yes | - | Material Icons icon name |
| `label` | string | Yes | - | The label text (e.g., "Email", "Phone") |
| `value` | string/ReactNode | Yes | - | The value to display (can be text or React element) |
| `className` | string | No | '' | Optional additional CSS classes |

#### Examples

**Basic Usage:**
```javascript
<InfoRow icon="email" label="Email" value="john@example.com" />
```

**With Badge Value:**
```javascript
<InfoRow 
  icon="work" 
  label="Status" 
  value={
    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
      Active
    </span>
  } 
/>
```

**With Link Value:**
```javascript
<InfoRow 
  icon="link" 
  label="Website" 
  value={<a href="https://example.com" className="text-primary hover:underline">example.com</a>} 
/>
```

---

## Design Tokens

The component library uses the following Tailwind CSS custom classes for consistent theming:

### Colors

**Background:**
- `bg-background-light` / `dark:bg-background-dark` - Page background
- `bg-card-light` / `dark:bg-card-dark` - Card background

**Text:**
- `text-heading-light` / `dark:text-heading-dark` - Headings
- `text-text-light` / `dark:text-text-dark` - Body text
- `text-subtext-light` / `dark:text-subtext-dark` - Secondary text

**Borders:**
- `border-border-light` / `dark:border-border-dark` - Border colors

**Primary:**
- `bg-primary` - Primary color (blue)
- `text-primary` - Primary text color

### Spacing

- Consistent padding: `p-4`, `p-6`
- Consistent gaps: `gap-2`, `gap-4`, `gap-6`
- Consistent margins: `mb-4`, `mb-6`

### Border Radius

- Cards: `rounded-xl`
- Buttons: `rounded-lg`
- Small elements: `rounded-md`, `rounded-full`

---

## Best Practices

### 1. Use Semantic Components

Choose the right component for the job:
- Use `PageHeader` for page titles
- Use `Card` for content sections
- Use `InfoCard` + `InfoRow` for profile-like information displays

### 2. Maintain Consistency

Always use these components instead of creating custom styled divs to ensure consistency across the application.

### 3. Dark Mode Support

All components automatically support dark mode. No additional configuration needed.

### 4. Accessibility

- All buttons have proper focus states
- Icons are decorative and don't interfere with screen readers
- Proper semantic HTML is used throughout

### 5. Responsive Design

Components are responsive by default. Use Tailwind's responsive classes when needed:

```javascript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card>Content 1</Card>
  <Card>Content 2</Card>
  <Card>Content 3</Card>
</div>
```

### 6. Composition

Combine components to create complex layouts:

```javascript
<div>
  <PageHeader 
    title="Employee Profile" 
    actions={<Button variant="primary" icon="edit">Edit</Button>}
  />
  
  <div className="p-6 space-y-6">
    <Card title="Overview" icon="person">
      {/* Overview content */}
    </Card>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <InfoCard title="Contact" icon="contact_mail">
        <InfoRow icon="email" label="Email" value="john@example.com" />
        <InfoRow icon="phone" label="Phone" value="+1 234 567 8900" />
      </InfoCard>
      
      <InfoCard title="Job Info" icon="work">
        <InfoRow icon="badge" label="ID" value="EMP001" />
        <InfoRow icon="person" label="Title" value="Developer" />
      </InfoCard>
    </div>
  </div>
</div>
```

---

## Migration Guide

To migrate existing pages to use the component library:

### Before:
```javascript
<header className="bg-card-light dark:bg-card-dark p-6 border-b border-border-light dark:border-border-dark">
  <h1 className="text-3xl font-bold text-heading-light dark:text-heading-dark">
    Employee Management
  </h1>
  <p className="text-sm text-subtext-light dark:text-subtext-dark mt-1">
    Manage all employee records
  </p>
</header>
```

### After:
```javascript
<PageHeader 
  title="Employee Management" 
  description="Manage all employee records"
/>
```

### Before:
```javascript
<div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-sm">
  <h3 className="text-lg font-semibold text-heading-light dark:text-heading-dark mb-4">
    Recent Activity
  </h3>
  {/* Content */}
</div>
```

### After:
```javascript
<Card title="Recent Activity">
  {/* Content */}
</Card>
```

---

## Real-World Examples

### Unified Profile Page

The unified profile page is a great example of how to compose multiple components together:

```javascript
import React, { useState } from 'react';
import { PageHeader, Card, Button, InfoCard, InfoRow } from '../components/ui';

function ProfilePage() {
  const [activeTab, setActiveTab] = useState('account');

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <PageHeader 
        title="My Profile" 
        description="Manage your account settings and personal information"
        icon="person"
        actions={
          <Button variant="primary" icon="edit">Edit Profile</Button>
        }
      />

      {/* Profile Header */}
      <div className="p-6 bg-card-light dark:bg-card-dark border-b border-border-light dark:border-border-dark">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold">
            JD
          </div>
          <div>
            <h2 className="text-2xl font-bold text-heading-light dark:text-heading-dark">
              John Doe
            </h2>
            <p className="text-subtext-light dark:text-subtext-dark">john.doe@example.com</p>
            <div className="flex gap-2 mt-2">
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                HR Manager
              </span>
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                Employee
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border-light dark:border-border-dark">
        <div className="flex gap-4 px-6">
          <button
            onClick={() => setActiveTab('account')}
            className={`py-4 px-2 border-b-2 font-medium transition-colors ${
              activeTab === 'account'
                ? 'border-primary text-primary'
                : 'border-transparent text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark'
            }`}
          >
            Account Settings
          </button>
          <button
            onClick={() => setActiveTab('employee')}
            className={`py-4 px-2 border-b-2 font-medium transition-colors ${
              activeTab === 'employee'
                ? 'border-primary text-primary'
                : 'border-transparent text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark'
            }`}
          >
            Employee Profile
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6 space-y-6">
        {activeTab === 'account' && (
          <>
            <Card title="Change Password" icon="lock">
              {/* Password change form */}
            </Card>
            <Card title="Two-Factor Authentication" icon="security">
              {/* 2FA settings */}
            </Card>
            <Card title="Login History" icon="history">
              {/* Login history table */}
            </Card>
          </>
        )}

        {activeTab === 'employee' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InfoCard title="Contact Information" icon="contact_mail">
              <InfoRow icon="email" label="Email" value="john.doe@example.com" />
              <InfoRow icon="phone" label="Phone" value="+1 234 567 8900" />
              <InfoRow icon="location_on" label="Address" value="123 Main St, City, State" />
            </InfoCard>

            <InfoCard title="Job Information" icon="work">
              <InfoRow icon="badge" label="Employee ID" value="EMP001" />
              <InfoRow icon="person" label="Designation" value="Senior Developer" />
              <InfoRow icon="school" label="Department" value="Engineering" />
              <InfoRow icon="calendar_today" label="Joining Date" value="2020-01-15" />
            </InfoCard>

            <InfoCard title="Assigned Assets" icon="devices" className="lg:col-span-2">
              <InfoRow icon="laptop" label="Laptop" value="MacBook Pro 16-inch" />
              <InfoRow icon="phone_iphone" label="Phone" value="iPhone 13 Pro" />
            </InfoCard>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
```

### Employee Management Page

Example of a data-heavy page with consistent UI:

```javascript
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button } from '../components/ui';
import axios from 'axios';

function EmployeeManagementPage() {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const response = await axios.get('/api/employees/');
    setEmployees(response.data);
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <PageHeader 
        title="Employee Management" 
        description="Manage all employee records and information"
        icon="people"
        actions={
          <>
            <Button variant="outline" icon="filter_list">Filter</Button>
            <Button variant="secondary" icon="download">Export</Button>
            <Button variant="primary" icon="add" to="/employees/add">
              Add Employee
            </Button>
          </>
        }
      />

      <div className="p-6">
        <Card title="All Employees" icon="people" noPadding>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-subtext-light dark:text-subtext-dark uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-subtext-light dark:text-subtext-dark uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-subtext-light dark:text-subtext-dark uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-subtext-light dark:text-subtext-dark uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-text-light dark:text-text-dark">
                      {employee.employee_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-text-light dark:text-text-dark">
                      {employee.first_name} {employee.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-text-light dark:text-text-dark">
                      {employee.department_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button size="sm" variant="outline" icon="visibility" to={`/employees/${employee.id}`}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default EmployeeManagementPage;
```

---

## Component Development Guidelines

### Creating New Components

When creating new reusable components:

1. **Follow the existing patterns**: Look at existing components for structure and naming
2. **Support dark mode**: Always include dark mode variants
3. **Make it flexible**: Use props for customization
4. **Document thoroughly**: Add JSDoc comments and examples
5. **Test responsiveness**: Ensure it works on all screen sizes

### Example Component Template

```javascript
import React from 'react';
import PropTypes from 'prop-types';

/**
 * ComponentName - Brief description
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - The title
 * @param {ReactNode} props.children - Child elements
 * @param {string} [props.className] - Optional additional CSS classes
 */
function ComponentName({ title, children, className = '' }) {
  return (
    <div className={`
      bg-card-light dark:bg-card-dark 
      border border-border-light dark:border-border-dark 
      rounded-lg p-4
      ${className}
    `}>
      {title && (
        <h3 className="text-lg font-semibold text-heading-light dark:text-heading-dark mb-2">
          {title}
        </h3>
      )}
      <div className="text-text-light dark:text-text-dark">
        {children}
      </div>
    </div>
  );
}

ComponentName.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default ComponentName;
```

---

## Support

For questions or issues with the component library:

- **User Guide**: See `docs/USER_GUIDE_HR_MANAGER.md` for end-user documentation
- **Developer Guide**: See `docs/DEVELOPER_GUIDE_BACKEND.md` for backend integration
- **Design Document**: Refer to `.kiro/specs/hr-manager-improvements/design.md`
- **Contact**: Reach out to the development team for technical support
