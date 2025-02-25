// app.js

// Firebase configuration - REPLACE WITH YOUR OWN FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyBVzZbEHRNT7LbU-6HTrnnPMykzvoMyrDc",
    authDomain: "friday-games-40d39.firebaseapp.com",
    projectId: "friday-games-40d39",
    storageBucket: "friday-games-40d39.firebasestorage.app",
    messagingSenderId: "891791870514",
    appId: "1:891791870514:web:a35a3302372bdb7f130a2b"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Constants
const MAX_PLAYERS = 21;
const ADMIN_PASSWORD = "Ulukman2025"; // Change this to your desired admin password

// DOM Elements
const playerListElement = document.getElementById('player-list');
const pendingListElement = document.getElementById('pending-list');
const spotsLeftElement = document.getElementById('spots-left');
const signupForm = document.getElementById('signup-form');
const signupMessageElement = document.getElementById('signup-message');
const adminSectionElement = document.getElementById('admin-section');
const adminLoginElement = document.getElementById('admin-login');
const adminControlsElement = document.getElementById('admin-controls');
const adminPasswordInput = document.getElementById('admin-password');
const adminLoginBtn = document.getElementById('admin-login-btn');
const toggleAdminBtn = document.getElementById('toggle-admin');

// State
let isAdminLoggedIn = false;
let approvedPlayersCount = 0;

// Initialize application
function initApp() {
    loadApprovedPlayers();
    setupEventListeners();
}

// Load approved players from database
function loadApprovedPlayers() {
    db.collection('players')
        .where('approved', '==', true)
        .orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
            playerListElement.innerHTML = '';
            approvedPlayersCount = snapshot.docs.length;
            
            updateSpotsLeft();
            
            if (snapshot.empty) {
                playerListElement.innerHTML = '<li>No players signed up yet.</li>';
                return;
            }
            
            snapshot.forEach((doc, index) => {
                const player = doc.data();
                const li = document.createElement('li');
                li.textContent = `${index + 1}. ${player.name || ''}`;
                playerListElement.appendChild(li);
            });
        });
}

// Load pending requests from database
function loadPendingRequests() {
    db.collection('players')
        .where('approved', '==', false)
        .orderBy('timestamp', 'desc')
        .onSnapshot(snapshot => {
            pendingListElement.innerHTML = '';
            
            if (snapshot.empty) {
                pendingListElement.innerHTML = '<li>No pending requests.</li>';
                return;
            }
            
            snapshot.forEach(doc => {
                const player = doc.data();
                const li = document.createElement('li');
                
                const playerInfo = document.createElement('div');
                playerInfo.innerHTML = `
                    <strong>${player.name}</strong><br>
                    <small>Payment Note: ${player.paymentNote || 'None'}</small><br>
                    <small>Requested: ${new Date(player.timestamp).toLocaleString()}</small>
                `;
                
                const actions = document.createElement('div');
                actions.className = 'pending-actions';
                
                const approveBtn = document.createElement('button');
                approveBtn.className = 'approve-btn';
                approveBtn.textContent = 'Approve';
                approveBtn.addEventListener('click', () => approvePlayer(doc.id));
                
                const rejectBtn = document.createElement('button');
                rejectBtn.className = 'reject-btn';
                rejectBtn.textContent = 'Reject';
                rejectBtn.addEventListener('click', () => rejectPlayer(doc.id));
                
                actions.appendChild(approveBtn);
                actions.appendChild(rejectBtn);
                
                li.appendChild(playerInfo);
                li.appendChild(actions);
                pendingListElement.appendChild(li);
            });
        });
}

// Update spots left counter
function updateSpotsLeft() {
    const spotsLeft = MAX_PLAYERS - approvedPlayersCount;
    spotsLeftElement.textContent = `Available Spots: ${spotsLeft} of ${MAX_PLAYERS}`;
    
    // Disable signup form if no spots left
    const submitButton = signupForm.querySelector('button[type="submit"]');
    if (spotsLeft <= 0) {
        spotsLeftElement.style.color = 'red';
        submitButton.disabled = true;
        submitButton.textContent = 'No Spots Available';
    } else {
        spotsLeftElement.style.color = 'white';
        submitButton.disabled = false;
        submitButton.textContent = 'Submit Request';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Signup form submission
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nameInput = document.getElementById('player-name');
        const paymentNoteInput = document.getElementById('payment-note');
        
        const name = nameInput.value.trim();
        const paymentNote = paymentNoteInput.value.trim();
        
        if (!name) {
            showMessage('Please enter your name.', 'error');
            return;
        }
        
        // Add player request to database
        db.collection('players').add({
            name: name,
            paymentNote: paymentNote,
            approved: false,
            timestamp: Date.now()
        })
        .then(() => {
            // Clear form and show success message
            nameInput.value = '';
            paymentNoteInput.value = '';
            showMessage('Your signup request has been submitted! The organizer will approve it soon.', 'success');
        })
        .catch(error => {
            console.error('Error adding document: ', error);
            showMessage('Error submitting request. Please try again.', 'error');
        });
    });
    
    // Admin login
    adminLoginBtn.addEventListener('click', () => {
        const password = adminPasswordInput.value;
        
        if (password === ADMIN_PASSWORD) {
            isAdminLoggedIn = true;
            adminLoginElement.style.display = 'none';
            adminControlsElement.style.display = 'block';
            loadPendingRequests();
            adminPasswordInput.value = '';
        } else {
            alert('Incorrect password');
        }
    });
    
    // Toggle admin section
    toggleAdminBtn.addEventListener('click', () => {
        if (adminSectionElement.style.display === 'none') {
            adminSectionElement.style.display = 'block';
        } else {
            adminSectionElement.style.display = 'none';
            isAdminLoggedIn = false;
            adminLoginElement.style.display = 'block';
            adminControlsElement.style.display = 'none';
        }
    });
}

// Approve player
function approvePlayer(playerId) {
    if (approvedPlayersCount >= MAX_PLAYERS) {
        alert('Maximum number of players reached. Cannot approve more players.');
        return;
    }
    
    db.collection('players').doc(playerId).update({
        approved: true
    })
    .catch(error => {
        console.error('Error approving player: ', error);
        alert('Error approving player. Please try again.');
    });
}

// Reject player
function rejectPlayer(playerId) {
    if (confirm('Are you sure you want to reject this player?')) {
        db.collection('players').doc(playerId).delete()
        .catch(error => {
            console.error('Error rejecting player: ', error);
            alert('Error rejecting player. Please try again.');
        });
    }
}

// Show message
function showMessage(message, type) {
    signupMessageElement.textContent = message;
    signupMessageElement.className = `message ${type}`;
    
    // Clear message after 5 seconds
    setTimeout(() => {
        signupMessageElement.textContent = '';
        signupMessageElement.className = 'message';
    }, 5000);
}

// Initialize app on page load
document.addEventListener('DOMContentLoaded', initApp);
