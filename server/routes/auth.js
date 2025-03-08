const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validation');
const { loginValidator } = require('../utils/validators');

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginValidator, validate, authController.login);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, authController.getCurrentUser);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', auth, authController.logout);

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', authController.register);

module.exports = router; 