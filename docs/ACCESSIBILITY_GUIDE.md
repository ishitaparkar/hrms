# Accessibility Guide
## University HRMS - WCAG 2.1 AA Compliance

**Last Updated:** November 17, 2025  
**Target Compliance:** WCAG 2.1 Level AA

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Reference](#quick-reference)
3. [Keyboard Navigation](#keyboard-navigation)
4. [Screen Reader Support](#screen-reader-support)
5. [Color and Contrast](#color-and-contrast)
6. [Focus Management](#focus-management)
7. [ARIA Attributes](#aria-attributes)
8. [Forms and Validation](#forms-and-validation)
9. [Component Guidelines](#component-guidelines)
10. [Testing Checklist](#testing-checklist)

---

## Overview

This guide provides accessibility standards and best practices for developing features in the University HRMS application. All developers must follow these guidelines to ensure WCAG 2.1 Level AA compliance.

### Why Accessibility Matters

- **Legal Compliance**: Many jurisdictions require accessible web applications
- **Inclusive Design**: 15% of the world's population has some form of disability
- **Better UX**: Accessibility improvements benefit all users
- **SEO Benefits**: Semantic HTML and proper structure improve search rankings

---

## Quick Reference

### Essential Accessibility Checklist

✅ **Every Page Must Have:**
- Unique, descriptive page title
- Proper heading hierarchy (h1 → h2 → h3)
- Skip navigation link
- ARIA landmarks (main, navigation, etc.)
- Keyboard accessible interactive elements
- Visible focus indicators
- Sufficient color contrast (4.5:1 for text)

✅ **Every Interactive Element Must Have:**
- Keyboard accessibility (Tab, Enter, Space)
- Visible focus indicator
- Descriptive label or aria-label
- Appropriate ARIA attributes

✅ **Every Form Must Have:**
- Associated labels for inputs
- Error messages with aria-invalid
- Clear validation feedback
- Keyboard accessible controls

---

## Keyboard Navigation

### Requirements

All functionality must be accessible via keyboard alone.

### Standard Keyboard Patterns

| Key | Action |
|-----|--------|
| `Tab` | Move focus forward |
| `Shift + Tab` | Move focus backward |
| `Enter` | Activate buttons, links, submit forms |
| `Space` | Activate buttons, toggle checkboxes |
| `Escape` | Close modals, cancel operations |
| `Arrow Keys` | Navigate within components (dropdowns, tabs) |

### Implementation

#### Skip Navigation Link

Every page layout must include a skip link:

```javascript
// Layout.js
<a 
  href="#main-content" 
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded"
>
  Skip to main content
</a>

<main id="main-content" role="main">
  {/* Page content */}
</main>
```

#### Dropdown Keyboard Navigation

```javascript
const Dropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleKeyDown = (e) => {
    switch(e.key) {
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        // Move to next item
        break;
      case 'ArrowUp':
        // Move to previous item
        break;
    }
  };
  
  return (
    <button
      aria-expanded={isOpen}
      aria-haspopup="true"
      onKeyDown={handleKeyDown}
    >
      Menu
    </button>
  );
};
```

#### Modal Focus Trap

```javascript
// Use react-focus-lock or implement custom focus trap
import FocusLock from 'react-focus-lock';

const Modal = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <FocusLock>
      <div role="dialog" aria-modal="true">
        {children}
      </div>
    </FocusLock>
  );
};
```

---

## Screen Reader Support

### Semantic HTML

Always use semantic HTML elements:

```javascript
// ✅ Good
<nav>
  <ul>
    <li><a href="/dashboard">Dashboard</a></li>
  </ul>
</nav>

<main>
  <article>
    <h1>Page Title</h1>
    <section>
      <h2>Section Title</h2>
    </section>
  </article>
</main>

// ❌ Bad
<div className="nav">
  <div className="link">Dashboard</div>
</div>
```

### ARIA Landmarks

Use ARIA landmarks to define page regions:

```javascript
<div className="app">
  <header role="banner">
    {/* Site header */}
  </header>
  
  <nav role="navigation" aria-label="Main navigation">
    {/* Navigation menu */}
  </nav>
  
  <main role="main" id="main-content">
    {/* Main content */}
  </main>
  
  <aside role="complementary" aria-label="Related information">
    {/* Sidebar content */}
  </aside>
  
  <footer role="contentinfo">
    {/* Site footer */}
  </footer>
</div>
```

### Hiding Decorative Content

Hide decorative icons from screen readers:

```javascript
// ✅ Good - Icon is decorative
<button aria-label="Edit employee">
  <span className="material-icons" aria-hidden="true">edit</span>
</button>

// ✅ Good - Icon with text
<button>
  <span className="material-icons" aria-hidden="true">save</span>
  Save Changes
</button>

// ❌ Bad - Screen reader announces "edit" twice
<button aria-label="Edit employee">
  <span className="material-icons">edit</span>
</button>
```

### Live Regions

Announce dynamic content changes:

```javascript
const FormComponent = () => {
  const [statusMessage, setStatusMessage] = useState('');
  
  const handleSubmit = async () => {
    try {
      await saveData();
      setStatusMessage('Changes saved successfully');
    } catch (error) {
      setStatusMessage('Error saving changes');
    }
  };
  
  return (
    <>
      <form onSubmit={handleSubmit}>
        {/* Form fields */}
      </form>
      
      {/* Screen reader announcement */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {statusMessage}
      </div>
      
      {/* Visual message */}
      {statusMessage && (
        <div className="alert">{statusMessage}</div>
      )}
    </>
  );
};
```

---

## Color and Contrast

### WCAG AA Requirements

- **Normal text**: 4.5:1 contrast ratio
- **Large text** (18pt+ or 14pt+ bold): 3:1 contrast ratio
- **UI components**: 3:1 contrast ratio
- **Graphical objects**: 3:1 contrast ratio

### Testing Tools

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Chrome DevTools (Lighthouse)
- axe DevTools browser extension

### Color Usage

Never rely on color alone to convey information:

```javascript
// ❌ Bad - Only color indicates status
<span className="text-green-500">Approved</span>
<span className="text-red-500">Rejected</span>

// ✅ Good - Icon + color + text
<span className="text-green-500">
  <span className="material-icons" aria-hidden="true">check_circle</span>
  Approved
</span>
<span className="text-red-500">
  <span className="material-icons" aria-hidden="true">cancel</span>
  Rejected
</span>
```

### Theme Colors

Our application supports light and dark modes. Ensure sufficient contrast in both:

```css
/* Light mode */
.text-primary {
  color: #1173d4; /* Contrast ratio: 4.5:1 on white */
}

/* Dark mode */
.dark .text-primary {
  color: #60a5fa; /* Contrast ratio: 4.5:1 on dark background */
}
```

---

## Focus Management

### Focus Indicators

All interactive elements must have visible focus indicators:

```css
/* Global focus styles (already in index.css) */
*:focus-visible {
  outline: 2px solid #1173d4;
  outline-offset: 2px;
  border-radius: 2px;
}

.dark *:focus-visible {
  outline-color: #60a5fa;
}

/* Remove outline for mouse users */
*:focus:not(:focus-visible) {
  outline: none;
}
```

### Focus Order

Tab order must follow logical reading order:

```javascript
// ✅ Good - DOM order matches visual order
<div>
  <button>First</button>
  <button>Second</button>
  <button>Third</button>
</div>

// ❌ Bad - Using tabindex to change order
<div>
  <button tabindex="3">First</button>
  <button tabindex="1">Second</button>
  <button tabindex="2">Third</button>
</div>
```

### Managing Focus

```javascript
// Focus management after actions
const handleDelete = async (id) => {
  await deleteItem(id);
  
  // Return focus to a logical element
  document.getElementById('item-list').focus();
};

// Focus first error on validation
const handleSubmit = (e) => {
  e.preventDefault();
  const errors = validate(formData);
  
  if (errors.length > 0) {
    // Focus first error field
    document.getElementById(errors[0].field).focus();
  }
};
```

---

## ARIA Attributes

### Common ARIA Attributes

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `aria-label` | Provides accessible name | `<button aria-label="Close">×</button>` |
| `aria-labelledby` | References element(s) for label | `<div aria-labelledby="title">` |
| `aria-describedby` | References description | `<input aria-describedby="help-text">` |
| `aria-hidden` | Hides from screen readers | `<span aria-hidden="true">★</span>` |
| `aria-live` | Announces dynamic changes | `<div aria-live="polite">` |
| `aria-expanded` | Indicates expanded state | `<button aria-expanded="false">` |
| `aria-current` | Indicates current item | `<a aria-current="page">` |
| `aria-invalid` | Indicates validation error | `<input aria-invalid="true">` |

### Button Labels

```javascript
// ✅ Good - Text button
<button>Save Changes</button>

// ✅ Good - Icon button with aria-label
<button aria-label="Edit employee">
  <span className="material-icons" aria-hidden="true">edit</span>
</button>

// ✅ Good - Icon + text button
<button>
  <span className="material-icons" aria-hidden="true">delete</span>
  Delete
</button>

// ❌ Bad - Icon button without label
<button>
  <span className="material-icons">edit</span>
</button>
```

### Dropdown Menus

```javascript
<button
  aria-expanded={isOpen}
  aria-haspopup="true"
  aria-controls="dropdown-menu"
  onClick={() => setIsOpen(!isOpen)}
>
  Options
</button>

<ul
  id="dropdown-menu"
  role="menu"
  hidden={!isOpen}
>
  <li role="menuitem">
    <button>Option 1</button>
  </li>
</ul>
```

### Navigation

```javascript
<nav aria-label="Main navigation">
  <ul>
    <li>
      <NavLink 
        to="/dashboard"
        aria-current={isActive ? "page" : undefined}
      >
        Dashboard
      </NavLink>
    </li>
  </ul>
</nav>
```

---

## Forms and Validation

### Form Labels

Every input must have an associated label:

```javascript
// ✅ Good - Explicit label
<div>
  <label htmlFor="email">Email Address</label>
  <input id="email" type="email" />
</div>

// ✅ Good - Implicit label
<label>
  Email Address
  <input type="email" />
</label>

// ❌ Bad - No label
<input type="email" placeholder="Email" />
```

### Error Handling

```javascript
const FormField = ({ id, label, error, ...props }) => {
  const errorId = `${id}-error`;
  
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};
```

### Required Fields

```javascript
// ✅ Good - Multiple indicators
<label htmlFor="name">
  Name <span aria-label="required">*</span>
</label>
<input
  id="name"
  required
  aria-required="true"
/>

// Visual indicator in CSS
label:has(+ input[required])::after {
  content: " *";
  color: red;
}
```

### Form Submission

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  setStatusMessage('');
  
  try {
    await submitForm(formData);
    setStatusMessage('Form submitted successfully');
    // Announce to screen readers
  } catch (error) {
    setStatusMessage('Error submitting form. Please try again.');
    // Focus first error field
  } finally {
    setIsSubmitting(false);
  }
};

return (
  <form onSubmit={handleSubmit}>
    {/* Form fields */}
    
    <button 
      type="submit" 
      disabled={isSubmitting}
      aria-busy={isSubmitting}
    >
      {isSubmitting ? 'Submitting...' : 'Submit'}
    </button>
    
    <div role="status" aria-live="polite" className="sr-only">
      {statusMessage}
    </div>
  </form>
);
```

---

## Component Guidelines

### Page Component Template

```javascript
import React from 'react';
import usePageTitle from '../hooks/usePageTitle';
import { PageHeader } from '../components/ui';

const MyPage = () => {
  // Set page title
  usePageTitle('Page Name');
  
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Page Name"
        description="Page description"
        icon="dashboard"
        actions={
          <button aria-label="Add new item">
            <span className="material-icons" aria-hidden="true">add</span>
          </button>
        }
      />
      
      <div className="p-4 md:p-8">
        {/* Page content */}
      </div>
    </div>
  );
};

export default MyPage;
```

### Card Component

```javascript
import { InfoCard } from '../components/ui';

<InfoCard title="Section Title" icon="info">
  {/* Card content */}
</InfoCard>
```

### Button Component

```javascript
// Text button
<button className="btn-primary">
  Save Changes
</button>

// Icon button
<button 
  className="btn-icon"
  aria-label="Edit employee record"
>
  <span className="material-icons" aria-hidden="true">edit</span>
</button>

// Icon + text button
<button className="btn-primary">
  <span className="material-icons" aria-hidden="true">save</span>
  Save Changes
</button>
```

### Table Component

```javascript
<table>
  <caption className="sr-only">Employee List</caption>
  <thead>
    <tr>
      <th scope="col">Name</th>
      <th scope="col">Department</th>
      <th scope="col">Actions</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>John Doe</td>
      <td>Engineering</td>
      <td>
        <button aria-label="Edit John Doe">
          <span className="material-icons" aria-hidden="true">edit</span>
        </button>
      </td>
    </tr>
  </tbody>
</table>
```

---

## Testing Checklist

### Automated Testing

#### Install Testing Tools

```bash
npm install --save-dev jest-axe @testing-library/react
```

#### Example Test

```javascript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import MyComponent from './MyComponent';

expect.extend(toHaveNoViolations);

test('should not have accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Manual Testing

#### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Activate buttons with Enter and Space
- [ ] Navigate dropdowns with arrow keys
- [ ] Close modals with Escape
- [ ] Use skip navigation link
- [ ] Verify no keyboard traps

#### Screen Reader Testing
- [ ] Test with NVDA (Windows) or VoiceOver (Mac)
- [ ] Verify all images have alt text
- [ ] Verify form labels are announced
- [ ] Verify button purposes are clear
- [ ] Verify page structure is logical
- [ ] Verify status messages are announced

#### Visual Testing
- [ ] Test at 200% browser zoom
- [ ] Test with Windows High Contrast mode
- [ ] Verify focus indicators are visible
- [ ] Check color contrast with tools
- [ ] Test in both light and dark modes

#### Browser Testing
- [ ] Chrome + ChromeVox
- [ ] Firefox + NVDA
- [ ] Safari + VoiceOver
- [ ] Edge + Narrator

### Browser Extensions

- **axe DevTools**: Automated accessibility testing
- **WAVE**: Visual accessibility evaluation
- **Lighthouse**: Built into Chrome DevTools
- **Color Contrast Analyzer**: Check contrast ratios

---

## Resources

### WCAG Guidelines
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM WCAG Checklist](https://webaim.org/standards/wcag/checklist)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

### ARIA Documentation
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [MDN ARIA Documentation](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)

### Screen Readers
- [NVDA Download](https://www.nvaccess.org/download/)
- [VoiceOver User Guide](https://support.apple.com/guide/voiceover/welcome/mac)

---

## Support

For accessibility questions or issues, please:
1. Review this guide
2. Check the [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
3. Test with automated tools (axe, Lighthouse)
4. Contact the development team

---

**Remember**: Accessibility is not optional. It's a requirement for all features in the University HRMS application.
