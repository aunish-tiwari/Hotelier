// Authentication Management with JWT
document.addEventListener('DOMContentLoaded', function() {
    updateAuthUI();
    setupLogout();
});

function safeIsLoggedIn() {
    const token = localStorage.getItem('token');
    if (!token) {
        return false;
    }

    // Expire stale JWTs on the client so the navbar reflects real auth state.
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload && payload.exp && Date.now() >= payload.exp * 1000) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return false;
        }
    } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return false;
    }

    if (typeof isLoggedIn === 'function') {
        try {
            return isLoggedIn();
        } catch (error) {
            return true;
        }
    }

    return true;
}

function safeGetCurrentUser() {
    if (typeof getCurrentUser === 'function') {
        return getCurrentUser();
    }

    try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    } catch (error) {
        return null;
    }
}

function showToast(type, message) {
    if (typeof toastr !== 'undefined' && toastr[type]) {
        toastr[type](message);
    }
}

function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    const dashboardLink = document.getElementById('dashboardLink');
    const userNameSpan = document.getElementById('userName');
    const loggedIn = safeIsLoggedIn();
    
    if (loggedIn) {
        const user = safeGetCurrentUser();
        if (authButtons) {
            authButtons.style.display = 'none';
            authButtons.classList.add('d-none');
        }
        if (userInfo) {
            userInfo.style.display = 'flex';
            userInfo.classList.remove('d-none');
        }
        if (userNameSpan && user) userNameSpan.textContent = user.name;
        if (dashboardLink) dashboardLink.style.display = 'block';
    } else {
        if (authButtons) {
            authButtons.style.display = 'flex';
            authButtons.classList.remove('d-none');
        }
        if (userInfo) {
            userInfo.style.display = 'none';
            userInfo.classList.add('d-none');
        }
        if (dashboardLink) dashboardLink.style.display = 'none';
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            updateAuthUI();
            showToast('success', 'Logged out successfully');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        });
    }
}

// Login function (call from login page)
async function handleLogin(email, password) {
    try {
        const result = await login(email, password);
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        updateAuthUI();
        showToast('success', 'Login successful!');
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    } catch (error) {
        showToast('error', error.message);
    }
}

// Register function (call from register page)
async function handleRegister(name, email, password, phone) {
    try {
        const result = await register(name, email, password, phone);
        showToast('success', 'Registration successful! Please login.');
        setTimeout(() => {
            window.location.href = '/login';
        }, 1500);
    } catch (error) {
        showToast('error', error.message);
    }
}