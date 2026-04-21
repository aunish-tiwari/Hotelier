const express = require('express');
const router = express.Router();
const { postRegister, postLogin } = require('../Controllers/auth.controller');
const {
    getRoomsApi,
    getRoomByIdApi,
    getRoomAvailabilityApi,
    getRoomReviewsApi,
    postRoomReviewApi,
    getSiteStatsApi
} = require('../Controllers/user.controller');
const {
    postBooking,
    getUserBookings,
    cancelBooking,
    getBookingById
} = require('../Controllers/booking.controller');
const {
    getAdminSummaryApi,
    getAdminBookingsApi,
    getAdminUsersApi,
    getAdminUserBookingsApi,
    getAdminReviewsApi,
    postAdminRoomApi,
    putAdminRoomApi,
    deleteAdminRoomApi,
    putAdminBookingApi,
    putAdminBookingStatusApi,
    postAdminUserApi,
    putAdminUserApi,
    deleteAdminUserApi
} = require('../Controllers/admin.controller');

router.post('/auth/login', postLogin);
router.post('/auth/register', postRegister);

router.get('/site-stats', getSiteStatsApi);

router.get('/rooms', getRoomsApi);
router.get('/rooms/:id', getRoomByIdApi);
router.get('/rooms/:id/availability', getRoomAvailabilityApi);

router.get('/reviews', getRoomReviewsApi);
router.post('/reviews', postRoomReviewApi);

router.post('/bookings', postBooking);
router.get('/bookings/my-bookings', getUserBookings);
router.get('/bookings/:id', getBookingById);
router.put('/bookings/:id/cancel', cancelBooking);

router.get('/admin/summary', getAdminSummaryApi);
router.get('/admin/bookings', getAdminBookingsApi);
router.get('/admin/users', getAdminUsersApi);
router.post('/admin/users', postAdminUserApi);
router.get('/admin/users/:id/bookings', getAdminUserBookingsApi);
router.put('/admin/users/:id', putAdminUserApi);
router.delete('/admin/users/:id', deleteAdminUserApi);
router.get('/admin/reviews', getAdminReviewsApi);
router.post('/admin/rooms', postAdminRoomApi);
router.put('/admin/rooms/:id', putAdminRoomApi);
router.delete('/admin/rooms/:id', deleteAdminRoomApi);
router.put('/admin/bookings/:id', putAdminBookingApi);
router.put('/admin/bookings/:id/status', putAdminBookingStatusApi);

module.exports = router;
