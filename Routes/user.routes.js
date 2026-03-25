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

router.get('/', getHome);
router.get('/index', getHome);
router.get('/index.html', getHome);

router.get('/about', getAbout);
router.get('/about.html', getAbout);

router.get('/service', getService);
router.get('/service.html', getService);

router.get('/room', getRoom);
router.get('/rooms', getRoom);
router.get('/room.html', getRoom);
router.get('/rooms.html', getRoom);

router.get('/room-detail', getRoomDetail);
router.get('/room-detail.html', getRoomDetail);

router.get('/team', getTeam);
router.get('/team.html', getTeam);

router.get('/testimonial', getTestimonial);
router.get('/testimonial.html', getTestimonial);

router.get('/contact', getContact);
router.get('/contact.html', getContact);

router.get('/booking', getBooking);
router.get('/booking.html', getBooking);

router.get('/booking-confirmation', getBookingConfirmation);
router.get('/booking-confirmation.html', getBookingConfirmation);

router.post('/contact', postContact);
router.post('/booking', postBooking);

module.exports = router;
