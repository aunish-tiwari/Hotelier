// API Configuration
const API_BASE_URL = '/api';

// Toastr configuration (guarded so auth logic still works even if toastr is not loaded)
if (typeof toastr !== 'undefined') {
    toastr.options = {
        closeButton: true,
        progressBar: true,
        positionClass: 'toast-top-right',
        timeOut: 3000
    };
}

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('token') !== null;
}

// Get current user
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Get auth token
function getAuthToken() {
    return localStorage.getItem('token');
}