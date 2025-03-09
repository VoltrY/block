const Message = require('../models/Message');
const User = require('../models/User');
const Channel = require('../models/Channel');
const logger = require('../utils/logger');
const { getIo } = require('../services/socket');

// @desc    Get messages (channel or direct)
// @route   GET /api/messages
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const { channelId, senderId, receiverId, limit = 50, before } = req.query;
    const query = {};
    
    // Channel messages
    if (channelId) {
      // Check if channel exists and user has access
      const channel = await Channel.findById(channelId);
      if (!channel) {
        return res.status(404).json({
          success: false,
          message: 'Channel not found'
        });
      }

      // For private channels, check if user is a member or admin
      if (channel.type === 'private' && 
          !channel.members.includes(req.user.id) && 
          !channel.admins.includes(req.user.id)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this channel'
        });
      }

      query.channelId = channelId;
    }
    
    // Direct messages
    else if (senderId || receiverId) {
      // If only receiverId is provided, get messages between current user and receiver
      if (receiverId && !senderId) {
        query.$or = [
          { sender: req.user.id, receiverId },
          { sender: receiverId, receiverId: req.user.id }
        ];
      }
      // If both senderId and receiverId are provided, ensure current user is one of them
      else if (senderId && receiverId) {
        if (req.user.id !== senderId && req.user.id !== receiverId) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to access these messages'
          });
        }
        
        query.$or = [
          { sender: senderId, receiverId },
          { sender: receiverId, receiverId: senderId }
        ];
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either channelId or receiverId must be provided'
      });
    }
    
    // Pagination
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }
    
    // Get messages with populated sender info
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate({
        path: 'sender',
        select: 'username displayName avatar',
        transform: doc => ({
          id: doc._id,
          username: doc.username,
          displayName: doc.displayName,
          avatar: doc.generateAvatar() // Tam avatar URL'sini al
        })
      })
      .populate('receiverId', 'username displayName avatar');

    // Format messages
    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      content: msg.content,
      sender: {
        id: msg.sender.id,
        username: msg.sender.username,
        displayName: msg.sender.displayName,
        avatar: msg.sender.avatar // Artık tam URL
      },
      channelId: msg.channelId,
      receiver: msg.receiverId ? {
        id: msg.receiverId._id,
        username: msg.receiverId.username,
        displayName: msg.receiverId.displayName,
        avatar: msg.receiverId.generateAvatar()
      } : null,
      readBy: msg.readBy,
      attachments: msg.attachments,
      createdAt: msg.createdAt
    }));

    // Mark messages as read if they were sent to the current user
    const unreadMessages = formattedMessages.filter(
      msg => !msg.readBy.includes(req.user.id) && 
             msg.sender.id !== req.user.id
    );
    
    if (unreadMessages.length > 0) {
      await Promise.all(
        unreadMessages.map(msg => 
          Message.findByIdAndUpdate(
            msg.id, 
            { $addToSet: { readBy: req.user.id } }
          )
        )
      );
      
      // Emit socket event for read messages
      const io = getIo();
      if (io) {
        unreadMessages.forEach(msg => {
          io.emit('message:read', {
            messageId: msg.id,
            userId: req.user.id
          });
        });
      }
    }
    
    res.json({
      success: true,
      messages: formattedMessages.reverse()
    });
  } catch (error) {
    logger.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Send message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { content, channelId, receiverId } = req.body;

    // Get full sender info
    const sender = await User.findById(req.user.id);
    
    const message = new Message({
      content,
      sender: req.user.id,
      channelId,
      receiverId,
      readBy: [req.user.id]
    });

    await message.save();

    // Populate message with full sender info
    const populatedMessage = await Message.findById(message._id)
      .populate({
        path: 'sender',
        select: 'username displayName avatar',
        transform: doc => ({
          id: doc._id,
          username: doc.username,
          displayName: doc.displayName,
          avatar: doc.generateAvatar() // Tam avatar URL'sini al
        })
      });

    // Format message for response and socket
    const formattedMessage = {
      id: populatedMessage._id,
      content: populatedMessage.content,
      sender: populatedMessage.sender,
      channelId: populatedMessage.channelId,
      readBy: populatedMessage.readBy,
      createdAt: populatedMessage.createdAt
    };

    // Emit socket event
    const io = getIo();
    if (io) {
      if (channelId) {
        io.to(`channel:${channelId}`).emit('message:new', formattedMessage);
      } else if (receiverId) {
        io.to(`user:${receiverId}`).emit('message:new', formattedMessage);
        io.to(`user:${req.user.id}`).emit('message:new', formattedMessage);
      }
    }

    res.status(201).json({
      success: true,
      message: formattedMessage
    });
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update message
// @route   PATCH /api/messages/:id
// @access  Private
exports.updateMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Mesaj bulunamadı'
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

    // Socket.io ile güncellemeyi bildir
    const io = getIo();
    if (io) {
      io.emit('message:update', {
        id: updatedMessage._id,
        content: updatedMessage.content,
        isEdited: true
      });
    }

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
};

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Mesaj bulunamadı'
      });
    }

    // Sadece mesajı gönderen kişi silebilir
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu mesajı silme yetkiniz yok'
      });
    }

    message.content = 'Bu mesaj silindi';
    message.isDeleted = true;
    await message.save();

    // Socket.io ile silme işlemini bildir
    const io = getIo();
    if (io) {
      io.emit('message:delete', {
        id: message._id,
        isDeleted: true
      });
    }

    res.json({
      success: true,
      message: 'Mesaj başarıyla silindi'
    });
  } catch (error) {
    logger.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

// @desc    Mark messages as read
// @route   POST /api/messages/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const { channelId, senderId } = req.body;
    
    if (!channelId && !senderId) {
      return res.status(400).json({
        success: false,
        message: 'Either channelId or senderId must be provided'
      });
    }
    
    const query = { readBy: { $ne: req.user.id } };
    
    if (channelId) {
      query.channelId = channelId;
    } else if (senderId) {
      query.sender = senderId;
      query.receiverId = req.user.id;
    }
    
    const messages = await Message.find(query);
    
    if (messages.length > 0) {
      await Promise.all(
        messages.map(msg => 
          Message.findByIdAndUpdate(
            msg._id, 
            { $addToSet: { readBy: req.user.id } }
          )
        )
      );
      
      // Emit socket event for read messages
      const io = getIo();
      if (io) {
        messages.forEach(msg => {
          io.emit('message:read', {
            messageId: msg._id,
            userId: req.user.id
          });
        });
      }
    }
    
    res.json({
      success: true,
      message: 'Messages marked as read',
      count: messages.length
    });
  } catch (error) {
    logger.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};