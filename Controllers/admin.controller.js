const pool = require('../Config/db.config');
const { sendMail } = require('../service/Email.service');

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function contactsNoticeRedirect(message) {
    return `/admin/contacts?notice=${encodeURIComponent(message)}`;
}

async function getDashboardStats() {
    const [roomCount, bookingCount, userCount, revenueResult] = await Promise.all([
        pool.query('SELECT COUNT(*)::int AS count FROM rooms'),
        pool.query('SELECT COUNT(*)::int AS count FROM bookings'),
        pool.query('SELECT COUNT(*)::int AS count FROM users'),
        pool.query("SELECT COALESCE(SUM(total_price), 0)::numeric(12,2) AS total FROM bookings WHERE date_trunc('month', created_at) = date_trunc('month', now())")
    ]);

    return {
        totalRooms: roomCount.rows[0].count,
        totalBookings: bookingCount.rows[0].count,
        totalUsers: userCount.rows[0].count,
        totalRevenue: Number(revenueResult.rows[0].total || 0)
    };
}

async function getRecentBookings(limit = 8) {
    const query = `
        SELECT
            b.id,
            b.guest_name,
            b.guest_email,
            b.check_in,
            b.check_out,
            b.total_price,
            b.status,
            COALESCE(r.name, 'Room Not Available') AS room_name,
            COALESCE(r.price_per_night, 0) AS room_price
        FROM bookings b
        LEFT JOIN rooms r ON r.id = b.room_id
        ORDER BY b.created_at DESC
        LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
}

async function ensureContactReplyColumns() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS contacts (
            id SERIAL PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            email VARCHAR(255) NOT NULL,
            subject VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        )
    `);

    await pool.query(`
        ALTER TABLE contacts
        ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'new',
        ADD COLUMN IF NOT EXISTS reply_message TEXT,
        ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS replied_by VARCHAR(150)
    `);
}

exports.getAdminLogin = (req, res) => {
    return res.redirect('/login');
};

exports.getAdminDashboard = async (req, res) => {
    try {
        const [stats, recentBookings] = await Promise.all([
            getDashboardStats(),
            getRecentBookings(8)
        ]);

        return res.render('admin/index', {
            stats,
            recentBookings
        });
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        return res.render('admin/index', {
            stats: {
                totalRooms: 0,
                totalBookings: 0,
                totalUsers: 0,
                totalRevenue: 0
            },
            recentBookings: []
        });
    }
};

exports.getAdminRooms = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM rooms ORDER BY id DESC');
        return res.render('admin/rooms', { rooms: result.rows });
    } catch (error) {
        console.error('Error loading admin rooms:', error);
        return res.render('admin/rooms', { rooms: [] });
    }
};

