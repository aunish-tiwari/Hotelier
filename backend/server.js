const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db.config');
const { generateToken, authenticateToken } = require('./config/auth.config');
const User = require('./models/user.model');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

// ==================== AUTHENTICATION ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        // Create user
        const user = await User.create(name, email, password, phone);

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone
            }
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.verifyLogin(email, password);
        const token = generateToken(user.id, user.email);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone
            }
        });
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        res.json({ user });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// ==================== ROOM ROUTES ====================

// Get all rooms with pagination
app.get('/api/rooms', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        db.all('SELECT * FROM rooms LIMIT ? OFFSET ?', [limit, offset], (err, rows) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }

            // Format rooms to match frontend expectations
            const formattedRooms = rows.map(room => ({
                ...room,
                price_per_night: room.price,
                images: room.image_url,
                beds: 2,
                bathrooms: 2,
                rating: 4
            }));

            res.json({
                message: 'Rooms fetched successfully',
                data: formattedRooms,
                rooms: formattedRooms
            });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get room by ID
app.get('/api/rooms/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.get('SELECT * FROM rooms WHERE id = ?', [id], (err, row) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }
            if (!row) {
                return res.status(404).json({ message: 'Room not found' });
            }
            res.json({
                message: 'Room fetched successfully',
                room: row
            });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Check room availability
app.get('/api/rooms/:id/availability', (req, res) => {
    try {
        const { id } = req.params;
        const { checkIn, checkOut } = req.query;

        if (!checkIn || !checkOut) {
            return res.status(400).json({ message: 'Check-in and check-out dates are required' });
        }

        const query = `
            SELECT COUNT(*) as count FROM bookings 
            WHERE room_id = ? AND status = 'confirmed' 
            AND ((check_in <= ? AND check_out > ?) OR (check_in < ? AND check_out >= ?))
        `;

        db.get(query, [id, checkOut, checkIn, checkOut, checkIn], (err, row) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }

            const isAvailable = row.count === 0;
            res.json({
                available: isAvailable,
                message: isAvailable ? 'Room is available' : 'Room is not available for selected dates'
            });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== BOOKING ROUTES ====================

// Create booking
app.post('/api/bookings', authenticateToken, async (req, res) => {
    try {
        const { roomId, checkIn, checkOut, totalPrice } = req.body;
        const userId = req.user.userId;

        if (!roomId || !checkIn || !checkOut || !totalPrice) {
            return res.status(400).json({ message: 'All booking fields are required' });
        }

        db.run(
            'INSERT INTO bookings (user_id, room_id, check_in, check_out, total_price, status) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, roomId, checkIn, checkOut, totalPrice, 'confirmed'],
            function (err) {
                if (err) {
                    return res.status(500).json({ message: err.message });
                }

                res.status(201).json({
                    message: 'Booking created successfully',
                    booking: {
                        id: this.lastID,
                        userId,
                        roomId,
                        checkIn,
                        checkOut,
                        totalPrice,
                        status: 'confirmed'
                    }
                });
            }
        );
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get user bookings
app.get('/api/bookings/my-bookings', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        const query = `
            SELECT b.*, r.name as room_name, r.price as room_price 
            FROM bookings b 
            JOIN rooms r ON b.room_id = r.id 
            WHERE b.user_id = ? 
            ORDER BY b.created_at DESC
        `;

        db.all(query, [userId], (err, rows) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }
            res.json({
                message: 'Bookings fetched successfully',
                bookings: rows
            });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Cancel booking
app.put('/api/bookings/:id/cancel', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        db.run(
            'UPDATE bookings SET status = ? WHERE id = ? AND user_id = ?',
            ['cancelled', id, userId],
            function (err) {
                if (err) {
                    return res.status(500).json({ message: err.message });
                }

                if (this.changes === 0) {
                    return res.status(404).json({ message: 'Booking not found' });
                }

                res.json({ message: 'Booking cancelled successfully' });
            }
        );
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
    console.log(`Hotel Backend Server running on http://localhost:${PORT}`);
    console.log(`API Base URL: http://localhost:${PORT}/api`);
});
