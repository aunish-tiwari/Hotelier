/**
 * Component Include Script
 * Dynamically loads header and footer components into HTML pages
 */

// Function to load HTML component
async function loadComponent(elementId, componentPath) {
    try {
        const response = await fetch(componentPath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = html;
            
            // After header is loaded, initialize header functionality
            if (elementId === 'header') {
                initializeHeader();
            }
            
            // After footer is loaded, initialize back to top button
            if (elementId === 'footer') {
                initializeBackToTop();
            }
        }
    } catch (error) {
        console.error(`Error loading ${componentPath}:`, error);
    }
}

// Initialize header functionality
function initializeHeader() {
    setActiveNavLink();
    initializeAuth();
    initializeMobileMenu();
}

// Set active navigation link based on current page
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const pageName = currentPage.split('.')[0];
    
    // Map page names to nav link IDs
    const activeMap = {
        'index': 'navHome',
        'about': 'navAbout',
        'service': 'navService',
        'rooms': 'navRooms',
        'booking': 'navBooking',
        'team': 'navTeam',
        'testimonial': 'navTestimonial',
        'contact': 'navContact',
        'dashboard': 'navDashboard'
    };
    
    const activeId = activeMap[pageName];
    if (activeId) {
        const activeLink = document.getElementById(activeId);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
}

// Initialize authentication UI
function initializeAuth() {
    const isLoggedIn = localStorage.getItem('token') !== null;
    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    const userNameSpan = document.getElementById('userName');
    const dashboardLink = document.getElementById('navDashboard');
    
    if (isLoggedIn && user) {
        if (authButtons) authButtons.style.display = 'none';
        if (userInfo) userInfo.style.display = 'flex';
        if (userNameSpan) userNameSpan.textContent = user.name || user.email;
        if (dashboardLink) dashboardLink.style.display = 'block';
    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (userInfo) userInfo.style.display = 'none';
        if (dashboardLink) dashboardLink.style.display = 'none';
    }
    
    // Logout button
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

// Initialize mobile menu toggle
function initializeMobileMenu() {
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.getElementById('navbarCollapse');
    
    if (navbarToggler && navbarCollapse) {
        navbarToggler.addEventListener('click', function() {
            navbarCollapse.classList.toggle('show');
        });
    }
}

// Initialize back to top button
function initializeBackToTop() {
    const backToTop = document.querySelector('.back-to-top');
    if (backToTop) {
        backToTop.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // Show/hide back to top button on scroll
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTop.style.display = 'flex';
        } else {
            backToTop.style.display = 'none';
        }
    });
}

// Load components when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Load header
    if (document.getElementById('header')) {
        loadComponent('header', 'components/header.html');
    }
    
    // Load footer
    if (document.getElementById('footer')) {
        loadComponent('footer', 'components/footer.html');
    }
});