exports.getAdminBookings = async (req, res) => {
    try {
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
                COALESCE(r.price_per_night, 0) AS room_price
            FROM bookings b
            LEFT JOIN rooms r ON r.id = b.room_id
            ORDER BY b.created_at DESC
        `;
        const [result, roomsResult] = await Promise.all([
            pool.query(query),
            pool.query('SELECT id, name, price_per_night, capacity FROM rooms ORDER BY name ASC')
        ]);

        const bookings = result.rows.map((b) => {
            const subtotal = Number(b.total_price || 0) / 1.12;
            const tax = Number(b.total_price || 0) - subtotal;
            return {
                id: `BK-${String(b.id).padStart(3, '0')}`,
                rawId: b.id,
                guest: {
                    name: b.guest_name,
                    email: b.guest_email,
                    phone: b.guest_phone
                },
                room: {
                    id: b.room_id,
                    name: b.room_name,
                    type: b.room_name,
                    price: Number(b.room_price || 0)
                },
                checkIn: b.check_in,
                checkOut: b.check_out,
                guests: b.guests,
                subtotal: Number(subtotal.toFixed(2)),
                tax: Number(tax.toFixed(2)),
                total: Number(b.total_price || 0),
                status: b.status || 'pending',
                paymentStatus: b.status === 'cancelled' ? 'refunded' : 'paid',
                specialRequest: b.special_requests || ''
            };
        });

        return res.render('admin/bookings', { bookings, rooms: roomsResult.rows });
    } catch (error) {
        console.error('Error loading admin bookings:', error);
        return res.render('admin/bookings', { bookings: [], rooms: [] });
    }
};

exports.getAdminUsers = async (req, res) => {
    try {
        const query = `
            SELECT
                u.id,
                u.full_name,
                u.email,
                u.phone,
                u.role,
                u.created_at,
                COALESCE(COUNT(b.id), 0)::int AS booking_count
            FROM users u
            LEFT JOIN bookings b ON b.guest_email = u.email
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `;
        const result = await pool.query(query);
        return res.render('admin/users', { users: result.rows });
    } catch (error) {
        console.error('Error loading admin users:', error);
        return res.render('admin/users', { users: [] });
    }
};

exports.getAdminReviews = async (req, res) => {
    try {
        const query = `
            SELECT
                rv.id,
                rv.guest_name,
                rv.rating,
                rv.comment,
                rv.created_at,
                rv.room_id,
                COALESCE(r.name, 'Room Not Available') AS room_name
            FROM reviews rv
            LEFT JOIN rooms r ON r.id = rv.room_id
            ORDER BY rv.created_at DESC
        `;
        const result = await pool.query(query);
        return res.render('admin/reviews', { reviews: result.rows });
    } catch (error) {
        console.error('Error loading admin reviews:', error);
        return res.render('admin/reviews', { reviews: [] });
    }
};

exports.getAdminContacts = async (req, res) => {
    try {
        await ensureContactReplyColumns();

        const result = await pool.query(`
            SELECT
                id,
                name,
                email,
                subject,
                message,
                created_at,
                COALESCE(status, 'new') AS status,
                reply_message,
                replied_at,
                replied_by
            FROM contacts
            ORDER BY created_at DESC
        `);

        return res.render('admin/contacts', {
            contacts: result.rows,
            notice: req.query.notice || '',
            error: ''
        });
    } catch (error) {
        console.error('Error loading admin contacts:', error);
        return res.render('admin/contacts', {
            contacts: [],
            notice: '',
            error: 'Failed to load contact messages.'
        });
    }
};

exports.postAdminContactReply = async (req, res) => {
    try {
        await ensureContactReplyColumns();

        const contactId = Number(req.params.id);
        const replyMessage = String(req.body.reply_message || '').trim();

        if (!contactId || !replyMessage) {
            return res.redirect(contactsNoticeRedirect('Reply message is required.'));
        }

        const contactResult = await pool.query('SELECT * FROM contacts WHERE id = $1 LIMIT 1', [contactId]);
        if (contactResult.rows.length === 0) {
            return res.redirect(contactsNoticeRedirect('Contact message was not found.'));
        }

        const contact = contactResult.rows[0];

        await sendMail({
            to: contact.email,
            subject: `Re: ${contact.subject}`,
            text: [
                `Hello ${contact.name},`,
                '',
                replyMessage,
                '',
                'Regards,',
                'Hotelier Admin Team'
            ].join('\n'),
            html: `
                <p>Hello ${escapeHtml(contact.name)},</p>
                <p>${escapeHtml(replyMessage).replace(/\n/g, '<br>')}</p>
                <p>Regards,<br>Hotelier Admin Team</p>
            `
        });

        await pool.query(
            `
                UPDATE contacts
                SET status = 'replied',
                    reply_message = $1,
                    replied_at = NOW(),
                    replied_by = 'Admin'
                WHERE id = $2
            `,
            [replyMessage, contactId]
        );

        return res.redirect(contactsNoticeRedirect('Reply sent successfully.'));
    } catch (error) {
        console.error('Error replying to contact:', error);
        return res.redirect(contactsNoticeRedirect('Failed to send reply.'));
    }
};

exports.getAdminSummaryApi = async (req, res) => {
    try {
        const stats = await getDashboardStats();
        return res.json({ status: 'success', stats });
    } catch (error) {
        console.error('Error loading admin summary API:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to load summary.' });
    }
};

exports.getAdminBookingsApi = async (req, res) => {
    try {
        const rows = await getRecentBookings(100);
        return res.json({ status: 'success', bookings: rows });
    } catch (error) {
        console.error('Error loading admin bookings API:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to load bookings.' });
    }
};

exports.getAdminUsersApi = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                u.id,
                u.full_name,
                u.email,
                u.phone,
                u.role,
                u.created_at,
                COALESCE(COUNT(b.id), 0)::int AS booking_count
            FROM users u
            LEFT JOIN bookings b ON LOWER(b.guest_email) = LOWER(u.email)
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `);
        return res.json({ status: 'success', users: result.rows });
    } catch (error) {
        console.error('Error loading admin users API:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to load users.' });
    }
};

