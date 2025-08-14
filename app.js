// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCHK4MszRyqo_deE3YdB-YxS6p5PNTyZZc",
    authDomain: "churchregistrationattendance.firebaseapp.com",
    databaseURL: "https://churchregistrationattendance-default-rtdb.firebaseio.com",
    projectId: "churchregistrationattendance",
    storageBucket: "churchregistrationattendance.firebasestorage.app",
    messagingSenderId: "1044268804491",
    appId: "1:1044268804491:web:b5d43273f6313283c3278e",
    measurementId: "G-31T286216V"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Global Variables
let currentUser = null;
let currentUserRole = null;
let members = [];
let attendanceData = {};
let users = [];
let pendingMemberRegistration = null;
let previousSection = 'members'; // Track previous section before edit

function returnToPreviousSection() {
    // First, show the dashboard screen again
    showScreen('dashboardScreen');

    // Then set nav highlight
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`[data-section="${previousSection}"]`)?.classList.add('active');

    // Show the correct content section
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(previousSection).classList.add('active');

    // Load its data
    loadSectionData(previousSection);
}



// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const registerScreen = document.getElementById('registerScreen');
const memberInfoScreen = document.getElementById('memberInfoScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const memberInfoForm = document.getElementById('memberInfoForm');
const logoutBtn = document.getElementById('logoutBtn');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');

// Authentication Functions
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Login Form Handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Get user role from database
        const userRef = database.ref(`users/${user.uid}`);
        const snapshot = await userRef.once('value');
        const userData = snapshot.val();
        
        if (userData) {
            currentUser = user;
            currentUserRole = userData.role;
            showScreen('dashboardScreen');
            initializeDashboard();
            showNotification('Login successful!');
        } else {
            // Auto-initialize Super Admin profile if the auth user matches the configured email
            if (user.email === 'rion.exa01@gmail.com') {
                await database.ref(`users/${user.uid}`).set({
                    name: 'Rion Exa',
                    email: user.email,
                    role: 'super-admin',
                    createdAt: Date.now()
                });
                currentUser = user;
                currentUserRole = 'super-admin';
                showScreen('dashboardScreen');
                initializeDashboard();
                showNotification('Super Admin profile initialized.');
            } else {
                showNotification('User data not found', 'error');
                await auth.signOut();
            }
        }
    } catch (error) {
        showNotification(error.message, 'error');
    }
});

// Register Form Handler
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Save user data to database
        await database.ref(`users/${user.uid}`).set({
            name: name,
            email: email,
            role: role,
            createdAt: Date.now()
        });
        
        if (role === 'member') {
            // Automatically create a basic member entry in Firebase immediately
            const basicMemberData = {
                name: name,
                email: email,
                phone: '',
                address: '',
                birthDate: '',
                gender: '',
                notes: 'Registration completed - details pending',
                registeredAt: Date.now(),
                registeredBy: user.uid,
                registrationStatus: 'basic'
            };
            const newMemberRef = database.ref('members').push();
            await newMemberRef.set(basicMemberData);
            
            // Store pending member registration data
            pendingMemberRegistration = {
                userId: user.uid,
                name: name,
                email: email,
                memberId: newMemberRef.key
            };
            
            // Show member information form
            document.getElementById('memberName').value = name;
            document.getElementById('memberEmail').value = email;
            showScreen('memberInfoScreen');
            showNotification('Basic member registration completed! Please add additional details.');
        } else {
            // For admin roles, go directly to login
            showNotification('Registration successful! Please login.');
            showScreen('loginScreen');
            registerForm.reset();
        }
    } catch (error) {
        showNotification(error.message, 'error');
    }
});

