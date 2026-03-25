const express = require('express');
const router = express.Router();
const {
    getLogin,
    getRegister,
    postRegister,
    postLogin
} = require('../Controllers/auth.controller');

router.get('/login', getLogin);
router.get('/register', getRegister);
router.get('/login.html', getLogin);
router.get('/register.html', getRegister);
router.post('/login', postLogin);
router.post('/register', postRegister);



module.exports = router;