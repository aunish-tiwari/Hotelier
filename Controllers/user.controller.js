const pool = require('../Config/db.config');

exports.getHome = (req, res) => {
    res.render('Client/Home');
};

exports.getAbout = (req, res) => {
    res.render('Client/about');
};

exports.getService = (req, res) => {
    res.render('Client/service');
};

exports.getRoom = (req, res) => {
    res.render('Client/room');
};

exports.getRoomDetail = (req, res) => {
    res.render('Client/room-detail');
};

exports.getMyBookings = (req, res) => {
    res.render('Client/my-bookings');
};

exports.getMyBookingDetails = (req, res) => {
    res.render('Client/my-booking-details');
};

exports.getProfile = (req, res) => {
    res.render('Client/profile');
};

exports.getTeam = (req, res) => {
    res.render('Client/team');
};

exports.getTestimonial = (req, res) => {
    res.render('Client/testimonial');
};

exports.getContact = (req, res) => {
    res.render('Client/contact', {
        formStatus: null,
        formMessage: null,
        formData: {}
    });
};

exports.postContact = async (req, res) => {
    const { name, email, subject, message } = req.body;
    const acceptsHeader = req.get('accept') || '';
    const isAjaxRequest = req.xhr || acceptsHeader.includes('application/json');

    const formData = {
        name: name ? name.trim() : '',
        email: email ? email.trim() : '',
        subject: subject ? subject.trim() : '',
        message: message ? message.trim() : ''
    };

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
        if (isAjaxRequest) {
            return res.status(400).json({
                status: 'error',
                message: 'Please fill in all fields before submitting.'
            });
        }

        return res.status(400).render('Client/contact', {
            formStatus: 'error',
            formMessage: 'Please fill in all fields before submitting.',
            formData
        });
    }

    try {
        const insertQuery = `
            INSERT INTO contacts (name, email, subject, message)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `;

        await pool.query(insertQuery, [
            formData.name,
            formData.email,
            formData.subject,
            formData.message
        ]);

        if (isAjaxRequest) {
            return res.status(201).json({
                status: 'success',
                message: 'Your message has been sent successfully.'
            });
        }

        return res.status(201).render('Client/contact', {
            formStatus: 'success',
            formMessage: 'Your message has been sent successfully.',
            formData: {}
        });
    } catch (error) {
        console.error('Error saving contact form:', error);

        if (isAjaxRequest) {
            return res.status(500).json({
                status: 'error',
                message: 'Something went wrong while sending your message. Please try again.'
            });
        }

        return res.status(500).render('Client/contact', {
            formStatus: 'error',
            formMessage: 'Something went wrong while sending your message. Please try again.',
            formData
        });
    }
};

exports.getSiteStatsApi = async (req, res) => {
    try {
        const [roomsResult, clientsResult, staffResult] = await Promise.all([
            pool.query('SELECT COUNT(*)::int AS count FROM rooms'),
            pool.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'user'"),
            pool.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin'")
        ]);

        return res.status(200).json({
            status: 'success',
            stats: {
                rooms: roomsResult.rows[0].count,
                clients: clientsResult.rows[0].count,
                staff: staffResult.rows[0].count
            }
        });
    } catch (error) {
        console.error('Error loading site stats:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to load site stats.' });
    }
};

