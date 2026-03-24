const pool = require('../Config/db.config');

exports.getLogin = (req,res)=>{
    res.render('login');
}

exports.getRegister = (req,res)=>{
    res.render('register');
}

exports.postRegister = async (req,res)=>{
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
}

exports.postLogin = (req,res)=>{
    const {email,password} = req.body;
    const verifyUser = `SELECT * FROM users WHERE email = $1 AND password = $2`;
    pool.query(verifyUser, [email, password], (err, result) => {
        if (err) {
            console.error('Error executing query', err.stack);
            return res.status(500).json({message: 'Internal server error'});
        }
        if (result.rows.length > 0) {
            return res.status(200).json({
                message: 'Login successful',
                user: {
                    id: result.rows[0].id,
                    name: result.rows[0].name,
                    email: result.rows[0].email,
                    phone: result.rows[0].phone
                }
            });
        } else {
            return res.status(401).json({message: 'Invalid email or password'});
        }
    });
    console.log('Logging in user:', {email});
}