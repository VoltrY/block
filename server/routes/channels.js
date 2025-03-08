const express = require('express');
const router = express.Router();
const channelController = require('../controllers/channelController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validation');
const { channelValidator } = require('../utils/validators');

// @route   GET /api/channels
// @desc    Get all channels for user
// @access  Private
router.get('/', auth, channelController.getChannels);

// @route   GET /api/channels/:id
// @desc    Get channel by ID
// @access  Private
router.get('/:id', auth, channelController.getChannelById);

// @route   POST /api/channels
// @desc    Create new channel
// @access  Private
router.post('/', auth, channelValidator, validate, channelController.createChannel);

// @route   PATCH /api/channels/:id
// @desc    Update channel
// @access  Private
router.patch('/:id', auth, channelValidator, validate, channelController.updateChannel);

// @route   DELETE /api/channels/:id
// @desc    Delete channel
// @access  Private
router.delete('/:id', auth, channelController.deleteChannel);

module.exports = router; 