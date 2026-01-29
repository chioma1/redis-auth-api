const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

// This is a stricter limiter for login to reduce brute-force attempts.
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts, please try again later.' },
});

router.post('/register', authController.registerUser);

router.post('/login', loginLimiter, authController.loginUser);

module.exports = router;
