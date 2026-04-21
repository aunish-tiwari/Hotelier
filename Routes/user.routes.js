const express = require('express');
const router = express.Router();
const {
    getHome,
    getAbout,
    getService,
    getRoom,
    getRoomDetail,
    getMyBookings,
    getMyBookingDetails,
    getProfile,
    getTeam,
    getTestimonial,
    getContact,
    postContact
} = require('../Controllers/user.controller');
const {
    getBooking,
    getBookingConfirmation
} = require('../Controllers/booking.controller');

// Client routes - clean URLs only
router.get('/', getHome);
router.get('/index', getHome);

router.get('/about', getAbout);

router.get('/service', getService);

router.get('/room', getRoom);
router.get('/rooms', getRoom);

router.get('/room-detail', getRoomDetail);

router.get('/my-bookings', getMyBookings);
router.get('/my-bookings/:id', getMyBookingDetails);

router.get('/profile', getProfile);

router.get('/team', getTeam);

router.get('/testimonial', getTestimonial);

router.get('/contact', getContact);

router.get('/booking', getBooking);

router.get('/booking-confirmation', getBookingConfirmation);

router.post('/contact', postContact);

module.exports = router;