// Member Information Form Handler
memberInfoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!pendingMemberRegistration) {
        showNotification('Registration session expired. Please register again.', 'error');
        showScreen('registerScreen');
        return;
    }
    
    const memberData = {
        name: document.getElementById('memberName').value,
        email: document.getElementById('memberEmail').value,
        phone: document.getElementById('memberPhone').value,
        address: document.getElementById('memberAddress').value,
        birthDate: document.getElementById('memberBirthDate').value,
        gender: document.getElementById('memberGender').value,
        notes: document.getElementById('memberNotes').value,
        registeredAt: Date.now(),
        registeredBy: pendingMemberRegistration.userId
    };
    
    try {
        // Update the existing member entry with complete details
        if (pendingMemberRegistration.memberId) {
            await database.ref(`members/${pendingMemberRegistration.memberId}`).update(memberData);
        } else {
            // Fallback: create new member entry
            const newMemberRef = database.ref('members').push();
            await newMemberRef.set(memberData);
        }
        
        // Clear pending registration
        pendingMemberRegistration = null;
        
        showNotification('Member registration completed successfully! Please login.');
        showScreen('loginScreen');
        memberInfoForm.reset();
        registerForm.reset();
    } catch (error) {
        console.error('Error saving member data:', error);
        showNotification(error.message, 'error');
    }
});

// Logout Handler
logoutBtn.addEventListener('click', async () => {
    try {
        await auth.signOut();
        currentUser = null;
        currentUserRole = null;
        showScreen('loginScreen');
        showNotification('Logged out successfully');
    } catch (error) {
        showNotification(error.message, 'error');
    }
});

// Navigation Handlers
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    showScreen('registerScreen');
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    showScreen('loginScreen');
});

// Dashboard Navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = e.target.closest('.nav-link').dataset.section;
        
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        e.target.closest('.nav-link').classList.add('active');
        
        // Show corresponding section
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        document.getElementById(section).classList.add('active');
        
        // Load section data
        loadSectionData(section);
    });
});

// Initialize Dashboard
async function initializeDashboard() {
    // Update user info
    document.getElementById('userName').textContent = currentUser.email;
    document.getElementById('userRole').textContent = currentUserRole;
    
    // Show/hide admin section based on role
    const adminSection = document.getElementById('adminSection');
    const activityPostFormContainer = document.getElementById('activityPostFormContainer');
    if (currentUserRole === 'super-admin' || currentUserRole === 'admin') {
        adminSection.style.display = 'block';
        if (activityPostFormContainer) activityPostFormContainer.style.display = 'block';
    } else {
        adminSection.style.display = 'none';
        if (activityPostFormContainer) activityPostFormContainer.style.display = 'none';
    }
    
    // Hide navigation items for members
    const navItems = document.querySelectorAll('.nav-link');
    navItems.forEach(item => {
        const section = item.dataset.section;
        if (currentUserRole === 'member') {
            // Members can only access overview and members sections
            if (section !== 'overview' && section !== 'members') {
                item.parentElement.style.display = 'none';
            }
        } else {
            // Show all items for admin and super-admin
            item.parentElement.style.display = 'block';
        }
    });
    
    // Load initial data
    await loadMembers();
    await loadUsers();
    await loadOverviewData();
    
    // Set default date for attendance
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('attendanceDate').value = today;
}

// Load Section Data
async function loadSectionData(section) {
    // Check if member is trying to access restricted sections
    if (currentUserRole === 'member' && section !== 'overview' && section !== 'members') {
        showNotification('You do not have permission to access this section.', 'error');
        // Redirect to overview
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelector('[data-section="overview"]').classList.add('active');
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        document.getElementById('overview').classList.add('active');
        await loadOverviewData();
        return;
    }
    
    switch (section) {
        case 'overview':
            await loadOverviewData();
            break;
        case 'registration':
            await loadMembersList();
            break;
        case 'members':
            await loadMembersList();
            break;
        case 'attendance':
            await loadAttendanceData();
            break;
        case 'reports':
            await loadReportsData();
            break;
        case 'admin':
            await loadAdminData();
            break;
    }
}

// Members Management
async function loadMembers() {
    try {
        console.log('Loading members from database...');
        const snapshot = await database.ref('members').once('value');
        members = snapshot.val() || {};
        console.log('Members loaded:', Object.keys(members).length, 'members found');
        console.log('Members data:', members);
    } catch (error) {
        console.error('Error loading members:', error);
        showNotification('Error loading members: ' + error.message, 'error');
    }
}

