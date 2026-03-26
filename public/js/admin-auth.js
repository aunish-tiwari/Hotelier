(function () {
    function getStoredAdminUser() {
        try {
            return JSON.parse(localStorage.getItem('user') || localStorage.getItem('adminUser') || '{}');
        } catch (error) {
            return {};
        }
    }

    function resolveAdminName(adminUser) {
        return adminUser.name || adminUser.full_name || adminUser.email || 'Admin User';
    }

    function showToast(type, message) {
        if (typeof toastr !== 'undefined' && toastr[type]) {
            toastr[type](message);
        }
    }

    function checkAdminAuth() {
        const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
        const adminUser = getStoredAdminUser();

        if (!token) {
            window.location.href = '/login';
            return false;
        }

        if (String(adminUser.role || '').toLowerCase() !== 'admin') {
            window.location.href = '/';
            return false;
        }

        const adminNameElement = document.getElementById('adminName');
        if (adminNameElement) {
            adminNameElement.textContent = resolveAdminName(adminUser);
        }

        return true;
    }

    function logoutAdmin(event) {
        if (event) {
            event.preventDefault();
        }

        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showToast('success', 'Logged out successfully');

        setTimeout(function () {
            window.location.href = '/login';
        }, 700);
    }

    function configureToastr() {
        if (typeof toastr !== 'undefined') {
            toastr.options = {
                closeButton: true,
                progressBar: true,
                positionClass: 'toast-top-right',
                timeOut: 3000
            };
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        configureToastr();

        if (!checkAdminAuth()) {
            return;
        }

        document.getElementById('menuToggle')?.addEventListener('click', function () {
            document.getElementById('sidebar')?.classList.toggle('active');
        });

        document.getElementById('logoutBtn')?.addEventListener('click', logoutAdmin);
        document.getElementById('logoutDropdown')?.addEventListener('click', logoutAdmin);
    });
})();
