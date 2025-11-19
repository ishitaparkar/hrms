# Profile Enhancements API Documentation

## Overview

This document provides technical documentation for the Profile & My Space Enhancements APIs. These endpoints enable employee self-service features including document management, preferences, team information, performance tracking, attendance monitoring, and leave management.

## Base URL

```
http://localhost:8000/api
```

## Authentication

All endpoints require authentication using Token Authentication.

**Header:**
```
Authorization: Token <your-token-here>
```

## API Endpoints

### 1. Employee Documents API

#### Get Employee Documents

Retrieve all documents for a specific employee, grouped by category.

**Endpoint:** `GET /employees/{employee_id}/documents/`

**Parameters:**
- `employee_id` (path): The ID of the employee

**Response:** `200 OK`

```json
{
  "documents": [
    {
      "id": 1,
      "name": "Passport Copy",
      "category": "Personal",
      "file_type": "PDF",
      "file_size": 2048576,
      "upload_date": "2025-01-15T10:30:00Z",
      "status": "Verified",
      "download_url": "/api/employees/1/documents/1/download/"
    }
  ],
  "documents_by_category": {
    "Personal": [...],
    "Employment": [...],
    "Certificates": [...]
  }
}
```

**Permissions:**
- Employee can view their own documents
- HR Manager can view any employee's documents
- Department Head can view documents of employees in their department

#### Download Document

Download a specific document file.

**Endpoint:** `GET /employees/{employee_id}/documents/{document_id}/download/`

**Parameters:**
- `employee_id` (path): The ID of the employee
- `document_id` (path): The ID of the document

**Response:** `200 OK`
- Content-Type: application/pdf (or appropriate file type)
- Content-Disposition: attachment; filename="document_name.pdf"

**Error Responses:**
- `404 Not Found`: Document does not exist
- `403 Forbidden`: User doesn't have permission to access document

---

### 2. User Preferences API

#### Get User Preferences

Retrieve the current user's preferences. Creates default preferences if none exist.

**Endpoint:** `GET /auth/preferences/`

**Response:** `200 OK`

```json
{
  "id": 1,
  "email_notifications": true,
  "sms_notifications": false,
  "push_notifications": true,
  "theme": "system",
  "language": "en",
  "timezone": "UTC",
  "updated_at": "2025-11-18T14:30:00Z"
}
```

**Default Values:**
- `email_notifications`: true
- `sms_notifications`: false
- `push_notifications`: true
- `theme`: "system"
- `language`: "en"
- `timezone`: "UTC"

#### Update User Preferences

Update the current user's preferences (partial update supported).

**Endpoint:** `PATCH /auth/preferences/`

**Request Body:**

```json
{
  "email_notifications": false,
  "theme": "dark"
}
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "email_notifications": false,
  "sms_notifications": false,
  "push_notifications": true,
  "theme": "dark",
  "language": "en",
  "timezone": "UTC",
  "updated_at": "2025-11-18T14:35:00Z"
}
```

**Validation:**
- `theme`: Must be one of ["light", "dark", "system"]
- `language`: Must be a valid language code
- `timezone`: Must be a valid timezone string

**Error Responses:**
- `400 Bad Request`: Invalid field values
- `401 Unauthorized`: User not authenticated

---

### 3. My Team API

#### Get My Team

Retrieve the current user's manager and team members.

**Endpoint:** `GET /employees/my-team/`

**Response:** `200 OK`

```json
{
  "manager": {
    "id": 5,
    "first_name": "John",
    "last_name": "Manager",
    "designation": "Senior Manager",
    "email": "john.manager@company.com",
    "phone": "+1-555-1234",
    "profile_image": "/media/profiles/john.jpg",
    "department": "Engineering"
  },
  "department": "Engineering",
  "team_members": [
    {
      "id": 10,
      "first_name": "Jane",
      "last_name": "Developer",
      "designation": "Software Developer",
      "email": "jane.dev@company.com",
      "phone": "+1-555-5678",
      "profile_image": "/media/profiles/jane.jpg"
    }
  ],
  "team_count": 8
}
```

**Notes:**
- Returns employees in the same department as the current user
- Manager is determined by the reporting structure
- Current user is excluded from team_members list
- Returns empty arrays if no manager or team members found

---

### 4. My Performance API

#### Get My Performance

Retrieve the current user's performance data including appraisals, goals, achievements, and training.

