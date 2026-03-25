const pool = require('../Config/db.config');

exports.getBooking = async (req, res) => {
    try {
        const roomQuery = `
            SELECT id, name, price_per_night
            FROM rooms
            ORDER BY id ASC
        `;
        const roomResult = await pool.query(roomQuery);

        return res.render('booking', {
            rooms: roomResult.rows
        });
    } catch (error) {
        console.error('Error loading booking page rooms:', error);
        return res.render('booking', {
            rooms: []
        });
    }
};

exports.getBookingConfirmation = (req, res) => {
    res.render('booking-confirmation');
};

exports.postBooking = async (req, res) => {
    const {
        room_id,
        check_in,
        check_out,
        guests,
        total_price,
        special_requests,
        guest_name,
        guest_email,
        guest_phone
    } = req.body;

    const bookingData = {
        roomId: room_id ? Number(room_id) : null,
        checkIn: check_in ? String(check_in).trim() : '',
        checkOut: check_out ? String(check_out).trim() : '',
        guests: guests ? Number(guests) : null,
        totalPrice: total_price ? Number(total_price) : null,
        specialRequests: special_requests ? String(special_requests).trim() : null,
        guestName: guest_name ? String(guest_name).trim() : '',
        guestEmail: guest_email ? String(guest_email).trim() : '',
        guestPhone: guest_phone ? String(guest_phone).trim() : ''
    };

    if (!bookingData.roomId || !bookingData.checkIn || !bookingData.checkOut || !bookingData.guests || !bookingData.totalPrice || !bookingData.guestName || !bookingData.guestEmail || !bookingData.guestPhone) {
        return res.status(400).json({
            status: 'error',
            message: 'Please fill all required booking fields.'
        });
    }

    try {
        const insertQuery = `
            INSERT INTO bookings (
                room_id,
                check_in,
                check_out,
                guests,
                total_price,
                special_requests,
                guest_name,
                guest_email,
                guest_phone
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id
        `;

        const result = await pool.query(insertQuery, [
            bookingData.roomId,
            bookingData.checkIn,
            bookingData.checkOut,
            bookingData.guests,
            bookingData.totalPrice,
            bookingData.specialRequests,
            bookingData.guestName,
            bookingData.guestEmail,
            bookingData.guestPhone
        ]);

        return res.status(201).json({
            status: 'success',
            message: 'Booking created successfully.',
            booking: {
                id: result.rows[0].id
            }
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to create booking. Please try again.'
        });
    }
};