const User = require('../models/User');
const logger = require('../utils/logger');

// @desc    Get all users
// @route   GET /api/users
// @access  Private
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    const formattedUsers = users.map(user => ({
      id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.generateAvatar(),
      status: user.status,
      lastSeen: user.lastSeen
    }));

    res.json({
      success: true,
      users: formattedUsers
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.generateAvatar(),
        status: user.status,
        lastSeen: user.lastSeen
      }
    });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user
// @route   PATCH /api/users/:id
// @access  Private
exports.updateUser = async (req, res) => {
  try {
    // Check if user is updating their own profile
    if (req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user'
      });
    }

    const { displayName, status } = req.body;
    const updateData = {};

    if (displayName) updateData.displayName = displayName;
    if (status) {
      updateData.status = status;
      updateData.lastSeen = Date.now();
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.generateAvatar(),
        status: user.status,
        lastSeen: user.lastSeen
      }
    });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}; 