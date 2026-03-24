const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../hotel.db');

// Create or open database
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database at:', DB_PATH);
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    db.serialize(() => {
        // Users table
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                phone TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error('Error creating users table:', err);
            else console.log('Users table initialized');
        });

        // Rooms table
        db.run(`
            CREATE TABLE IF NOT EXISTS rooms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                capacity INTEGER,
                amenities TEXT,
                image_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error('Error creating rooms table:', err);
            else console.log('Rooms table initialized');
        });

        // Bookings table
        db.run(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                room_id INTEGER NOT NULL,
                check_in DATE NOT NULL,
                check_out DATE NOT NULL,
                total_price REAL NOT NULL,
                status TEXT DEFAULT 'confirmed',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (room_id) REFERENCES rooms(id)
            )
        `, (err) => {
            if (err) console.error('Error creating bookings table:', err);
            else console.log('Bookings table initialized');
        });

        // Insert sample rooms if not exists
        db.all('SELECT COUNT(*) as count FROM rooms', (err, rows) => {
            if (rows && rows[0].count === 0) {
                const sampleRooms = [
                    ['Deluxe Suite', 'Spacious suite with ocean view', 150, 2, 'WiFi, AC, TV, Minibar', 'https://via.placeholder.com/300x200?text=Deluxe+Suite'],
                    ['Standard Room', 'Comfortable room with modern amenities', 100, 2, 'WiFi, AC, TV', 'https://via.placeholder.com/300x200?text=Standard+Room'],
                    ['Family Room', 'Large room perfect for families', 200, 4, 'WiFi, AC, TV, Kitchen', 'https://via.placeholder.com/300x200?text=Family+Room'],
                    ['Luxury Penthouse', 'Premium room with all luxury amenities', 300, 2, 'WiFi, AC, TV, Spa, Balcony', 'https://via.placeholder.com/300x200?text=Luxury+Penthouse']
                ];

                sampleRooms.forEach(room => {
                    db.run('INSERT INTO rooms (name, description, price, capacity, amenities, image_url) VALUES (?, ?, ?, ?, ?, ?)', room);
                });
                console.log('Sample rooms inserted');
            }
        });
    });
}

module.exports = db;
