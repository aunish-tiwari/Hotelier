const express = require('express');
const router = express.Router();
const {
    getHome,} = require('../Controllers/user.controller');


    router.get('/', getHome);

module.exports = router;
