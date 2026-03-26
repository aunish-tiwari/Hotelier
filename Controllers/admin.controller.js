const pool = require('../Config/db.config');

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
        const result = await pool.query(query);

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

        return res.render('admin/bookings', { bookings });
    } catch (error) {
        console.error('Error loading admin bookings:', error);
        return res.render('admin/bookings', { bookings: [] });
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

exports.getAdminSettings = (req, res) => {
    res.render('admin/settings');
};

exports.getAdminReports = (req, res) => {
    return res.render('admin/reports');
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
        const result = await pool.query('SELECT id, full_name, email, phone, role, created_at FROM users ORDER BY created_at DESC');
        return res.json({ status: 'success', users: result.rows });
    } catch (error) {
        console.error('Error loading admin users API:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to load users.' });
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
