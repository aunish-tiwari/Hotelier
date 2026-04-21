const express = require('express');
const router = express.Router();
const {
    getLogin,
    getRegister,
    getForgotPassword,
    postRegister,
    postLogin,
    postForgotPassword,
    postResetPassword
} = require('../Controllers/auth.controller');

// Auth routes - clean URLs only
router.get('/login', getLogin);
router.get('/register', getRegister);
router.get('/forgot-password', getForgotPassword);
router.post('/login', postLogin);
router.post('/register', postRegister);
router.post('/forgot-password', postForgotPassword);
router.post('/reset-password', postResetPassword);
router.post('/auth/login', postLogin);
router.post('/auth/register', postRegister);
router.post('/auth/forgot-password', postForgotPassword);
router.post('/auth/reset-password', postResetPassword);

module.exports = router;
