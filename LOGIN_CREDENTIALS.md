# Login Credentials

## Updated: November 18, 2025

Both accounts have been reset and are now working correctly.

## Superadmin Account
- **Username:** `superadmin`
- **Password:** `admin123`
- **Email:** superadmin@university.edu
- **Role:** Super Admin
- **Employee ID:** SUP0014
- **Department:** Administration
- **Permissions:** Full system access

## Ishita Parkar Account
- **Username:** `ishitaparkar04@gmail.com`
- **Current Password:** `password123` (manually reset for testing)
- **Email:** ishitaparkar04@gmail.com
- **Role:** Employee
- **Employee ID:** 001
- **Full Name:** Ishita Parkar
- **Permissions:** Employee-level access (view profile, manage own leaves, view employees)

**Note:** If this user received a welcome email with a temporary password, that password should be used for first login. After first login, the user will be prompted to change the password. The new password they set will be their permanent login password.

## Login Instructions

1. Navigate to the login page: `http://localhost:3000/`
2. Enter the username and password from above
3. Click "Login"
4. You will be redirected to the dashboard

## Testing Verification

Both accounts have been tested via API and confirmed working:
- ✅ Superadmin login successful
- ✅ ishitaparkar04@gmail.com login successful
- ✅ Authentication tokens generated correctly
- ✅ User profiles and roles properly configured

## Additional Test Accounts

If you need other test accounts, here are the available users:

1. **HR Manager**
   - Username: `hrmanager`
   - Password: (needs to be reset if required)
   - Email: hrmanager@university.edu

2. **Prutha Jadhav**
   - Username: `pruthajadhav82@gmail.com`
   - Password: (needs to be reset if required)
   - Email: pruthajadhav82@gmail.com

3. **Employee**
   - Username: `employee`
   - Password: (needs to be reset if required)
   - Email: employee@university.edu

## Password Reset Command

If you need to reset any password in the future, use:

```bash
cd backend
python manage.py shell -c "from authentication.models import User; u = User.objects.get(username='USERNAME'); u.set_password('NEW_PASSWORD'); u.save(); print('Password reset successfully')"
```

Replace `USERNAME` with the actual username and `NEW_PASSWORD` with the desired password.

## Security Note

⚠️ **Important:** These are development/testing credentials. In production:
- Use strong, unique passwords
- Enable password complexity requirements
- Implement password expiration policies
- Use multi-factor authentication
- Never commit credentials to version control
