const express = require('express');
const router = express.Router();
const {
    getAdminLogin,
    getAdminDashboard,
    getAdminRooms,
    getAdminBookings,
    getAdminUsers,
    getAdminReviews,
    getAdminSettings,
    getAdminReports
} = require('../Controllers/admin.controller');

// Admin routes - clean URLs only
router.get('/', getAdminDashboard);
router.get('/index', getAdminDashboard);

router.get('/login', getAdminLogin);

router.get('/rooms', getAdminRooms);

router.get('/bookings', getAdminBookings);

router.get('/users', getAdminUsers);

router.get('/reviews', getAdminReviews);

router.get('/settings', getAdminSettings);

router.get('/reports', getAdminReports);

module.exports = router;
