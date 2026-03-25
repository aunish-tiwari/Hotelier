const pool = require('../Config/db.config');

exports.getHome = (req, res) => {
    res.render('Home');
};

exports.getAbout = (req, res) => {
    res.render('about');
};

exports.getService = (req, res) => {
    res.render('service');
};

exports.getRoom = (req, res) => {
    res.render('room');
};

exports.getRoomDetail = (req, res) => {
    res.render('room-detail');
};

exports.getTeam = (req, res) => {
    res.render('team');
};

exports.getTestimonial = (req, res) => {
    res.render('testimonial');
};

exports.getContact = (req, res) => {
    res.render('contact', {
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

        return res.status(400).render('contact', {
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

        return res.status(201).render('contact', {
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

        return res.status(500).render('contact', {
            formStatus: 'error',
            formMessage: 'Something went wrong while sending your message. Please try again.',
            formData
        });
    }
};