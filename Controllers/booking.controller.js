const pool = require('../Config/db.config');
const { sendBookingConfirmationEmail } = require('../service/Email.service');

exports.getBooking = async (req, res) => {
    const roomId = Number(req.query.room);
    if (!roomId) {
        return res.redirect('/room');
    }

    try {
        const roomResult = await pool.query(
            'SELECT id, name, price_per_night, image_url FROM rooms WHERE id = $1 LIMIT 1',
            [roomId]
        );

        if (roomResult.rows.length === 0) {
            return res.redirect('/room');
        }

        return res.render('Client/booking', {
            rooms: roomResult.rows,
            selectedRoom: roomResult.rows[0]
        });
    } catch (error) {
        console.error('Error loading selected booking room:', error);
        return res.redirect('/room');
    }
};

exports.getBookingConfirmation = (req, res) => {
    res.render('Client/booking-confirmation');
};

function isValidDateRange(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start;
}

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

    if (!bookingData.roomId || !bookingData.checkIn || !bookingData.checkOut || !bookingData.guests || !bookingData.guestName || !bookingData.guestEmail || !bookingData.guestPhone) {
        return res.status(400).json({
            status: 'error',
            message: 'Please fill all required booking fields.'
        });
    }

    try {
        if (!isValidDateRange(bookingData.checkIn, bookingData.checkOut)) {
            return res.status(400).json({ status: 'error', message: 'Check-out must be after check-in.' });
        }

        const roomPriceResult = await pool.query('SELECT name, price_per_night FROM rooms WHERE id = $1 LIMIT 1', [bookingData.roomId]);
        if (roomPriceResult.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Selected room not found.' });
        }

        const conflictQuery = `
            SELECT EXISTS (
                SELECT 1
                FROM bookings
                WHERE room_id = $1
                  AND status IN ('pending', 'confirmed')
                  AND check_in < $3::date
                  AND check_out > $2::date
            ) AS has_conflict
        `;
        const conflictResult = await pool.query(conflictQuery, [
            bookingData.roomId,
            bookingData.checkIn,
            bookingData.checkOut
        ]);

        if (conflictResult.rows[0].has_conflict) {
            return res.status(409).json({
                status: 'error',
                message: 'This room is already booked for the selected dates.'
            });
        }

        const start = new Date(bookingData.checkIn);
        const end = new Date(bookingData.checkOut);
        const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const subtotal = Number(roomPriceResult.rows[0].price_per_night) * nights;
        bookingData.totalPrice = Number((subtotal * 1.12).toFixed(2));

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

        try {
            await sendBookingConfirmationEmail({
                id: result.rows[0].id,
                roomName: roomPriceResult.rows[0].name,
                checkIn: bookingData.checkIn,
                checkOut: bookingData.checkOut,
                guests: bookingData.guests,
                totalPrice: bookingData.totalPrice,
                guestName: bookingData.guestName,
                guestEmail: bookingData.guestEmail
            });
        } catch (emailError) {
            console.error('Booking email notification failed:', emailError);
        }

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

exports.getBookingById = async (req, res) => {
    try {
        const bookingId = Number(req.params.id);
        if (!bookingId) {
            return res.status(400).json({ status: 'error', message: 'Invalid booking id.' });
        }

        const query = `
            SELECT
                b.id,
                b.room_id,
                b.check_in,
                b.check_out,
                b.guests,
                b.total_price,
                b.special_requests,
                b.guest_name,
                b.guest_email,
                b.guest_phone,
                b.status,
                b.created_at,
                COALESCE(r.name, 'Room Not Available') AS room_name,
                COALESCE(r.price_per_night, 0) AS rate_per_night
            FROM bookings b
            LEFT JOIN rooms r ON r.id = b.room_id
            WHERE b.id = $1
            LIMIT 1
        `;
        const result = await pool.query(query, [bookingId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Booking not found.' });
        }

        return res.status(200).json({ status: 'success', booking: result.rows[0] });
    } catch (error) {
        console.error('Error fetching booking by id:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to fetch booking.' });
    }
};

exports.getUserBookings = async (req, res) => {
    try {
        const email = String(req.query.email || '').trim();
        if (!email) {
            return res.status(400).json({ status: 'error', message: 'Email is required.' });
        }

        const query = `
            SELECT
                b.id,
                b.room_id,
                b.check_in,
                b.check_out,
                b.guests,
                b.total_price,
                b.special_requests,
                b.guest_name,
                b.guest_email,
                b.guest_phone,
                b.status,
                b.created_at,
                COALESCE(r.name, 'Room Not Available') AS room_name
            FROM bookings b
            LEFT JOIN rooms r ON r.id = b.room_id
            WHERE LOWER(b.guest_email) = LOWER($1)
            ORDER BY b.created_at DESC
        `;

        const result = await pool.query(query, [email]);
        return res.status(200).json({ status: 'success', bookings: result.rows });
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to fetch bookings.' });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const bookingId = Number(req.params.id);
        if (!bookingId) {
            return res.status(400).json({ status: 'error', message: 'Invalid booking id.' });
        }

        const query = `
            UPDATE bookings
            SET status = 'cancelled'
            WHERE id = $1
            RETURNING id, status
        `;
        const result = await pool.query(query, [bookingId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Booking not found.' });
        }

        return res.status(200).json({ status: 'success', booking: result.rows[0] });
    } catch (error) {
        console.error('Error cancelling booking:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to cancel booking.' });
    }
};
