// Sample Data Initialization Script
// This file contains sample data to populate the church registration system
// Run this in the browser console to initialize sample data

const sampleData = {
    // Sample Users (for testing)
    users: {
        "super-admin-1": {
            name: "Pastor John Smith",
            email: "pastor@church.com",
            role: "super-admin",
            createdAt: Date.now()
        },
        "super-admin-2": {
            name: "Rion Exa",
            email: "rion.exa01@gmail.com",
            role: "super-admin",
            createdAt: Date.now()
        },
        "admin-1": {
            name: "Deacon Mary Johnson",
            email: "deacon@church.com",
            role: "admin",
            createdAt: Date.now()
        },
        "member-1": {
            name: "Member Sarah Wilson",
            email: "member@church.com",
            role: "member",
            createdAt: Date.now()
        }
    },

    // Sample Members
    members: {
        "member-1": {
            name: "John Doe",
            email: "john.doe@email.com",
            phone: "(555) 123-4567",
            address: "123 Main Street, City, State 12345",
            birthDate: "1985-03-15",
            gender: "male",
            notes: "Active member, attends regularly",
            registeredAt: Date.now(),
            registeredBy: "super-admin-1"
        },
        "member-2": {
            name: "Jane Smith",
            email: "jane.smith@email.com",
            phone: "(555) 234-5678",
            address: "456 Oak Avenue, City, State 12345",
            birthDate: "1990-07-22",
            gender: "female",
            notes: "New member, joined last month",
            registeredAt: Date.now(),
            registeredBy: "admin-1"
        },
        "member-3": {
            name: "Michael Brown",
            email: "michael.brown@email.com",
            phone: "(555) 345-6789",
            address: "789 Pine Road, City, State 12345",
            birthDate: "1978-11-08",
            gender: "male",
            notes: "Family of four, very involved",
            registeredAt: Date.now(),
            registeredBy: "super-admin-1"
        },
        "member-4": {
            name: "Emily Davis",
            email: "emily.davis@email.com",
            phone: "(555) 456-7890",
            address: "321 Elm Street, City, State 12345",
            birthDate: "1992-04-12",
            gender: "female",
            notes: "Youth group leader",
            registeredAt: Date.now(),
            registeredBy: "admin-1"
        },
        "member-5": {
            name: "Robert Wilson",
            email: "robert.wilson@email.com",
            phone: "(555) 567-8901",
            address: "654 Maple Drive, City, State 12345",
            birthDate: "1965-09-30",
            gender: "male",
            notes: "Senior member, choir director",
            registeredAt: Date.now(),
            registeredBy: "super-admin-1"
        },
        "member-6": {
            name: "Lisa Anderson",
            email: "lisa.anderson@email.com",
            phone: "(555) 678-9012",
            address: "987 Cedar Lane, City, State 12345",
            birthDate: "1988-12-03",
            gender: "female",
            notes: "Sunday school teacher",
            registeredAt: Date.now(),
            registeredBy: "admin-1"
        },
        "member-7": {
            name: "David Martinez",
            email: "david.martinez@email.com",
            phone: "(555) 789-0123",
            address: "147 Birch Court, City, State 12345",
            birthDate: "1983-06-18",
            gender: "male",
            notes: "Usher team member",
            registeredAt: Date.now(),
            registeredBy: "super-admin-1"
        },
        "member-8": {
            name: "Jennifer Taylor",
            email: "jennifer.taylor@email.com",
            phone: "(555) 890-1234",
            address: "258 Spruce Way, City, State 12345",
            birthDate: "1995-01-25",
            gender: "female",
            notes: "College student, active in youth ministry",
            registeredAt: Date.now(),
            registeredBy: "admin-1"
        }
    },

    // Sample Attendance Data (last 4 weeks)
    attendance: {
        "2024-01-07": {
            "member-1": true,
            "member-2": true,
            "member-3": true,
            "member-4": true,
            "member-5": true,
            "member-6": false,
            "member-7": true,
            "member-8": true
        },
        "2024-01-14": {
            "member-1": true,
            "member-2": true,
            "member-3": false,
            "member-4": true,
            "member-5": true,
            "member-6": true,
            "member-7": true,
            "member-8": false
        },
        "2024-01-21": {
            "member-1": true,
            "member-2": false,
            "member-3": true,
            "member-4": true,
            "member-5": true,
            "member-6": true,
            "member-7": false,
            "member-8": true
        },
        "2024-01-28": {
            "member-1": true,
            "member-2": true,
            "member-3": true,
            "member-4": false,
            "member-5": true,
            "member-6": true,
            "member-7": true,
            "member-8": true
        }
    },

    // Sample Activities
    activities: {
        "activity-1": {
            type: "registration",
            title: "New member registered: John Doe",
            timestamp: Date.now() - 86400000 * 7,
            userId: "super-admin-1"
        },
        "activity-2": {
            type: "attendance",
            title: "Attendance recorded for Sunday service",
            timestamp: Date.now() - 86400000 * 3,
            userId: "admin-1"
        },
        "activity-3": {
            type: "member_update",
            title: "Member information updated: Jane Smith",
            timestamp: Date.now() - 86400000 * 2,
            userId: "admin-1"
        },
        "activity-4": {
            type: "registration",
            title: "New member registered: Michael Brown",
            timestamp: Date.now() - 86400000,
            userId: "super-admin-1"
        }
    },

    // System Settings
    settings: {
        churchName: "Grace Community Church",
        serviceTime: "10:00",
        maxCapacity: 200
    }
};

