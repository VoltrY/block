const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validation');
const { messageValidator } = require('../utils/validators');
const Message = require('../models/Message');
const logger = require('../utils/logger');

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

// Update message route
router.patch('/:id', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Mesaj bulunamadı'
      });
    }

    // Silinmiş veya sistem mesajlarını düzenlemeye izin verme
    if (message.isDeleted || message.isSystemMessage) {
      return res.status(400).json({
        success: false,
        message: 'Bu mesaj düzenlenemez'
      });
    }

    // Sadece mesajı gönderen kişi düzenleyebilir
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu mesajı düzenleme yetkiniz yok'
      });
    }

    // İlk düzenleme ise orijinal içeriği kaydet
    if (!message.isEdited) {
      message.originalContent = message.content;
    }

    message.content = content;
    message.isEdited = true;
    await message.save();

    const updatedMessage = await Message.findById(message._id)
      .populate('sender', 'username displayName avatar');

    res.json({
      success: true,
      message: updatedMessage
    });
  } catch (error) {
    logger.error('Update message error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router; 