exports.getAdminUserBookingsApi = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        if (!userId) {
            return res.status(400).json({ status: 'error', message: 'Invalid user id.' });
        }

        const userResult = await pool.query('SELECT email FROM users WHERE id = $1 LIMIT 1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'User not found.' });
        }

        const query = `
            SELECT
                b.id,
                b.check_in,
                b.check_out,
                b.total_price,
                b.status,
                COALESCE(r.name, 'Room Not Available') AS room_name
            FROM bookings b
            LEFT JOIN rooms r ON r.id = b.room_id
            WHERE LOWER(b.guest_email) = LOWER($1)
            ORDER BY b.created_at DESC
            LIMIT 10
        `;
        const result = await pool.query(query, [userResult.rows[0].email]);

        return res.status(200).json({ status: 'success', bookings: result.rows });
    } catch (error) {
        console.error('Error loading user bookings:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to load user bookings.' });
    }
};

exports.postAdminUserApi = async (req, res) => {
    try {
        const {
            full_name,
            name,
            email,
            phone,
            password,
            role
        } = req.body;

        const userName = String(full_name || name || '').trim();
        const userEmail = String(email || '').trim().toLowerCase();
        const userPhone = phone ? String(phone).trim() : null;
        const userRole = String(role || 'user').trim().toLowerCase();

        if (!userName || !userEmail || !password) {
            return res.status(400).json({ status: 'error', message: 'Name, email, and password are required.' });
        }

        if (!['user', 'admin'].includes(userRole)) {
            return res.status(400).json({ status: 'error', message: 'Invalid user role.' });
        }

        const query = `
            INSERT INTO users (full_name, email, phone, password, role)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, full_name, email, phone, role, created_at
        `;
        const result = await pool.query(query, [
            userName,
            userEmail,
            userPhone,
            String(password),
            userRole
        ]);

        return res.status(201).json({
            status: 'success',
            message: 'User added successfully.',
            user: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ status: 'error', message: 'A user with this email already exists.' });
        }

        console.error('Error adding admin user:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to add user.' });
    }
};

exports.putAdminUserApi = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        if (!userId) {
            return res.status(400).json({ status: 'error', message: 'Invalid user id.' });
        }

        const {
            full_name,
            name,
            email,
            phone,
            password,
            role
        } = req.body;

        const userName = String(full_name || name || '').trim();
        const userEmail = String(email || '').trim().toLowerCase();
        const userPhone = phone ? String(phone).trim() : null;
        const userRole = String(role || 'user').trim().toLowerCase();

        if (!userName || !userEmail) {
            return res.status(400).json({ status: 'error', message: 'Name and email are required.' });
        }

        if (!['user', 'admin'].includes(userRole)) {
            return res.status(400).json({ status: 'error', message: 'Invalid user role.' });
        }

        const existingResult = await pool.query('SELECT email FROM users WHERE id = $1 LIMIT 1', [userId]);
        if (existingResult.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'User not found.' });
        }

        const oldEmail = existingResult.rows[0].email;
        let result;

        if (password) {
            result = await pool.query(
                `
                    UPDATE users
                    SET full_name = $1, email = $2, phone = $3, password = $4, role = $5, updated_at = NOW()
                    WHERE id = $6
                    RETURNING id, full_name, email, phone, role, created_at
                `,
                [userName, userEmail, userPhone, String(password), userRole, userId]
            );
        } else {
            result = await pool.query(
                `
                    UPDATE users
                    SET full_name = $1, email = $2, phone = $3, role = $4, updated_at = NOW()
                    WHERE id = $5
                    RETURNING id, full_name, email, phone, role, created_at
                `,
                [userName, userEmail, userPhone, userRole, userId]
            );
        }

        await pool.query(
            'UPDATE bookings SET guest_name = $1, guest_email = $2, guest_phone = $3 WHERE LOWER(guest_email) = LOWER($4)',
            [userName, userEmail, userPhone || '', oldEmail]
        );

        return res.status(200).json({
            status: 'success',
            message: 'User updated successfully.',
            user: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ status: 'error', message: 'A user with this email already exists.' });
        }

        console.error('Error updating admin user:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to update user.' });
    }
};

