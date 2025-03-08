const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validation');
const { userUpdateValidator } = require('../utils/validators');

// @route   GET /api/users
// @desc    Get all users
// @access  Private
router.get('/', auth, userController.getAllUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth, userController.getUserById);

// @route   PATCH /api/users/:id
// @desc    Update user
// @access  Private
router.patch('/:id', auth, userUpdateValidator, validate, userController.updateUser);

module.exports = router; 