function getMembersSectionElements() {
    const activeSection = document.querySelector('.content-section.active');
    if (!activeSection) return {};

    if (activeSection.id === 'registration') {
        return {
            membersList: document.getElementById('membersListRegistration'),
            searchInput: document.getElementById('memberSearchRegistration'),
            exportBtn: document.getElementById('exportMembersBtnRegistration')
        };
    } else if (activeSection.id === 'members') {
        return {
            membersList: document.getElementById('membersListMembers'),
            searchInput: document.getElementById('memberSearchMembers'),
            exportBtn: document.getElementById('exportMembersBtnMembers')
        };
    }
    return {};
}

// Update: loadMembersList uses correct container and removes Edit/Delete in Members panel
async function loadMembersList() {
    const { membersList } = getMembersSectionElements();
    if (!membersList) return;

    membersList.innerHTML = '<div class="loading">Loading members...</div>';
    await loadMembers();

    const membersArray = Object.entries(members).map(([id, member]) => ({
        id,
        ...member
    }));

    if (membersArray.length === 0) {
        membersList.innerHTML = '<div class="empty">No members found.</div>';
        return;
    }

    // Only show Edit/Delete in Member Management (admin) panel
    const isAdminPanel = membersList.id === 'membersListRegistration';

    membersList.innerHTML = membersArray.map(member => `
        <div class="member-item">
            <span>${member.name}</span>
            <span>${member.email}</span>
            ${isAdminPanel ? `
                <div class="member-actions">
                    <button class="btn btn-secondary" onclick="editMember('${member.id}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteMember('${member.id}')">Delete</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Attendance Management
async function loadAttendanceData() {
    const date = document.getElementById('attendanceDate').value;
    if (!date) return;
    
    try {
        const snapshot = await database.ref(`attendance/${date}`).once('value');
        attendanceData = snapshot.val() || {};
    } catch (error) {
        console.error('Error loading attendance:', error);
    }
}

document.getElementById('loadMembersBtn').addEventListener('click', async () => {
    const attendanceList = document.getElementById('attendanceList');
    attendanceList.innerHTML = '<div class="loading">Loading members...</div>';
    
    await loadMembers();
    await loadAttendanceData();
    
    const membersArray = Object.entries(members).map(([id, member]) => ({
        id,
        ...member
    }));
    
    if (membersArray.length === 0) {
        attendanceList.innerHTML = '<div class="no-data">No members found</div>';
        return;
    }
    
    attendanceList.innerHTML = membersArray.map(member => {
        const isPresent = attendanceData[member.id] || false;
        return `
            <div class="attendance-item">
                <div class="member-info">
                    <div class="member-name">${member.name}</div>
                    <div class="member-email">${member.email}</div>
                </div>
                <div class="attendance-toggle">
                    <span>Present</span>
                    <div class="toggle-switch${isPresent ? ' active' : ''}"
                        onclick="toggleAttendance('${member.id}')"></div>
                </div>
            </div>
        `;
    }).join("");
});

function toggleAttendance(memberId) {
    const toggle = event.target;
    const isPresent = toggle.classList.contains('active');
    
    if (isPresent) {
        toggle.classList.remove('active');
        delete attendanceData[memberId];
    } else {
        toggle.classList.add('active');
        attendanceData[memberId] = true;
    }
}

document.getElementById('markAllPresentBtn').addEventListener('click', () => {
    Object.keys(members).forEach(memberId => {
        attendanceData[memberId] = true;
    });
    document.querySelectorAll('.toggle-switch').forEach(toggle => {
        toggle.classList.add('active');
    });
});

document.getElementById('clearAttendanceBtn').addEventListener('click', () => {
    attendanceData = {};
    document.querySelectorAll('.toggle-switch').forEach(toggle => {
        toggle.classList.remove('active');
    });
});

document.getElementById('saveAttendanceBtn').addEventListener('click', async () => {
    const date = document.getElementById('attendanceDate').value;
    if (!date) {
        showNotification('Please select a date', 'error');
        return;
    }
    // Enforce Sundays only
    const day = new Date(date + 'T00:00:00').getDay();
    if (day !== 0) {
        showNotification('Attendance can only be saved for Sundays.', 'error');
        return;
    }
    
    try {
        await database.ref(`attendance/${date}`).set(attendanceData);
        showNotification('Attendance saved successfully!');
    } catch (error) {
        showNotification(error.message, 'error');
    }
});

// Overview Data
async function loadOverviewData() {
    await loadMembers();
    
    const totalMembers = Object.keys(members).length;
    document.getElementById('totalMembers').textContent = totalMembers;
    
    // Calculate today's attendance
    const today = new Date().toISOString().split('T')[0];
    try {
        const snapshot = await database.ref(`attendance/${today}`).once('value');
        const todayAttendance = snapshot.val() || {};
        const presentCount = Object.values(todayAttendance).filter(present => present).length;
        document.getElementById('todayAttendance').textContent = presentCount;
        
        const attendanceRate = totalMembers > 0 ? Math.round((presentCount / totalMembers) * 100) : 0;
        document.getElementById('attendanceRate').textContent = `${attendanceRate}%`;
        
        // Count concluded services (number of Sundays with attendance records)
        const allAttendanceSnap = await database.ref('attendance').once('value');
        const allAttendance = allAttendanceSnap.val() || {};
        const sundayDates = Object.keys(allAttendance).filter(d => new Date(d + 'T00:00:00').getDay() === 0);
        document.getElementById('totalServices').textContent = sundayDates.length;
    } catch (error) {
        console.error('Error loading attendance:', error);
    }
    
    // Load recent activity
    await loadRecentActivity();
}

// Warn when non-Sunday is selected
document.getElementById('attendanceDate').addEventListener('change', (e) => {
    const date = e.target.value;
    if (!date) return;
    const day = new Date(date + 'T00:00:00').getDay();
    if (day !== 0) {
        showNotification('Please select a Sunday. Attendance is recorded on Sundays only.', 'info');
    }
});

// Enhanced Export Attendance (CSV) for selected date, showing new/updated members and comparison with previous date
document.getElementById('exportAttendanceExcelBtn').addEventListener('click', async () => {
    const date = document.getElementById('attendanceDate').value;
    if (!date) {
        showNotification('Please select a date', 'error');
        return;
    }
    try {
        await loadMembers();
        await loadAttendanceData();

        // Find the previous Sunday before the selected date
        const selectedDateObj = new Date(date + 'T00:00:00');
        let prevSundayObj = new Date(selectedDateObj);
        prevSundayObj.setDate(selectedDateObj.getDate() - 7);
        const prevDate = prevSundayObj.toISOString().slice(0, 10);

        // Load previous attendance and members
        const prevAttendanceSnap = await database.ref(`attendance/${prevDate}`).once('value');
        const prevAttendance = prevAttendanceSnap.val() || {};

        // For new member detection: registeredAt within 7 days before selected date
        const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
        const dateMs = selectedDateObj.getTime();

        // For updated member detection: compare member fields between now and previous
        // (Assume members DB is always current; so "updated" means registered before prevDate but present now)
        // We'll mark as "New" if registeredAt > prevDate, "Updated" if present now but not present before

        const header = [
            'Member Name', 'Email', 'Phone', 'Registered At', 'New Member?', 
            `Present (${prevDate})`, `Present (${date})`, 'Status'
        ];
        const rows = [header];

        Object.entries(members).forEach(([id, m]) => {
            const registeredAtMs = typeof m.registeredAt === 'number' ? m.registeredAt : 0;
            const registeredAtDate = registeredAtMs ? new Date(registeredAtMs).toISOString().slice(0, 10) : '';
            const isNew = registeredAtMs && (dateMs - registeredAtMs < oneWeekMs);
            const presentPrev = !!prevAttendance[id];
            const presentNow = !!attendanceData[id];

            let status = '';
            if (isNew) {
                status = 'New Member';
            } else if (!presentPrev && presentNow) {
                status = 'Updated (Now Present)';
            } else if (presentPrev && !presentNow) {
                status = 'Updated (Now Absent)';
            } else {
                status = '';
            }

            rows.push([
                m.name || '',
                m.email || '',
                m.phone || '',
                registeredAtDate,
                isNew ? 'Yes' : 'No',
                presentPrev ? 'Present' : 'Absent',
                presentNow ? 'Present' : 'Absent',
                status
            ]);
        });

        const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_comparison_${date}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        showNotification('Attendance comparison exported.');
    } catch (error) {
        console.error('Export error:', error);
        showNotification(error.message, 'error');
    }
});

// Activity/Announcement Post Form Handler (send to email and SMS for all members)
const activityPostForm = document.getElementById('activityPostForm');
if (activityPostForm) {
    activityPostForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('activityTitle').value.trim();
        const message = document.getElementById('activityMessage').value.trim();
        const type = document.getElementById('activityType').value;

        if (!title || !message) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        try {
            // Save to database
            await database.ref('activities').push({
                title,
                message,
                type,
                postedBy: currentUser && currentUser.email ? currentUser.email : '',
                timestamp: Date.now()
            });

            // Load members and users if not already loaded
            if (!members || (Array.isArray(members) && members.length === 0) || (typeof members === 'object' && Object.keys(members).length === 0)) {
                await loadMembers();
            }
            if (!users || users.length === 0) {
                await loadUsers();
            }

            // Collect all emails and phone numbers from members and users (admin/super-admin)
            const emails = new Set();
            const phones = new Set();

            // Members
            const memberList = Array.isArray(members) ? members : Object.values(members);
            memberList.forEach(m => {
                if (m && m.email) emails.add(m.email);
                if (m && m.phone) phones.add(m.phone);
            });

            // Users (admin/super-admin)
            (Object.values(users) || []).forEach(u => {
                if (u && u.email) emails.add(u.email);
                if (u && u.phone) phones.add(u.phone);
            });

            // Send to backend endpoint for email/SMS
            fetch('http://localhost:3000/api/send-announcement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    message,
                    emails: Array.from(emails),
                    phones: Array.from(phones)
                })
            }).then(res => {
                if (res.ok) {
                    showNotification('Announcement/Activity posted and sent!');
                } else {
                    showNotification('Posted, but failed to send to all contacts.', 'warning');
                }
            }).catch(() => {
                showNotification('Posted, but failed to send to all contacts.', 'warning');
            });

            activityPostForm.reset();
            if (typeof loadRecentActivity === 'function') loadRecentActivity();
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });
}