**Endpoint:** `GET /performance/my-performance/`

**Response:** `200 OK`

```json
{
  "appraisals": [
    {
      "id": 1,
      "rating": 4.5,
      "date": "2025-06-30",
      "reviewer": "John Manager",
      "comments": "Excellent performance",
      "period_start": "2025-01-01",
      "period_end": "2025-06-30"
    }
  ],
  "goals": [
    {
      "id": 1,
      "title": "Complete Project X",
      "description": "Deliver project by Q2",
      "target_date": "2025-06-30",
      "completion_percentage": 75,
      "status": "In Progress",
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "achievements": [
    {
      "id": 1,
      "title": "Employee of the Month",
      "description": "Outstanding contribution",
      "date": "2025-03-01",
      "awarded_by": "HR Department"
    }
  ],
  "trainings": [
    {
      "id": 1,
      "course_name": "Advanced Python",
      "completion_date": "2025-02-15",
      "certificate_url": "/media/certificates/python.pdf",
      "provider": "Tech Academy"
    }
  ]
}
```

**Notes:**
- Returns only data for the authenticated user
- Appraisals are ordered by date (most recent first)
- Goals include progress tracking
- Empty arrays returned if no data exists

---

### 5. My Attendance API

#### Get My Attendance

Retrieve the current user's attendance records and summary for a specific month.

**Endpoint:** `GET /attendance/my-attendance/`

**Query Parameters:**
- `month` (optional): Month in format YYYY-MM (defaults to current month)

**Example:** `GET /attendance/my-attendance/?month=2025-11`

**Response:** `200 OK`

```json
{
  "summary": {
    "month": "2025-11",
    "total_days": 22,
    "present_days": 20,
    "absent_days": 1,
    "late_days": 1,
    "attendance_percentage": 90.91
  },
  "records": [
    {
      "date": "2025-11-01",
      "check_in": "09:00:00",
      "check_out": "17:30:00",
      "status": "Present",
      "work_hours": 8.5,
      "notes": ""
    },
    {
      "date": "2025-11-02",
      "check_in": "09:15:00",
      "check_out": "17:30:00",
      "status": "Late",
      "work_hours": 8.25,
      "notes": "Traffic delay"
    }
  ]
}
```

**Status Values:**
- `Present`: On time
- `Late`: Arrived after scheduled time
- `Absent`: Did not check in
- `Half Day`: Worked less than required hours

**Calculations:**
- `attendance_percentage`: (present_days / total_days) * 100
- `work_hours`: Difference between check_out and check_in
- `total_days`: Working days in the month (excludes weekends/holidays)

---

### 6. My Leave API

#### Get My Leave Data

Retrieve the current user's leave balances, requests, and upcoming holidays.

**Endpoint:** `GET /my-leave/`

**Response:** `200 OK`

```json
{
  "balances": [
    {
      "leave_type": "Casual",
      "total": 12,
      "used": 3,
      "remaining": 9
    },
    {
      "leave_type": "Sick",
      "total": 10,
      "used": 2,
      "remaining": 8
    },
    {
      "leave_type": "Vacation",
      "total": 15,
      "used": 5,
      "remaining": 10
    }
  ],
  "requests": [
    {
      "id": 1,
      "leave_type": "Casual",
      "start_date": "2025-12-20",
      "end_date": "2025-12-22",
      "days": 3,
      "reason": "Personal work",
      "status": "Pending",
      "applied_date": "2025-11-15",
      "approved_by": null,
      "approved_date": null
    }
  ],
  "holidays": [
    {
      "id": 1,
      "name": "Christmas",
      "date": "2025-12-25",
      "description": "Christmas Day"
    }
  ]
}
```

#### Create Leave Request

Submit a new leave request.

**Endpoint:** `POST /my-leave/`

**Request Body:**

```json
{
  "leave_type": "Casual",
  "start_date": "2025-12-20",
  "end_date": "2025-12-22",
  "reason": "Personal work"
}
```

**Response:** `201 Created`

```json
{
  "id": 2,
  "leave_type": "Casual",
  "start_date": "2025-12-20",
  "end_date": "2025-12-22",
  "days": 3,
  "reason": "Personal work",
  "status": "Pending",
  "applied_date": "2025-11-18",
  "approved_by": null,
  "approved_date": null
}
```

