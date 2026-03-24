// Authentication Management
document.addEventListener('DOMContentLoaded', function() {
    updateAuthUI();
    setupLogout();
});

function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    const dashboardLink = document.getElementById('dashboardLink');
    const userNameSpan = document.getElementById('userName');
    
    if (isLoggedIn()) {
        const user = getCurrentUser();
        if (authButtons) authButtons.style.display = 'none';
        if (userInfo) userInfo.style.display = 'flex';
        if (userNameSpan && user) userNameSpan.textContent = user.name;
        if (dashboardLink) dashboardLink.style.display = 'block';
    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (userInfo) userInfo.style.display = 'none';
        if (dashboardLink) dashboardLink.style.display = 'none';
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            toastr.success('Logged out successfully');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        });
    }
}

// Login function (call from login.html)
async function handleLogin(email, password) {
    try {
        const result = await login(email, password);
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        toastr.success('Login successful!');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        toastr.error(error.message);
    }
}

// Register function (call from register.html)
async function handleRegister(name, email, password, phone) {
    try {
        const result = await register(name, email, password, phone);
        toastr.success('Registration successful! Please login.');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    } catch (error) {
        toastr.error(error.message);
    }
}