exports.deleteAdminUserApi = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        if (!userId) {
            return res.status(400).json({ status: 'error', message: 'Invalid user id.' });
        }

        const userResult = await pool.query('SELECT email FROM users WHERE id = $1 LIMIT 1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'User not found.' });
        }

        await pool.query('DELETE FROM bookings WHERE LOWER(guest_email) = LOWER($1)', [userResult.rows[0].email]);
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);

        return res.status(200).json({
            status: 'success',
            message: 'User deleted successfully.'
        });
    } catch (error) {
        console.error('Error deleting admin user:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to delete user.' });
    }
};

exports.getAdminReviewsApi = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, room_id, guest_name, rating, comment, created_at FROM reviews ORDER BY created_at DESC');
        return res.json({ status: 'success', reviews: result.rows });
    } catch (error) {
        console.error('Error loading admin reviews API:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to load reviews.' });
    }
};

exports.postAdminRoomApi = async (req, res) => {
    try {
        const {
            name,
            price_per_night,
            beds,
            bathrooms,
            capacity,
            image_url,
            description
        } = req.body;

        if (!name || !price_per_night || !capacity || !beds || !bathrooms) {
            return res.status(400).json({
                status: 'error',
                message: 'Name, price, capacity, beds, and bathrooms are required.'
            });
        }

        const insertQuery = `
            INSERT INTO rooms (
                name,
                price_per_night,
                beds,
                bathrooms,
                capacity,
                image_url,
                description
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, name, price_per_night, beds, bathrooms, capacity, image_url, description, created_at
        `;

        const values = [
            String(name).trim(),
            Number(price_per_night),
            Number(beds),
            Number(bathrooms),
            Number(capacity),
            image_url ? String(image_url).trim() : null,
            description ? String(description).trim() : null
        ];

        const result = await pool.query(insertQuery, values);
        return res.status(201).json({
            status: 'success',
            message: 'Room added successfully.',
            room: result.rows[0]
        });
    } catch (error) {
        console.error('Error adding room:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to add room.' });
    }
};

exports.putAdminRoomApi = async (req, res) => {
    try {
        const roomId = Number(req.params.id);
        if (!roomId) {
            return res.status(400).json({ status: 'error', message: 'Invalid room id.' });
        }

        const {
            name,
            price_per_night,
            beds,
            bathrooms,
            capacity,
            image_url,
            description
        } = req.body;

        if (!name || !price_per_night || !capacity || !beds || !bathrooms) {
            return res.status(400).json({
                status: 'error',
                message: 'Name, price, capacity, beds, and bathrooms are required.'
            });
        }

        const updateQuery = `
            UPDATE rooms
            SET
                name = $1,
                price_per_night = $2,
                beds = $3,
                bathrooms = $4,
                capacity = $5,
                image_url = $6,
                description = $7
            WHERE id = $8
            RETURNING id, name, price_per_night, beds, bathrooms, capacity, image_url, description, created_at
        `;

        const result = await pool.query(updateQuery, [
            String(name).trim(),
            Number(price_per_night),
            Number(beds),
            Number(bathrooms),
            Number(capacity),
            image_url ? String(image_url).trim() : null,
            description ? String(description).trim() : null,
            roomId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Room not found.' });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Room updated successfully.',
            room: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating room:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to update room.' });
    }
};

exports.deleteAdminRoomApi = async (req, res) => {
    try {
        const roomId = Number(req.params.id);
        if (!roomId) {
            return res.status(400).json({ status: 'error', message: 'Invalid room id.' });
        }

        await pool.query('UPDATE bookings SET status = $1 WHERE room_id = $2 AND status <> $1', ['cancelled', roomId]);
        const result = await pool.query('DELETE FROM rooms WHERE id = $1 RETURNING id', [roomId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Room not found.' });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Room deleted successfully.'
        });
    } catch (error) {
        console.error('Error deleting room:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to delete room.' });
    }
};

exports.putAdminBookingStatusApi = async (req, res) => {
    try {
        const bookingId = Number(req.params.id);
        const status = String(req.body.status || '').trim().toLowerCase();
        const allowedStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];

        if (!bookingId) {
            return res.status(400).json({ status: 'error', message: 'Invalid booking id.' });
        }

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ status: 'error', message: 'Invalid booking status.' });
        }

        const result = await pool.query(
            'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING id, status',
            [status, bookingId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Booking not found.' });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Booking status updated successfully.',
            booking: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating booking status:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to update booking status.' });
    }
};