exports.getRoomsApi = async (req, res) => {
    try {
        const {
            limit = 20,
            page = 1,
            minPrice,
            maxPrice,
            capacity,
            type,
            search
        } = req.query;

        const conditions = [];
        const values = [];

        if (minPrice) {
            values.push(Number(minPrice));
            conditions.push(`r.price_per_night >= $${values.length}`);
        }

        if (maxPrice) {
            values.push(Number(maxPrice));
            conditions.push(`r.price_per_night <= $${values.length}`);
        }

        if (capacity) {
            values.push(Number(capacity));
            conditions.push(`r.capacity >= $${values.length}`);
        }

        if (type) {
            values.push(`%${String(type).trim()}%`);
            conditions.push(`r.name ILIKE $${values.length}`);
        }

        if (search) {
            values.push(`%${String(search).trim()}%`);
            conditions.push(`(r.name ILIKE $${values.length} OR r.description ILIKE $${values.length})`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const pageNumber = Math.max(Number(page) || 1, 1);
        const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
        const offset = (pageNumber - 1) * limitNumber;

        values.push(limitNumber);
        const limitPlaceholder = `$${values.length}`;
        values.push(offset);
        const offsetPlaceholder = `$${values.length}`;

        const query = `
            SELECT
                r.id,
                r.name,
                r.price_per_night,
                r.beds,
                r.bathrooms,
                r.capacity,
                r.image_url,
                r.description,
                COALESCE(AVG(rv.rating), 0)::numeric(3,2) AS rating,
                COUNT(rv.id)::int AS review_count
            FROM rooms r
            LEFT JOIN reviews rv ON rv.room_id = r.id
            ${whereClause}
            GROUP BY r.id
            ORDER BY r.id ASC
            LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}
        `;

        const result = await pool.query(query, values);

        const rooms = result.rows.map((room) => ({
            ...room,
            images: room.image_url || 'img/room-1.jpg',
            amenities: 'WiFi, AC, TV, Room Service',
            available: true
        }));

        return res.status(200).json({
            status: 'success',
            rooms,
            page: pageNumber,
            limit: limitNumber
        });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to fetch rooms.' });
    }
};

exports.getRoomByIdApi = async (req, res) => {
    try {
        const roomId = Number(req.params.id);
        if (!roomId) {
            return res.status(400).json({ status: 'error', message: 'Invalid room id.' });
        }

        const query = `
            SELECT
                r.id,
                r.name,
                r.price_per_night,
                r.beds,
                r.bathrooms,
                r.capacity,
                r.image_url,
                r.description,
                COALESCE(AVG(rv.rating), 0)::numeric(3,2) AS rating,
                COUNT(rv.id)::int AS review_count,
                NOT EXISTS (
                    SELECT 1
                    FROM bookings b
                    WHERE b.room_id = r.id
                      AND b.status IN ('pending', 'confirmed')
                      AND b.check_out >= CURRENT_DATE
                ) AS available
            FROM rooms r
            LEFT JOIN reviews rv ON rv.room_id = r.id
            WHERE r.id = $1
            GROUP BY r.id
        `;

        const result = await pool.query(query, [roomId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Room not found.' });
        }

        const room = {
            ...result.rows[0],
            images: result.rows[0].image_url || 'img/room-1.jpg,img/room-2.jpg,img/room-3.jpg',
            amenities: 'WiFi, AC, TV, Room Service, Mini Bar, Safe'
        };

        return res.status(200).json(room);
    } catch (error) {
        console.error('Error fetching room by id:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to fetch room details.' });
    }
};

exports.getRoomAvailabilityApi = async (req, res) => {
    try {
        const roomId = Number(req.params.id);
        const checkIn = String(req.query.checkIn || '').trim();
        const checkOut = String(req.query.checkOut || '').trim();

        if (!roomId || !checkIn || !checkOut) {
            return res.status(400).json({ status: 'error', message: 'Room, check-in, and check-out are required.' });
        }

        const startDate = new Date(checkIn);
        const endDate = new Date(checkOut);

        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
            return res.status(400).json({ status: 'error', message: 'Invalid date range.' });
        }

        const overlapQuery = `
            SELECT EXISTS (
                SELECT 1
                FROM bookings
                WHERE room_id = $1
                  AND status IN ('pending', 'confirmed')
                  AND check_in < $3::date
                  AND check_out > $2::date
            ) AS has_conflict
        `;

        const overlapResult = await pool.query(overlapQuery, [
            roomId,
            checkIn,
            checkOut
        ]);

        const available = !overlapResult.rows[0].has_conflict;
        return res.status(200).json({ status: 'success', available });
    } catch (error) {
        console.error('Error checking room availability:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to check availability.' });
    }
};

exports.getRoomReviewsApi = async (req, res) => {
    try {
        const roomId = Number(req.query.room_id || req.query.roomId);
        if (!roomId) {
            const latestReviewsQuery = `
                SELECT
                    rv.id,
                    rv.room_id,
                    COALESCE(NULLIF(rv.guest_name, ''), 'Guest') AS guest_name,
                    rv.rating,
                    rv.comment,
                    rv.created_at,
                    r.name AS room_name
                FROM reviews rv
                LEFT JOIN rooms r ON r.id = rv.room_id
                ORDER BY rv.created_at DESC
                LIMIT 12
            `;
            const latestReviews = await pool.query(latestReviewsQuery);
            return res.status(200).json({ status: 'success', reviews: latestReviews.rows });
        }

        const query = `
            SELECT
                id,
                room_id,
                COALESCE(NULLIF(guest_name, ''), 'Guest') AS guest_name,
                rating,
                comment,
                created_at
            FROM reviews
            WHERE room_id = $1
            ORDER BY created_at DESC
        `;
        const result = await pool.query(query, [roomId]);
        return res.status(200).json({ status: 'success', reviews: result.rows });
    } catch (error) {
        console.error('Error fetching room reviews:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to fetch reviews.' });
    }
};

exports.postRoomReviewApi = async (req, res) => {
    try {
        const { room_id, guest_name, rating, comment } = req.body;

        if (!room_id || !rating) {
            return res.status(400).json({ status: 'error', message: 'Room and rating are required.' });
        }

        const insertQuery = `
            INSERT INTO reviews (room_id, guest_name, rating, comment)
            VALUES ($1, $2, $3, $4)
            RETURNING id, room_id, guest_name, rating, comment, created_at
        `;

        const result = await pool.query(insertQuery, [
            Number(room_id),
            (guest_name || 'Guest').trim(),
            Number(rating),
            (comment || '').trim() || null
        ]);

        return res.status(201).json({ status: 'success', review: result.rows[0] });
    } catch (error) {
        console.error('Error creating review:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to submit review.' });
    }
};
