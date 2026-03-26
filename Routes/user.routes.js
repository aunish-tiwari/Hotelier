const express = require('express');
const router = express.Router();
const {
    getHome,
    getAbout,
    getService,
    getRoom,
    getRoomDetail,
    getTeam,
    getTestimonial,
    getContact,
    postContact
} = require('../Controllers/user.controller');
const {
    getBooking,
    postBooking,
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

router.get('/team', getTeam);

router.get('/testimonial', getTestimonial);

router.get('/contact', getContact);

router.get('/booking', getBooking);

router.get('/booking-confirmation', getBookingConfirmation);

router.post('/contact', postContact);
router.post('/booking', postBooking);

module.exports = router;