// Update: loadRecentActivity to show activity/announcement posts
async function loadRecentActivity() {
    const activityList = document.getElementById('recentActivityList');
    try {
        const snapshot = await database.ref('activities').orderByChild('timestamp').limitToLast(10).once('value');
        const activities = snapshot.val() || {};
        const activitiesArray = Object.values(activities).sort((a, b) => b.timestamp - a.timestamp);

        activityList.innerHTML = activitiesArray.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-details">
                    <div class="activity-title">${activity.title}</div>
                    ${activity.message ? `<div class="activity-message">${activity.message}</div>` : ''}
                    <div class="activity-meta">
                        <span class="activity-type">${activity.type}</span>
                        <span class="activity-user">${activity.postedBy || ''}</span>
                        <span class="activity-time">${new Date(activity.timestamp).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        activityList.innerHTML = '<div class="error">Failed to load activity.</div>';
    }
}

// Reports
async function loadReportsData() {
    // Set default date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    document.getElementById('reportStartDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('reportEndDate').value = endDate.toISOString().split('T')[0];
}

document.getElementById('generateAttendanceReport').addEventListener('click', async () => {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    
    if (!startDate || !endDate) {
        showNotification('Please select date range', 'error');
        return;
    }
    
    const reportContent = document.getElementById('attendanceReport');
    reportContent.innerHTML = '<div class="loading">Generating report...</div>';
    
    try {
        const snapshot = await database.ref('attendance').once('value');
        const allAttendance = snapshot.val() || {};
        
        let totalPresent = 0;
        let totalServices = 0;
        
        Object.entries(allAttendance).forEach(([date, attendance]) => {
            if (date >= startDate && date <= endDate) {
                totalServices++;
                totalPresent += Object.values(attendance).filter(present => present).length;
            }
        });
        
        const averageAttendance = totalServices > 0 ? Math.round(totalPresent / totalServices) : 0;
        
        reportContent.innerHTML = `
            <div class="report-summary">
                <h4>Attendance Summary (${startDate} to ${endDate})</h4>
                <p><strong>Total Services:</strong> ${totalServices}</p>
                <p><strong>Total Attendance:</strong> ${totalPresent}</p>
                <p><strong>Average Attendance:</strong> ${averageAttendance}</p>
            </div>
        `;
    } catch (error) {
        showNotification(error.message, 'error');
    }
});

// Admin Functions
async function loadUsers() {
    try {
        const snapshot = await database.ref('users').once('value');
        users = snapshot.val() || {};
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function loadAdminData() {
    await loadUsers();
    
    const usersList = document.getElementById('usersList');
    const usersArray = Object.entries(users).map(([id, user]) => ({
        id,
        ...user
    }));
    
    usersList.innerHTML = usersArray.map(user => `
        <div class="user-item">
            <div class="user-info">
                <span>${user.name}</span>
                <span class="user-role role-${user.role}">${user.role}</span>
            </div>
            <div class="user-actions">
                ${currentUserRole === 'super-admin' ? `
                    <button class="btn btn-secondary" onclick="changeUserRole('${user.id}', '${user.role}')">
                        Change Role
                    </button>
                    <button class="btn btn-danger" onclick="deleteUser('${user.id}')">
                        Delete
                    </button>
                ` : `
                    <span class="text-muted">Only Super Admin can manage users</span>
                `}
            </div>
        </div>
    `).join('');
}

function changeUserRole(userId, currentRole) {
    if (currentUserRole !== 'super-admin') {
        showNotification('Only Super Admin can change user roles', 'error');
        return;
    }
    
    const roles = ['member', 'admin', 'super-admin'];
    const currentIndex = roles.indexOf(currentRole);
    const newRole = roles[(currentIndex + 1) % roles.length];
    
    database.ref(`users/${userId}/role`).set(newRole)
        .then(() => {
            showNotification(`User role changed to ${newRole}`);
            loadAdminData();
        })
        .catch(error => {
            showNotification(error.message, 'error');
        });
}

function deleteUser(userId) {
    if (currentUserRole !== 'super-admin') {
        showNotification('Only Super Admin can delete users', 'error');
        return;
    }
    
    if (confirm('Are you sure you want to delete this user?')) {
        database.ref(`users/${userId}`).remove()
            .then(() => {
                showNotification('User deleted successfully');
                loadAdminData();
            })
            .catch(error => {
                showNotification(error.message, 'error');
            });
    }
}

async function handleEditMemberForm(e) {
    e.preventDefault();
    
    const memberId = document.getElementById('memberEditForm').dataset.memberId;
    const updatedMemberData = {
        name: document.getElementById('editMemberName').value,
        email: document.getElementById('editMemberEmail').value,
        phone: document.getElementById('editMemberPhone').value,
        address: document.getElementById('editMemberAddress').value,
        birthDate: document.getElementById('editMemberBirthDate').value,
        gender: document.getElementById('editMemberGender').value,
        notes: document.getElementById('editMemberNotes').value,
    };
    
    try {
        await database.ref(`members/${memberId}`).update(updatedMemberData);
        showNotification('Member details updated successfully!');
        returnToPreviousSection(); // Return to previous section
        loadMembersList(); // Refresh the members list
    } catch (error) {
        showNotification('Error updating member details: ' + error.message, 'error');
    }
}

document.getElementById('memberEditForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const memberId = document.getElementById('memberEditForm').dataset.memberId;
    const updatedMemberData = {
        name: document.getElementById('editMemberName').value,
        email: document.getElementById('editMemberEmail').value,
        phone: document.getElementById('editMemberPhone').value,
        address: document.getElementById('editMemberAddress').value,
        birthDate: document.getElementById('editMemberBirthDate').value,
        gender: document.getElementById('editMemberGender').value,
        notes: document.getElementById('editMemberNotes').value,
    };
    
    try {
        await database.ref(`members/${memberId}`).update(updatedMemberData);
        showNotification('Member details updated successfully!');
        returnToPreviousSection(); // Return to previous section
        loadMembersList(); // Refresh the members list
    } catch (error) {
        showNotification('Error updating member details: ' + error.message, 'error');
    }
});

// Cancel button event listener
document.getElementById('cancelEditBtn').addEventListener('click', () => {
    returnToPreviousSection(); // Return to previous section
});
function editMember(memberId) {
    previousSection = document.querySelector('.content-section.active')?.id || 'members';
    const member = members[memberId];
    if (!member) return;
    
    // Show member editing form
    const memberForm = document.getElementById('memberEditForm');
    memberForm.querySelector('#editMemberName').value = member.name;
    memberForm.querySelector('#editMemberEmail').value = member.email;
    memberForm.querySelector('#editMemberPhone').value = member.phone || '';
    memberForm.querySelector('#editMemberAddress').value = member.address || '';
    memberForm.querySelector('#editMemberBirthDate').value = member.birthDate || '';
    memberForm.querySelector('#editMemberGender').value = member.gender || '';
    memberForm.querySelector('#editMemberNotes').value = member.notes || '';
    memberForm.dataset.memberId = memberId; // Store member ID for later use
    showScreen('memberEditScreen'); // Show the edit screen
}

function deleteMember(memberId) {
    if (confirm('Are you sure you want to delete this member?')) {
        database.ref(`members/${memberId}`).remove()
            .then(() => {
                showNotification('Member deleted successfully');
                loadMembersList();
                loadOverviewData();
            })
            .catch(error => {
                showNotification(error.message, 'error');
            });
    }
}

// Member Management Interface
document.getElementById('addMemberBtn').addEventListener('click', () => {
    showNotification('Please use the registration screen to add new members.', 'info');
});

// Search functionality
document.getElementById('memberSearchRegistration').addEventListener('input', (e) => {
    filterMembersList(e.target.value, 'registration');
});
document.getElementById('memberSearchMembers').addEventListener('input', (e) => {
    filterMembersList(e.target.value, 'members');
});

function filterMembersList(query, section) {
    const listId = section === 'registration' ? 'membersListRegistration' : 'membersListMembers';
    const membersList = document.getElementById(listId);
    if (!membersList) return;

    const lowerQuery = query.toLowerCase();
    const filtered = Object.entries(members)
        .filter(([id, member]) =>
            member.name.toLowerCase().includes(lowerQuery) ||
            member.email.toLowerCase().includes(lowerQuery)
        )
        .map(([id, member]) => ({
            id,
            ...member
        }));

    if (filtered.length === 0) {
        membersList.innerHTML = '<div class="empty">No members found.</div>';
        return;
    }

    const isAdminPanel = listId === 'membersListRegistration';

    membersList.innerHTML = filtered.map(member => `
        <div class="member-item">
            <span>${member.name}</span>
            <span>${member.email}</span>
            ${isAdminPanel ? `
                <div class="member-actions">
                    <button class="btn btn-secondary" onclick="editMember('${member.id}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteMember('${member.id}')">Delete</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Update: Export functionality for both sections
document.getElementById('exportMembersBtnRegistration').addEventListener('click', () => {
    exportMembers('registration');
});
document.getElementById('exportMembersBtnMembers').addEventListener('click', () => {
    exportMembers('members');
});

function exportMembers(section) {
    // Simple CSV export
    const rows = [['Name', 'Email', 'Phone', 'Address', 'Birth Date', 'Gender', 'Notes']];
    Object.values(members).forEach(member => {
        rows.push([
            member.name || '',
            member.email || '',
            member.phone || '',
            member.address || '',
            member.birthDate || '',
            member.gender || '',
            member.notes || ''
        ]);
    });
    const csv = rows.map(r => r.map(x => `"${x.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'members.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}