// Function to initialize sample data
function initializeSampleData() {
    console.log("Initializing sample data...");
    
    const database = firebase.database();
    
    // Initialize users
    Object.entries(sampleData.users).forEach(([userId, userData]) => {
        database.ref(`users/${userId}`).set(userData);
    });
    
    // Initialize members
    Object.entries(sampleData.members).forEach(([memberId, memberData]) => {
        database.ref(`members/${memberId}`).set(memberData);
    });
    
    // Initialize attendance
    Object.entries(sampleData.attendance).forEach(([date, attendanceData]) => {
        database.ref(`attendance/${date}`).set(attendanceData);
    });
    
    // Initialize activities
    Object.entries(sampleData.activities).forEach(([activityId, activityData]) => {
        database.ref(`activities/${activityId}`).set(activityData);
    });
    
    // Initialize settings
    database.ref('settings').set(sampleData.settings);
    
    console.log("Sample data initialization complete!");
    console.log("You can now login with:");
    console.log("Email: pastor@church.com (Super Admin)");
    console.log("Email: rion.exa01@gmail.com (Super Admin) - Password: tfm123");
    console.log("Email: deacon@church.com (Admin)");
    console.log("Email: member@church.com (Member)");
    console.log("Password: Use the registration form to set passwords");
}

// Function to clear all data (use with caution)
function clearAllData() {
    if (confirm("Are you sure you want to clear ALL data? This action cannot be undone.")) {
        const database = firebase.database();
        database.ref().remove()
            .then(() => {
                console.log("All data cleared successfully!");
            })
            .catch((error) => {
                console.error("Error clearing data:", error);
            });
    }
}

// Function to export current data
function exportCurrentData() {
    const database = firebase.database();
    
    database.ref().once('value')
        .then((snapshot) => {
            const data = snapshot.val();
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'church-data-backup.json';
            link.click();
            URL.revokeObjectURL(url);
            console.log("Data exported successfully!");
        })
        .catch((error) => {
            console.error("Error exporting data:", error);
        });
}

// Make functions available globally
window.initializeSampleData = initializeSampleData;
window.clearAllData = clearAllData;
window.exportCurrentData = exportCurrentData;

console.log("Sample data functions loaded:");
console.log("- initializeSampleData(): Initialize the system with sample data");
console.log("- clearAllData(): Clear all data from the system");
console.log("- exportCurrentData(): Export current data as JSON backup"); 