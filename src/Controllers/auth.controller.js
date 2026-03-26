const pool = require('../Config/db.config');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'hotelier_secret_key_2024';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

exports.getLogin = (req, res) => {
    res.render('Client/login');
};

exports.getRegister = (req, res) => {
    res.render('Client/register');
};

exports.postRegister = async (req, res) => {
    try {
        const {name,email,password,phone} = req.body;

        if (!name || !email || !password || !phone) {
            return res.status(400).json({message: 'All fields are required'});
        }

        const duplicateCheck = 'SELECT id FROM users WHERE email = $1 LIMIT 1';
        const duplicateUser = await pool.query(duplicateCheck, [email]);
        if (duplicateUser.rows.length > 0) {
            return res.status(409).json({message: 'Duplicate email. User already exists'});
        }

        const query = 'INSERT INTO users (full_name, email, password, phone) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, phone';
        const values = [name, email, password, phone];
        const result = await pool.query(query, values);

        console.log('Registered user:', {name, email, phone});
        return res.status(201).json({
            message: 'User registered successfully',
            user: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({message: 'Duplicate email. User already exists'});
        }
        console.error('Registration error:', error.stack);
        return res.status(500).json({message: 'Internal server error'});
    }
};

exports.postLogin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const verifyUser = `SELECT * FROM users WHERE email = $1 AND password = $2`;
    
    try {
        const result = await pool.query(verifyUser, [email, password]);

        if (result.rows.length > 0) {
            const loggedInUser = result.rows[0];
            
            // Generate JWT token
            const token = jwt.sign(
                {
                    id: loggedInUser.id,
                    email: loggedInUser.email,
                    name: loggedInUser.full_name,
                    role: loggedInUser.role
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRY }
            );

            return res.status(200).json({
                message: 'Login successful',
                token,
                user: {
                    id: loggedInUser.id,
                    name: loggedInUser.full_name,
                    email: loggedInUser.email,
                    phone: loggedInUser.phone,
                    role: loggedInUser.role
                }
            });
        } else {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Error executing query', error.stack);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Middleware to verify JWT token
exports.verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};