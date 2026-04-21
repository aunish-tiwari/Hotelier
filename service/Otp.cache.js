const OTP_TTL_MS = 10 * 60 * 1000;
const otpCache = new Map();

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function setOtp(email, otp) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !otp) {
        return null;
    }

    const existing = otpCache.get(normalizedEmail);
    if (existing && existing.timeoutId) {
        clearTimeout(existing.timeoutId);
    }

    const expiresAt = Date.now() + OTP_TTL_MS;
    const timeoutId = setTimeout(() => {
        otpCache.delete(normalizedEmail);
    }, OTP_TTL_MS);
    if (typeof timeoutId.unref === 'function') {
        timeoutId.unref();
    }

    otpCache.set(normalizedEmail, {
        otp: String(otp),
        expiresAt,
        timeoutId
    });

    return { email: normalizedEmail, expiresAt };
}

function verifyOtp(email, otp) {
    const normalizedEmail = normalizeEmail(email);
    const record = otpCache.get(normalizedEmail);

    if (!record) {
        return false;
    }

    if (Date.now() > record.expiresAt) {
        deleteOtp(normalizedEmail);
        return false;
    }

    return record.otp === String(otp || '').trim();
}

function deleteOtp(email) {
    const normalizedEmail = normalizeEmail(email);
    const record = otpCache.get(normalizedEmail);

    if (record && record.timeoutId) {
        clearTimeout(record.timeoutId);
    }

    return otpCache.delete(normalizedEmail);
}

function getOtp(email) {
    const normalizedEmail = normalizeEmail(email);
    const record = otpCache.get(normalizedEmail);

    if (!record || Date.now() > record.expiresAt) {
        deleteOtp(normalizedEmail);
        return null;
    }

    return {
        email: normalizedEmail,
        otp: record.otp,
        expiresAt: record.expiresAt
    };
}

module.exports = {
    OTP_TTL_MS,
    setOtp,
    verifyOtp,
    deleteOtp,
    getOtp
};
