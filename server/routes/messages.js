const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validation');
const { messageValidator } = require('../utils/validators');

// @route   GET /api/messages
// @desc    Get messages (channel or direct)
// @access  Private
router.get('/', auth, messageController.getMessages);

// @route   POST /api/messages
// @desc    Send message
// @access  Private
router.post('/', auth, messageValidator, validate, messageController.sendMessage);

// @route   DELETE /api/messages/:id
// @desc    Delete message
// @access  Private
router.delete('/:id', auth, messageController.deleteMessage);

// @route   POST /api/messages/read
// @desc    Mark messages as read
// @access  Private
router.post('/read', auth, messageController.markAsRead);

module.exports = router; 