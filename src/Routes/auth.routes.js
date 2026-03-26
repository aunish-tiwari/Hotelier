const express = require('express');
const router = express.Router();
const {
    getLogin,
    getRegister,
    postRegister,
    postLogin
} = require('../Controllers/auth.controller');

// Auth routes - clean URLs only
router.get('/login', getLogin);
router.get('/register', getRegister);
router.post('/login', postLogin);
router.post('/register', postRegister);
router.post('/auth/login', postLogin);
router.post('/auth/register', postRegister);

module.exports = router;