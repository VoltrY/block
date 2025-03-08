const Channel = require('../models/Channel');
const Message = require('../models/Message');
const logger = require('../utils/logger');
const { getIo } = require('../services/socket');

// @desc    Get all channels for user
// @route   GET /api/channels
// @access  Private
exports.getChannels = async (req, res) => {
  try {
    // Get public channels and channels where user is a member
    const channels = await Channel.find({
      $or: [
        { type: 'public' },
        { members: req.user.id },
        { admins: req.user.id }
      ]
    }).populate('createdBy', 'username displayName avatar');

    res.json({
      success: true,
      channels: channels.map(channel => ({
        id: channel._id,
        name: channel.name,
        description: channel.description,
        type: channel.type,
        createdBy: channel.createdBy ? {
          id: channel.createdBy._id,
          username: channel.createdBy.username,
          displayName: channel.createdBy.displayName
        } : null,
        createdAt: channel.createdAt
      }))
    });
  } catch (error) {
    logger.error('Get channels error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get channel by ID
// @route   GET /api/channels/:id
// @access  Private
exports.getChannelById = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id)
      .populate('createdBy', 'username displayName avatar')
      .populate('members', 'username displayName avatar status')
      .populate('admins', 'username displayName avatar');

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    // Check if user has access to this channel
    if (channel.type === 'private' && 
        !channel.members.some(member => member._id.toString() === req.user.id) &&
        !channel.admins.some(admin => admin._id.toString() === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this channel'
      });
    }

    res.json({
      success: true,
      channel: {
        id: channel._id,
        name: channel.name,
        description: channel.description,
        type: channel.type,
        createdBy: channel.createdBy ? {
          id: channel.createdBy._id,
          username: channel.createdBy.username,
          displayName: channel.createdBy.displayName,
          avatar: channel.createdBy.avatar
        } : null,
        members: channel.members.map(member => ({
          id: member._id,
          username: member.username,
          displayName: member.displayName,
          avatar: member.avatar,
          status: member.status
        })),
        admins: channel.admins.map(admin => ({
          id: admin._id,
          username: admin.username,
          displayName: admin.displayName,
          avatar: admin.avatar
        })),
        createdAt: channel.createdAt
      }
    });
  } catch (error) {
    logger.error('Get channel by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create channel
// @route   POST /api/channels
// @access  Private
exports.createChannel = async (req, res) => {
  try {
    const { name, description, type = 'public' } = req.body;

    // Create channel
    const channel = await Channel.create({
      name,
      description,
      type,
      createdBy: req.user.id,
      members: [req.user.id],
      admins: [req.user.id]
    });

    // Populate creator info
    await channel.populate('createdBy', 'username displayName');

    // Create system message about channel creation
    const systemMessage = await Message.create({
      content: `Bu kanal ${channel.createdBy.displayName} tarafından oluşturulmuştur.`,
      channelId: channel._id,
      sender: req.user.id,
      isSystemMessage: true,
      readBy: [req.user.id]
    });

    // Emit socket events
    const io = getIo();
    if (io) {
      io.emit('channel:new', {
        id: channel._id,
        name: channel.name,
        description: channel.description,
        type: channel.type,
        createdBy: {
          id: channel.createdBy._id,
          username: channel.createdBy.username,
          displayName: channel.createdBy.displayName
        },
        createdAt: channel.createdAt
      });

      // Emit system message
      io.emit('message:new', {
        id: systemMessage._id,
        content: systemMessage.content,
        channelId: channel._id,
        sender: {
          id: req.user.id,
          username: channel.createdBy.username,
          displayName: channel.createdBy.displayName
        },
        isSystemMessage: true,
        readBy: [req.user.id],
        createdAt: systemMessage.createdAt
      });
    }

    res.status(201).json({
      success: true,
      channel: {
        id: channel._id,
        name: channel.name,
        description: channel.description,
        type: channel.type,
        createdBy: {
          id: channel.createdBy._id,
          username: channel.createdBy.username,
          displayName: channel.createdBy.displayName
        },
        createdAt: channel.createdAt
      }
    });
  } catch (error) {
    logger.error('Create channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

// @desc    Update channel
// @route   PATCH /api/channels/:id
// @access  Private
exports.updateChannel = async (req, res) => {
  try {
    const { name, description } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    // Find channel and check if user is admin
    const channel = await Channel.findById(req.params.id);
    
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    // Check if user is admin
    if (!channel.admins.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this channel'
      });
    }

    // Update channel
    const updatedChannel = await Channel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    // Emit socket event for channel update
    const io = getIo();
    if (io) {
      io.emit('channel:update', {
        id: updatedChannel._id,
        name: updatedChannel.name,
        description: updatedChannel.description
      });
    }

    res.json({
      success: true,
      channel: {
        id: updatedChannel._id,
        name: updatedChannel.name,
        description: updatedChannel.description,
        type: updatedChannel.type,
        createdAt: updatedChannel.createdAt,
        updatedAt: updatedChannel.updatedAt
      }
    });
  } catch (error) {
    logger.error('Update channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete channel
// @route   DELETE /api/channels/:id
// @access  Private
exports.deleteChannel = async (req, res) => {
  try {
    // Find channel and check if user is admin
    const channel = await Channel.findById(req.params.id);
    
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Kanal bulunamadı'
      });
    }

    // Check if user is the creator
    if (channel.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu kanalı silme yetkiniz yok'
      });
    }

    // Delete all messages in the channel
    await Message.deleteMany({ channelId: req.params.id });

    // Delete the channel
    await Channel.findByIdAndDelete(req.params.id);

    // Emit socket event for channel deletion
    const io = getIo();
    if (io) {
      io.emit('channel:delete', {
        id: req.params.id,
        name: channel.name
      });
    }

    res.json({
      success: true,
      message: 'Kanal başarıyla silindi'
    });
  } catch (error) {
    logger.error('Delete channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
}; 