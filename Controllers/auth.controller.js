const pool = require('../Config/db.config');
const jwt = require('jsonwebtoken');
const { sendPasswordResetOtpEmail } = require('../service/Email.service');
const otpCache = require('../service/Otp.cache');

const JWT_SECRET = process.env.JWT_SECRET || 'hotelier_secret_key_2024';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

exports.getLogin = (req, res) => {
    res.render('Client/login');
};

exports.getRegister = (req, res) => {
    res.render('Client/register');
};

exports.getForgotPassword = (req, res) => {
    res.render('Client/forgot-password');
};

function generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

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

exports.postForgotPassword = async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const result = await pool.query('SELECT id, email FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [email]);

        if (result.rows.length > 0) {
            const otp = generateOtp();
            otpCache.setOtp(email, otp);
            await sendPasswordResetOtpEmail(email, otp);
        }

        return res.status(200).json({
            message: 'If the email exists, an OTP has been sent. It will expire in 10 minutes.'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({ message: 'Unable to send OTP. Please try again.' });
    }
};

exports.postResetPassword = async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const otp = String(req.body.otp || '').trim();
    const password = String(req.body.password || '');

    if (!email || !otp || !password) {
        return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    if (!otpCache.verifyOtp(email, otp)) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    try {
        const result = await pool.query(
            'UPDATE users SET password = $1 WHERE LOWER(email) = LOWER($2) RETURNING id',
            [password, email]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        otpCache.deleteOtp(email);
        return res.status(200).json({ message: 'Password reset successful. Please login with your new password.' });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ message: 'Unable to reset password. Please try again.' });
    }
};
