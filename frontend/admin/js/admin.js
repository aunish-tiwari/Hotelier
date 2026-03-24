/**
 * Hotelier Admin Panel - Main JavaScript File
 * Contains shared functions for all admin pages
 */

// Toastr Configuration
toastr.options = {
    closeButton: true,
    progressBar: true,
    positionClass: 'toast-top-right',
    timeOut: 3000,
    newestOnTop: true,
    preventDuplicates: true
};

// API Configuration (for when backend is integrated)
const ADMIN_API_BASE_URL = 'http://localhost:5000/api/admin';

// Admin Authentication Functions
function checkAdminAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    if (adminUser.name) {
        const adminNameElements = document.querySelectorAll('#adminName');
        adminNameElements.forEach(el => {
            if (el) el.innerText = adminUser.name;
        });
    }
    return true;
}

function adminLogout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    toastr.success('Logged out successfully');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

// Sidebar Toggle for Mobile
function initSidebarToggle() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
}

// Format Currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Format Date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format DateTime
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Generate Random ID
function generateId(prefix = '') {
    return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

// Export to CSV
function exportToCSV(data, filename, columns) {
    let csv = columns.map(col => `"${col.label}"`).join(',') + '\n';
    
    data.forEach(row => {
        const rowData = columns.map(col => {
            let value = row[col.key];
            if (col.formatter) {
                value = col.formatter(value);
            }
            return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',');
        csv += rowData + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Render Stars
function renderStars(rating, size = 'sm') {
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            stars += `<i class="fas fa-star text-warning ${size === 'sm' ? 'fa-sm' : ''}"></i>`;
        } else if (i === fullStars + 1 && hasHalfStar) {
            stars += `<i class="fas fa-star-half-alt text-warning ${size === 'sm' ? 'fa-sm' : ''}"></i>`;
        } else {
            stars += `<i class="far fa-star text-warning ${size === 'sm' ? 'fa-sm' : ''}"></i>`;
        }
    }
    return stars;
}

// Get Status Badge HTML
function getStatusBadge(status, type = 'booking') {
    const statusMap = {
        // Booking statuses
        confirmed: { class: 'success', text: 'Confirmed' },
        pending: { class: 'warning', text: 'Pending' },
        cancelled: { class: 'danger', text: 'Cancelled' },
        completed: { class: 'info', text: 'Completed' },
        // Room statuses
        available: { class: 'success', text: 'Available' },
        booked: { class: 'danger', text: 'Booked' },
        maintenance: { class: 'warning', text: 'Maintenance' },
        // Payment statuses
        paid: { class: 'success', text: 'Paid' },
        refunded: { class: 'info', text: 'Refunded' },
        failed: { class: 'danger', text: 'Failed' },
        // User statuses
        active: { class: 'success', text: 'Active' },
        inactive: { class: 'secondary', text: 'Inactive' },
        // Review statuses
        approved: { class: 'success', text: 'Approved' },
        flagged: { class: 'danger', text: 'Flagged' }
    };
    
    const statusInfo = statusMap[status?.toLowerCase()] || { class: 'secondary', text: status || 'Unknown' };
    
    return `<span class="badge bg-${statusInfo.class}">${statusInfo.text}</span>`;
}

// Show Loading Overlay
function showLoading() {
    let overlay = document.getElementById('loadingOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        overlay.innerHTML = `
            <div class="spinner-border text-light" style="width: 3rem; height: 3rem;" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Debounce Function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Format Number with Commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Calculate Percentage
function calculatePercentage(value, total) {
    if (total === 0) return 0;
    return ((value / total) * 100).toFixed(1);
}

// Get Initials from Name
function getInitials(name) {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

// Generate Random Color
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Copy to Clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        toastr.success('Copied to clipboard!');
    }).catch(() => {
        toastr.error('Failed to copy');
    });
}

// Validate Email
function isValidEmail(email) {
    const re = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    return re.test(email);
}

// Validate Phone (Indian format)
function isValidPhone(phone) {
    const re = /^[6-9]\d{9}$/;
    return re.test(phone);
}

// Get Query Parameter
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Set Active Navigation Item
function setActiveNavItem() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.sidebar-menu .menu-item');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Initialize DataTable with Common Settings
function initDataTable(tableId, options = {}) {
    const defaultOptions = {
        pageLength: 10,
        responsive: true,
        language: {
            search: "Search:",
            lengthMenu: "Show _MENU_ entries",
            info: "Showing _START_ to _END_ of _TOTAL_ entries",
            paginate: {
                first: "First",
                last: "Last",
                next: "Next",
                previous: "Previous"
            }
        }
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    return $(`#${tableId}`).DataTable(mergedOptions);
}

// Chart Colors
const chartColors = {
    primary: '#f3b33d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    secondary: '#6c757d',
    dark: '#2c3e50'
};

// Common Chart Configurations
const chartConfig = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                usePointStyle: true,
                boxWidth: 10
            }
        }
    }
};

// Initialize all common components
document.addEventListener('DOMContentLoaded', function() {
    // Initialize sidebar toggle
    initSidebarToggle();
    
    // Set active navigation item
    setActiveNavItem();
    
    // Add logout listeners
    const logoutBtns = document.querySelectorAll('#logoutBtn, #logoutDropdown');
    logoutBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', adminLogout);
        }
    });
    
    // Remove spinner if exists
    const spinner = document.getElementById('spinner');
    if (spinner) {
        setTimeout(() => {
            spinner.classList.add('fade-out');
            setTimeout(() => {
                spinner.style.display = 'none';
            }, 500);
        }, 500);
    }
});