**Validation Rules:**
- `start_date` must be in the future
- `end_date` must be after or equal to `start_date`
- User must have sufficient leave balance
- `leave_type` must be valid (Casual, Sick, Vacation)
- `reason` is required and must be at least 10 characters

**Error Responses:**

`400 Bad Request` - Validation errors:
```json
{
  "leave_type": ["Insufficient leave balance. You have 2 days remaining."],
  "end_date": ["End date must be after start date."],
  "start_date": ["Start date cannot be in the past."]
}
```

---

## Data Models

### EmployeeDocument

```python
{
  "id": Integer,
  "employee": ForeignKey(Employee),
  "name": String(255),
  "category": Choice["Personal", "Employment", "Certificates"],
  "file": FileField,
  "file_type": String(50),
  "file_size": Integer (bytes),
  "upload_date": DateTime,
  "status": Choice["Verified", "Pending", "Expired"],
  "uploaded_by": ForeignKey(User)
}
```

### UserPreferences

```python
{
  "id": Integer,
  "user": OneToOneField(User),
  "email_notifications": Boolean,
  "sms_notifications": Boolean,
  "push_notifications": Boolean,
  "theme": Choice["light", "dark", "system"],
  "language": String(10),
  "timezone": String(50),
  "updated_at": DateTime
}
```

### AttendanceRecord

```python
{
  "id": Integer,
  "employee": ForeignKey(Employee),
  "date": Date,
  "check_in": Time,
  "check_out": Time,
  "status": Choice["Present", "Absent", "Late", "Half Day"],
  "work_hours": Decimal(4, 2),
  "notes": Text
}
```

### LeaveRequest

```python
{
  "id": Integer,
  "employee": ForeignKey(Employee),
  "leave_type": Choice["Casual", "Sick", "Vacation"],
  "start_date": Date,
  "end_date": Date,
  "days": Integer (calculated),
  "reason": Text,
  "status": Choice["Pending", "Approved", "Rejected"],
  "applied_date": DateTime,
  "approved_by": ForeignKey(User, null=True),
  "approved_date": DateTime(null=True)
}
```

## Error Handling

### Standard Error Response Format

```json
{
  "detail": "Error message",
  "error_type": "ErrorType",
  "status_code": 400
}
```

### Common HTTP Status Codes

- `200 OK`: Successful GET/PATCH request
- `201 Created`: Successful POST request
- `400 Bad Request`: Validation error or invalid data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Rate Limiting

No rate limiting is currently implemented, but consider implementing for production:
- 100 requests per minute per user
- 1000 requests per hour per user

## Testing

### Running Tests

```bash
# Run all tests
python manage.py test

# Run specific test file
python manage.py test authentication.test_preferences

# Run with coverage
coverage run --source='.' manage.py test
coverage report
```

### Test Data Setup

```bash
# Create test users and data
python manage.py setup_users
python manage.py setup_leave_data
```

## Frontend Integration

### Example: Fetching User Preferences

```javascript
import axios from 'axios';

const fetchPreferences = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('/api/auth/preferences/', {
      headers: {
        'Authorization': `Token ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching preferences:', error);
    throw error;
  }
};
```

### Example: Submitting Leave Request

```javascript
const submitLeaveRequest = async (leaveData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post('/api/my-leave/', leaveData, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      // Handle validation errors
      console.error('Validation errors:', error.response.data);
    }
    throw error;
  }
};
```

## Security Considerations

1. **Authentication**: All endpoints require valid authentication token
2. **Authorization**: Users can only access their own data (except HR/managers)
3. **File Upload**: Document uploads should validate file types and sizes
4. **Input Validation**: All user inputs are validated on the backend
5. **SQL Injection**: Django ORM protects against SQL injection
6. **XSS Protection**: Django templates auto-escape output

## Performance Optimization

1. **Database Queries**: Use `select_related()` and `prefetch_related()` to reduce queries
2. **Caching**: Consider caching frequently accessed data (preferences, team info)
3. **Pagination**: Implement pagination for large datasets (attendance records, leave history)
4. **File Storage**: Use cloud storage (S3) for document files in production

## Changelog

### Version 1.0 (November 2025)
- Initial release of Profile Enhancements APIs
- Document management endpoints
- User preferences endpoints
- Team information endpoints
- Performance tracking endpoints
- Attendance monitoring endpoints
- Leave management endpoints

---

**Last Updated**: November 2025  
**API Version**: 1.0  
**Maintained by**: Development Team