exports.putAdminBookingApi = async (req, res) => {
    try {
        const bookingId = Number(req.params.id);
        if (!bookingId) {
            return res.status(400).json({ status: 'error', message: 'Invalid booking id.' });
        }

        const {
            room_id,
            check_in,
            check_out,
            guests,
            special_requests,
            guest_name,
            guest_email,
            guest_phone,
            status
        } = req.body;

        const bookingData = {
            roomId: room_id ? Number(room_id) : null,
            checkIn: check_in ? String(check_in).trim() : '',
            checkOut: check_out ? String(check_out).trim() : '',
            guests: guests ? Number(guests) : null,
            specialRequests: special_requests ? String(special_requests).trim() : null,
            guestName: guest_name ? String(guest_name).trim() : '',
            guestEmail: guest_email ? String(guest_email).trim() : '',
            guestPhone: guest_phone ? String(guest_phone).trim() : '',
            status: String(status || 'pending').trim().toLowerCase()
        };

        const allowedStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        const start = new Date(bookingData.checkIn);
        const end = new Date(bookingData.checkOut);

        if (!bookingData.roomId || !bookingData.checkIn || !bookingData.checkOut || !bookingData.guests || !bookingData.guestName || !bookingData.guestEmail || !bookingData.guestPhone) {
            return res.status(400).json({ status: 'error', message: 'Please fill all required booking fields.' });
        }

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
            return res.status(400).json({ status: 'error', message: 'Check-out must be after check-in.' });
        }

        if (!allowedStatuses.includes(bookingData.status)) {
            return res.status(400).json({ status: 'error', message: 'Invalid booking status.' });
        }

        const roomResult = await pool.query('SELECT price_per_night FROM rooms WHERE id = $1 LIMIT 1', [bookingData.roomId]);
        if (roomResult.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Selected room not found.' });
        }

        const conflictQuery = `
            SELECT EXISTS (
                SELECT 1
                FROM bookings
                WHERE id <> $1
                  AND room_id = $2
                  AND status IN ('pending', 'confirmed')
                  AND check_in < $4::date
                  AND check_out > $3::date
            ) AS has_conflict
        `;
        const conflictResult = await pool.query(conflictQuery, [
            bookingId,
            bookingData.roomId,
            bookingData.checkIn,
            bookingData.checkOut
        ]);

        if (conflictResult.rows[0].has_conflict) {
            return res.status(409).json({ status: 'error', message: 'This room is already booked for the selected dates.' });
        }

        const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const subtotal = Number(roomResult.rows[0].price_per_night) * nights;
        const totalPrice = Number((subtotal * 1.12).toFixed(2));

        const updateQuery = `
            UPDATE bookings
            SET
                room_id = $1,
                check_in = $2,
                check_out = $3,
                guests = $4,
                total_price = $5,
                special_requests = $6,
                guest_name = $7,
                guest_email = $8,
                guest_phone = $9,
                status = $10
            WHERE id = $11
            RETURNING id, status, total_price
        `;

        const result = await pool.query(updateQuery, [
            bookingData.roomId,
            bookingData.checkIn,
            bookingData.checkOut,
            bookingData.guests,
            totalPrice,
            bookingData.specialRequests,
            bookingData.guestName,
            bookingData.guestEmail,
            bookingData.guestPhone,
            bookingData.status,
            bookingId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Booking not found.' });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Booking updated successfully.',
            booking: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating booking:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to update booking.' });
    }
};
