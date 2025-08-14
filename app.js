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
    if (currentUserRole === 'super-admin') {
        adminSection.style.display = 'block';
    } else {
        adminSection.style.display = 'none';
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

async function loadMembersList() {
    // Prefer the members list inside the currently visible section to avoid writing
    // into a hidden container when duplicate IDs exist (registration vs members).
    const activeSection = document.querySelector('.content-section.active');
    const membersList = (activeSection && (activeSection.querySelector('#membersList') || activeSection.querySelector('.members-list')))
        || document.getElementById('membersList');
    console.log('=== LOADING MEMBERS LIST ===');
    console.log('Active section:', activeSection ? activeSection.id : 'none');
    console.log('Members list element:', membersList);
    
    membersList.innerHTML = '<div class="loading">Loading members...</div>';
    
    await loadMembers();
    
    const membersArray = Object.entries(members).map(([id, member]) => ({
        id,
        ...member
    }));
    
    console.log('Members array for display:', membersArray);
    console.log('Members array length:', membersArray.length);
    
    if (membersArray.length === 0) {
        console.log('No members found, showing "no data" message');
        membersList.innerHTML = '<div class="no-data">No members found</div>';
        return;
    }
    
    console.log('Generating HTML for members...');
    const membersHTML = membersArray.map(member => {
        console.log('Processing member:', member);
        return `
            <div class="member-item">
                <div class="member-avatar">
                    ${member.name.charAt(0).toUpperCase()}
                </div>
                <div class="member-details">
                    <div class="member-name">${member.name}</div>
                    <div class="member-info-row">
                        <span><i class="fas fa-envelope"></i> ${member.email}</span>
                        <span><i class="fas fa-phone"></i> ${member.phone || 'Not provided'}</span>
                        <span><i class="fas fa-birthday-cake"></i> ${member.birthDate || 'Not provided'}</span>
                    </div>
                </div>
                <div class="member-actions">
    ${
        (currentUserRole === 'admin' || currentUserRole === 'super-admin') 
        ? `
            <button class="btn btn-secondary" onclick="editMember('${member.id}')">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-danger" onclick="deleteMember('${member.id}')">
                <i class="fas fa-trash"></i>
            </button>
        `
        : ''
    }
</div>
            </div>
        `;
    }).join('');
    
    console.log('Generated HTML length:', membersHTML.length);
    console.log('Setting innerHTML...');
    
    membersList.innerHTML = membersHTML;
    
    console.log('Members list updated successfully');
    console.log('=== END LOADING MEMBERS LIST ===');
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
                    <div class="toggle-switch ${isPresent ? 'active' : ''}" 
                         onclick="toggleAttendance('${member.id}')"></div>
                </div>
            </div>
        `;
    }).join('');
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

// Export Attendance (CSV) with Present/Absent and New Member indicator
document.getElementById('exportAttendanceExcelBtn').addEventListener('click', async () => {
    const date = document.getElementById('attendanceDate').value;
    if (!date) {
        showNotification('Please select a date', 'error');
        return;
    }
    try {
        await loadMembers();
        await loadAttendanceData();

        const header = ['Member Name', 'Email', 'Phone', 'Registered At', 'New Member?', `Present (${date})`];
        const rows = [header];

        const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
        const dateMs = new Date(date + 'T00:00:00').getTime();

        Object.entries(members).forEach(([id, m]) => {
            const registeredAtMs = typeof m.registeredAt === 'number' ? m.registeredAt : 0;
            const isNew = registeredAtMs && (dateMs - registeredAtMs <= oneWeekMs);
            const present = !!attendanceData[id];
            rows.push([
                m.name || '',
                m.email || '',
                m.phone || '',
                registeredAtMs ? new Date(registeredAtMs).toISOString().slice(0, 10) : '',
                isNew ? 'Yes' : 'No',
                present ? 'Present' : 'Absent'
            ]);
        });

        const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_${date}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        showNotification('Attendance exported.');
    } catch (error) {
        console.error('Export error:', error);
        showNotification(error.message, 'error');
    }
});

async function loadRecentActivity() {
    const activityList = document.getElementById('recentActivityList');
    
    try {
        const snapshot = await database.ref('activities').orderByChild('timestamp').limitToLast(5).once('value');
        const activities = snapshot.val() || {};
        
        const activitiesArray = Object.entries(activities)
            .map(([id, activity]) => ({ id, ...activity }))
            .sort((a, b) => b.timestamp - a.timestamp);
        
        if (activitiesArray.length === 0) {
            activityList.innerHTML = '<div class="no-data">No recent activity</div>';
            return;
        }
        
        activityList.innerHTML = activitiesArray.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-details">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-time">${new Date(activity.timestamp).toLocaleString()}</div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading activities:', error);
    }
}

function getActivityIcon(type) {
    const icons = {
        'registration': 'fa-user-plus',
        'attendance': 'fa-calendar-check',
        'member_update': 'fa-user-edit',
        'login': 'fa-sign-in-alt'
    };
    return icons[type] || 'fa-info-circle';
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
document.getElementById('memberSearch').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const memberItems = document.querySelectorAll('.member-item');
    
    memberItems.forEach(item => {
        const memberName = item.querySelector('.member-name').textContent.toLowerCase();
        const memberEmail = item.querySelector('.member-email').textContent.toLowerCase();
        
        if (memberName.includes(searchTerm) || memberEmail.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
});

// Export functionality
document.getElementById('exportMembersBtn').addEventListener('click', () => {
    const membersArray = Object.entries(members).map(([id, member]) => ({
        id,
        ...member
    }));
    
    const csvContent = [
        ['Name', 'Email', 'Phone', 'Address', 'Birth Date', 'Gender'],
        ...membersArray.map(member => [
            member.name,
            member.email,
            member.phone,
            member.address,
            member.birthDate,
            member.gender
        ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'church_members.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    showNotification('Members exported successfully!');
});

// System Settings
document.getElementById('systemSettingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const settings = {
        churchName: document.getElementById('churchName').value,
        serviceTime: document.getElementById('serviceTime').value,
        maxCapacity: parseInt(document.getElementById('maxCapacity').value)
    };
    
    try {
        await database.ref('settings').set(settings);
        showNotification('Settings saved successfully!');
    } catch (error) {
        showNotification(error.message, 'error');
    }
});

// Authentication State Observer
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // User is signed in
        try {
            const userRef = database.ref(`users/${user.uid}`);
            const snapshot = await userRef.once('value');
            const userData = snapshot.val();
            
            if (userData) {
                currentUser = user;
                currentUserRole = userData.role;
                showScreen('dashboardScreen');
                initializeDashboard();
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
            await auth.signOut();
        }
    } else {
        // User is signed out
        currentUser = null;
        currentUserRole = null;
        showScreen('loginScreen');
    }
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Set default date for attendance
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('attendanceDate').value = today;
    
    // Initialize the specified super admin account
    initializeSuperAdminAccount();
    
    // Load initial data if user is already authenticated
    if (auth.currentUser) {
        showScreen('dashboardScreen');
        initializeDashboard();
    }
});

// Initialize the specified super admin account
async function initializeSuperAdminAccount() {
    try {
        // Check if the account already exists
        const userRef = database.ref('users');
        const snapshot = await userRef.orderByChild('email').equalTo('rion.exa01@gmail.com').once('value');
        
        if (!snapshot.exists()) {
            // Create the super admin account
            const newUserRef = userRef.push();
            await newUserRef.set({
                name: "Rion Exa",
                email: "rion.exa01@gmail.com",
                role: "super-admin",
                createdAt: Date.now()
            });
            
            console.log("Super admin account created: rion.exa01@gmail.com");
        }
    } catch (error) {
        console.error("Error initializing super admin account:", error);
    }
}

// Debug function to check current state
function debugCurrentState() {
    console.log('=== DEBUG CURRENT STATE ===');
    console.log('Current User:', currentUser);
    console.log('Current User Role:', currentUserRole);
    console.log('Members Count:', Object.keys(members).length);
    console.log('Members Data:', members);
    console.log('Users Count:', Object.keys(users).length);
    console.log('Users Data:', users);
    console.log('Pending Registration:', pendingMemberRegistration);
    console.log('==========================');
}

// Make debug function available globally
window.debugCurrentState = debugCurrentState;

// Manual refresh function for members
function refreshMembersList() {
    console.log('=== MANUAL REFRESH MEMBERS LIST ===');
    loadMembersList();
}

// Make refresh function available globally
window.refreshMembersList = refreshMembersList;

// Function to fix existing member data
async function fixExistingMemberData() {
    console.log('=== FIXING EXISTING MEMBER DATA ===');
    
    try {
        const snapshot = await database.ref('members').once('value');
        const membersData = snapshot.val() || {};
        
        for (const [memberId, member] of Object.entries(membersData)) {
            if (!member.name || !member.email) {
                console.log('Fixing member:', memberId, member);
                
                // Try to find user data to get name and email
                const userSnapshot = await database.ref('users').orderByChild('email').once('value');
                const usersData = userSnapshot.val() || {};
                
                let foundUser = null;
                for (const [userId, user] of Object.entries(usersData)) {
                    if (user.email === member.email || user.name === member.name) {
                        foundUser = user;
                        break;
                    }
                }
                
                if (foundUser) {
                    const updatedData = {
                        name: foundUser.name,
                        email: foundUser.email,
                        ...member
                    };
                    
                    await database.ref(`members/${memberId}`).update(updatedData);
                    console.log('Fixed member data for:', memberId);
                } else {
                    console.log('Could not find user data for member:', memberId);
                }
            }
        }
        
        console.log('=== FINISHED FIXING MEMBER DATA ===');
        showNotification('Member data fix completed!');
        
        // Refresh the members list
        await loadMembersList();
        
    } catch (error) {
        console.error('Error fixing member data:', error);
        showNotification('Error fixing member data: ' + error.message, 'error');
    }
}

// Make fix function available globally
window.fixExistingMemberData = fixExistingMemberData; 