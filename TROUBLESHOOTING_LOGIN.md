# Login Troubleshooting Guide

## Issue Resolved ✅

Both accounts are now working:
- **superadmin** → Password: `admin123`
- **ishitaparkar04@gmail.com** → Password: `password123`

## What Was Fixed

1. **Password Reset**: Both accounts had their passwords reset to known values
2. **Profile Configuration**: Ensured UserProfile exists and password_changed flag is set correctly
3. **API Verification**: Tested both accounts via API and confirmed authentication works

## Common Login Issues & Solutions

### 1. "Invalid credentials" Error

**Possible Causes:**
- Wrong username or password
- Account is inactive
- Password not set correctly

**Solution:**
```bash
cd backend
python manage.py shell -c "from authentication.models import User; u = User.objects.get(username='YOUR_USERNAME'); print(f'Active: {u.is_active}'); u.set_password('NEW_PASSWORD'); u.save(); print('Password reset')"
```

### 2. "User does not exist" Error

**Check if user exists:**
```bash
cd backend
python manage.py shell -c "from authentication.models import User; print(User.objects.filter(username='YOUR_USERNAME').exists())"
```

**Create user if needed:**
```bash
cd backend
python manage.py createsuperuser
```

### 3. Stuck on "First Login Password Change" Page

**Solution:**
```bash
cd backend
python manage.py shell -c "from authentication.models import User, UserProfile; u = User.objects.get(username='YOUR_USERNAME'); profile, created = UserProfile.objects.get_or_create(user=u); profile.password_changed = True; profile.save(); print('Password change flag updated')"
```

### 4. Backend Not Running

**Check backend status:**
```bash
curl http://127.0.0.1:8000/api/auth/login/
```

**Start backend:**
```bash
cd backend
python manage.py runserver
```

### 5. Frontend Not Running

**Check frontend status:**
```bash
curl http://localhost:3000
```

**Start frontend:**
```bash
cd frontend
npm start
```

### 6. CORS Errors in Browser Console

**Check backend CORS settings in `backend/hrms_core/settings.py`:**
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

### 7. Token Authentication Issues

**Clear browser localStorage:**
```javascript
// In browser console
localStorage.clear();
location.reload();
```

**Or manually remove auth token:**
```javascript
localStorage.removeItem('authToken');
```

## Verify System Status

### Check All Users
```bash
cd backend
python manage.py shell -c "from authentication.models import User; [print(f'{u.username} - Active: {u.is_active}') for u in User.objects.all()]"
```

### Check User Roles
```bash
cd backend
python manage.py shell -c "from authentication.models import User; u = User.objects.get(username='YOUR_USERNAME'); print(f'Groups: {[g.name for g in u.groups.all()]}')"
```

### Test Login via API
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"YOUR_USERNAME","password":"YOUR_PASSWORD"}'
```

## Database Issues

### Reset Database (⚠️ Destroys all data)
```bash
cd backend
rm db.sqlite3
python manage.py migrate
python manage.py init_roles
python manage.py setup_users
```

### Run Migrations
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

## Quick Reset All Passwords

```bash
cd backend
python manage.py shell << EOF
from authentication.models import User

users_passwords = {
    'superadmin': 'admin123',
    'hrmanager': 'hr123',
    'ishitaparkar04@gmail.com': 'password123',
    'pruthajadhav82@gmail.com': 'password123',
    'employee': 'employee123'
}

for username, password in users_passwords.items():
    try:
        u = User.objects.get(username=username)
        u.set_password(password)
        u.save()
        print(f'✓ {username} password reset')
    except User.DoesNotExist:
        print(f'✗ {username} not found')
EOF
```

## Contact Support

If issues persist:
1. Check browser console for JavaScript errors
2. Check backend terminal for Python errors
3. Verify both servers are running
4. Clear browser cache and cookies
5. Try a different browser or incognito mode

## Current System Status

- ✅ Backend: Running on http://127.0.0.1:8000
- ✅ Frontend: Running on http://localhost:3000
- ✅ Database: Connected and accessible
- ✅ Authentication: Working correctly
- ✅ Test accounts: Configured and verified
