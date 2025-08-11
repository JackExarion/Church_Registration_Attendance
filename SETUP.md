# Quick Setup Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Open the Application
1. Download all files to a folder
2. Open `index.html` in your web browser
3. The application will load automatically

### Step 2: Create Your First Account
1. Click "Register here" on the login screen
2. Fill in your details:
   - **Name**: Your full name
   - **Email**: Your email address
   - **Password**: Choose a secure password
   - **Role**: Select "Admin" for full access (or "Member" for limited access)
3. Click "Register"

### Step 3: Member Registration Flow
**For Members:**
1. Register with role "Member"
2. Immediately complete the Member Information form (shown right after registration)
3. The system automatically creates a basic member entry at registration and updates it after the form is submitted
4. Login to access the system (Members can access only Overview and Members)

**For Admins:**
1. Register with role "Admin"
2. Login directly to access the system

### Step 4: Login and Start Using
1. Use your email and password to login
2. You'll see the dashboard with overview statistics
3. Start managing members and tracking attendance!

## 🔐 Super Admin Account

Super Admin credentials for this deployment:
- **Email**: rion.exa01@gmail.com
- **Password**: tfm123
- **Role**: Super Admin (full system access)

Notes:
- Make sure Email/Password sign-in is enabled in Firebase Authentication.
- Create the Authentication user with the email above (via Firebase Console or by registering through the app).
- If the auth user exists but the database profile is missing, the app auto-initializes the profile on first login for this email.

## 📋 Sample Data (Optional)

To populate the system with sample data for testing:

1. Open the browser console (F12)
2. Run: `initializeSampleData()`
3. Sample users will be created:
   - **Super Admin**: pastor@church.com
   - **Super Admin**: rion.exa01@gmail.com (password: tfm123)
   - **Admin**: deacon@church.com  
   - **Member**: member@church.com

## 🔧 System Features

### For Super Admins:
- ✅ Full system access
- ✅ Manage user accounts (create, edit, delete)
- ✅ Change user roles
- ✅ System configuration
- ✅ All member and attendance functions

### For Admins:
- ✅ View member directory
- ✅ Track Sunday attendance
- ✅ Generate reports
- ✅ Export data
- ❌ Cannot manage user accounts

### For Members:
- ✅ View member directory
- ✅ Access overview dashboard
- ❌ Cannot access attendance tracking
- ❌ Cannot access reports
- ❌ Cannot manage members or users

## 🗓️ Attendance Rules & Exports

- Attendance is recorded for Sundays only. Saving attendance on non-Sunday dates is blocked.
- The dashboard shows the number of concluded services as the count of Sundays with attendance records.
- Export options:
  - **Export Attendance** (Attendance page): downloads a CSV for the selected Sunday with columns: Member Name, Email, Phone, Registered At, New Member?, Present/Absent. The member list is fetched live, so new members appear automatically and absent members are clearly marked.
  - **Export Members** (Members page): exports the current member directory as CSV.

## 📱 Browser Compatibility
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers supported
- Requires internet connection

## 🆘 Need Help?
- Check the main README.md for detailed documentation
- All data is automatically saved to Firebase
- No server setup required - it's fully static!

## 🔐 Security Notes
- All data is stored securely in Firebase
- User authentication is handled by Firebase
- Only Super Admins can manage user accounts
- Regular backups recommended (use export feature)

---

**Ready to go!** Your church registration system is now live and ready to use.