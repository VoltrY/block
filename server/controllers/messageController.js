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
    
    // Get messages
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('sender', 'username displayName avatar')
      .populate('receiverId', 'username displayName avatar');
    
    // Mark messages as read if they were sent to the current user
    const unreadMessages = messages.filter(
      msg => !msg.readBy.includes(req.user.id) && 
             msg.sender._id.toString() !== req.user.id
    );
    
    if (unreadMessages.length > 0) {
      await Promise.all(
        unreadMessages.map(msg => 
          Message.findByIdAndUpdate(
            msg._id, 
            { $addToSet: { readBy: req.user.id } }
          )
        )
      );
      
      // Emit socket event for read messages
      const io = getIo();
      if (io) {
        unreadMessages.forEach(msg => {
          io.emit('message:read', {
            messageId: msg._id,
            userId: req.user.id
          });
        });
      }
    }
    
    res.json({
      success: true,
      messages: messages.map(msg => ({
        id: msg._id,
        content: msg.content,
        sender: {
          id: msg.sender._id,
          username: msg.sender.username,
          displayName: msg.sender.displayName,
          avatar: msg.sender.avatar
        },
        channelId: msg.channelId,
        receiver: msg.receiverId ? {
          id: msg.receiverId._id,
          username: msg.receiverId.username,
          displayName: msg.receiverId.displayName,
          avatar: msg.receiverId.avatar
        } : null,
        readBy: msg.readBy,
        attachments: msg.attachments,
        createdAt: msg.createdAt
      })).reverse() // Reverse to get oldest first
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
    const { content, channelId, receiverId, attachments } = req.body;
    
    // Validate input
    if (!content && (!attachments || attachments.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Message must have content or attachments'
      });
    }
    
    if (!channelId && !receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Either channelId or receiverId must be provided'
      });
    }
    
    // Check if channel exists and user has access
    if (channelId) {
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
          message: 'Not authorized to send messages to this channel'
        });
      }
    }
    
    // Check if receiver exists
    if (receiverId) {
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        return res.status(404).json({
          success: false,
          message: 'Receiver not found'
        });
      }
    }
    
    // Create message
    const message = new Message({
      content,
      sender: req.user.id,
      channelId,
      receiverId,
      readBy: [req.user.id], // Sender has read the message
      attachments: attachments || []
    });
    
    await message.save();
    
    // Populate sender info
    await message.populate('sender', 'username displayName avatar');
    
    // Emit socket event for new message
    const io = getIo();
    if (io) {
      const eventData = {
        id: message._id,
        content: message.content,
        sender: {
          id: message.sender._id,
          username: message.sender.username,
          displayName: message.sender.displayName,
          avatar: message.sender.avatar
        },
        channelId: message.channelId,
        receiverId: message.receiverId,
        readBy: message.readBy,
        attachments: message.attachments,
        createdAt: message.createdAt
      };
      
      if (channelId) {
        io.to(`channel:${channelId}`).emit('message:new', eventData);
      } else if (receiverId) {
        io.to(`user:${receiverId}`).emit('message:new', eventData);
        io.to(`user:${req.user.id}`).emit('message:new', eventData);
      }
    }
    
    res.status(201).json({
      success: true,
      message: {
        id: message._id,
        content: message.content,
        sender: {
          id: message.sender._id,
          username: message.sender.username,
          displayName: message.sender.displayName,
          avatar: message.sender.avatar
        },
        channelId: message.channelId,
        receiverId: message.receiverId,
        readBy: message.readBy,
        attachments: message.attachments,
        createdAt: message.createdAt
      }
    });
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
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
        message: 'Message not found'
      });
    }
    
    // Check if user is the sender of the message
    if (message.sender.toString() !== req.user.id) {
      // Check if user is channel admin (for channel messages)
      if (message.channelId) {
        const channel = await Channel.findById(message.channelId);
        if (!channel || !channel.admins.includes(req.user.id)) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to delete this message'
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this message'
        });
      }
    }
    
    await Message.findByIdAndDelete(req.params.id);
    
    // Emit socket event for deleted message
    const io = getIo();
    if (io) {
      const eventData = {
        id: req.params.id,
        channelId: message.channelId,
        receiverId: message.receiverId
      };
      
      if (message.channelId) {
        io.to(`channel:${message.channelId}`).emit('message:delete', eventData);
      } else if (message.receiverId) {
        io.to(`user:${message.receiverId}`).emit('message:delete', eventData);
        io.to(`user:${message.sender}`).emit('message:delete', eventData);
      }
    }
    
    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    logger.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
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