let nodemailer = null;

try {
    nodemailer = require('nodemailer');
} catch (error) {
    nodemailer = null;
}

const MAIL_USER = 'sah.ashok.me@gmail.com';
const MAIL_APP_PASSWORD = 'gsyx powb atcj whnv'.replace(/\s/g, '');
const DEFAULT_FROM = `Hotelier <${MAIL_USER}>`;
const ADMIN_NOTIFICATION_EMAIL = MAIL_USER;

let transporter = null;

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function hasSmtpConfig() {
    return Boolean(MAIL_USER && MAIL_APP_PASSWORD);
}

function getTransporter() {
    if (!nodemailer || !hasSmtpConfig()) {
        return null;
    }

    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: MAIL_USER,
                pass: MAIL_APP_PASSWORD
            }
        });
    }

    return transporter;
}

async function sendMail({ to, subject, text, html }) {
    if (!to) {
        return { sent: false, reason: 'Missing recipient email.' };
    }

    const mailer = getTransporter();
    const message = {
        from: DEFAULT_FROM,
        to,
        subject,
        text,
        html
    };

    if (!mailer) {
        console.log('[Email preview]', message);
        return { sent: false, preview: true, reason: 'SMTP is not configured or nodemailer is not installed.' };
    }

    const info = await mailer.sendMail(message);
    return { sent: true, messageId: info.messageId };
}

function bookingEmailContent(booking) {
    const subject = `Hotelier booking confirmed - BK-${String(booking.id).padStart(3, '0')}`;
    const guestName = escapeHtml(booking.guestName);
    const roomName = escapeHtml(booking.roomName);
    const checkIn = escapeHtml(booking.checkIn);
    const checkOut = escapeHtml(booking.checkOut);
    const guests = escapeHtml(booking.guests);
    const totalPrice = Number(booking.totalPrice || 0).toFixed(2);
    const text = [
        `Hello ${booking.guestName},`,
        '',
        'Your Hotelier booking has been created successfully.',
        `Booking ID: BK-${String(booking.id).padStart(3, '0')}`,
        `Room: ${booking.roomName}`,
        `Check in: ${booking.checkIn}`,
        `Check out: ${booking.checkOut}`,
        `Guests: ${booking.guests}`,
        `Total: INR ${totalPrice}`,
        '',
        'Thank you for choosing Hotelier.'
    ].join('\n');
    const html = `
        <h2>Booking Confirmed</h2>
        <p>Hello ${guestName}, your Hotelier booking has been created successfully.</p>
        <table cellpadding="8" cellspacing="0" border="0">
            <tr><td><strong>Booking ID</strong></td><td>BK-${String(booking.id).padStart(3, '0')}</td></tr>
            <tr><td><strong>Room</strong></td><td>${roomName}</td></tr>
            <tr><td><strong>Check in</strong></td><td>${checkIn}</td></tr>
            <tr><td><strong>Check out</strong></td><td>${checkOut}</td></tr>
            <tr><td><strong>Guests</strong></td><td>${guests}</td></tr>
            <tr><td><strong>Total</strong></td><td>INR ${totalPrice}</td></tr>
        </table>
        <p>Thank you for choosing Hotelier.</p>
    `;

    return { subject, text, html };
}

async function sendBookingConfirmationEmail(booking) {
    const content = bookingEmailContent(booking);
    const results = [];

    results.push(await sendMail({
        to: booking.guestEmail,
        ...content
    }));

    if (ADMIN_NOTIFICATION_EMAIL) {
        results.push(await sendMail({
            to: ADMIN_NOTIFICATION_EMAIL,
            subject: `New booking received - BK-${String(booking.id).padStart(3, '0')}`,
            text: content.text,
            html: content.html
        }));
    }

    return results;
}

async function sendPasswordResetOtpEmail(email, otp) {
    return sendMail({
        to: email,
        subject: 'Hotelier password reset OTP',
        text: [
            'Use this OTP to reset your Hotelier password:',
            '',
            otp,
            '',
            'This OTP expires in 10 minutes. If you did not request this, you can ignore this email.'
        ].join('\n'),
        html: `
            <h2>Password Reset OTP</h2>
            <p>Use this OTP to reset your Hotelier password:</p>
            <h1 style="letter-spacing: 6px;">${otp}</h1>
            <p>This OTP expires in 10 minutes. If you did not request this, you can ignore this email.</p>
        `
    });
}

module.exports = {
    sendMail,
    sendBookingConfirmationEmail,
    sendPasswordResetOtpEmail
};
