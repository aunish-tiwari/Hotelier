const db = require('../config/db.config');
const { hashPassword, comparePassword } = require('../config/auth.config');

class User {
    // Create a new user
    static async create(name, email, password, phone) {
        return new Promise(async (resolve, reject) => {
            try {
                const hashedPassword = await hashPassword(password);
                const query = 'INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)';

                db.run(query, [name, email, hashedPassword, phone], function (err) {
                    if (err) {
                        if (err.message.includes('UNIQUE')) {
                            reject(new Error('Email already registered'));
                        } else {
                            reject(err);
                        }
                    } else {
                        resolve({ id: this.lastID, name, email, phone });
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    // Find user by email
    static async findByEmail(email) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM users WHERE email = ?';
            db.get(query, [email], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // Find user by ID
    static async findById(id) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT id, name, email, phone, created_at FROM users WHERE id = ?';
            db.get(query, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // Verify login credentials
    static async verifyLogin(email, password) {
        return new Promise(async (resolve, reject) => {
            try {
                const user = await this.findByEmail(email);
                if (!user) {
                    return reject(new Error('Invalid email or password'));
                }

                const isPasswordValid = await comparePassword(password, user.password);
                if (!isPasswordValid) {
                    return reject(new Error('Invalid email or password'));
                }

                // Return user without password
                const { password: _, ...userWithoutPassword } = user;
                resolve(userWithoutPassword);
            } catch (error) {
                reject(error);
            }
        });
    }

    // Get all users (admin)
    static async getAll() {
        return new Promise((resolve, reject) => {
            const query = 'SELECT id, name, email, phone, created_at FROM users';
            db.all(query, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Update user
    static async update(id, name, phone) {
        return new Promise((resolve, reject) => {
            const query = 'UPDATE users SET name = ?, phone = ? WHERE id = ?';
            db.run(query, [name, phone, id], function (err) {
                if (err) reject(err);
                else resolve({ id, name, phone });
            });
        });
    }

    // Delete user
    static async delete(id) {
        return new Promise((resolve, reject) => {
            const query = 'DELETE FROM users WHERE id = ?';
            db.run(query, [id], function (err) {
                if (err) reject(err);
                else resolve({ success: true });
            });
        });
    }
}

module.exports = User;
