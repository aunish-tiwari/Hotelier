const express = require('express');
const router = express.Router();
const { postRegister, postLogin } = require('../Controllers/auth.controller');
const {
    getRoomsApi,
    getRoomByIdApi,
    getRoomAvailabilityApi,
    getRoomReviewsApi,
    postRoomReviewApi
} = require('../Controllers/user.controller');
const {
    postBooking,
    getUserBookings,
    cancelBooking
} = require('../Controllers/booking.controller');
const {
    getAdminSummaryApi,
    getAdminBookingsApi,
    getAdminUsersApi,
    getAdminReviewsApi,
    postAdminRoomApi
} = require('../Controllers/admin.controller');

router.post('/auth/login', postLogin);
router.post('/auth/register', postRegister);

router.get('/rooms', getRoomsApi);
router.get('/rooms/:id', getRoomByIdApi);
router.get('/rooms/:id/availability', getRoomAvailabilityApi);

router.get('/reviews', getRoomReviewsApi);
router.post('/reviews', postRoomReviewApi);

router.post('/bookings', postBooking);
router.get('/bookings/my-bookings', getUserBookings);
router.put('/bookings/:id/cancel', cancelBooking);

router.get('/admin/summary', getAdminSummaryApi);
router.get('/admin/bookings', getAdminBookingsApi);
router.get('/admin/users', getAdminUsersApi);
router.get('/admin/reviews', getAdminReviewsApi);
router.post('/admin/rooms', postAdminRoomApi);

module.exports = router;
