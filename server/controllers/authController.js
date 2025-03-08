const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update user status to online
    user.status = 'online';
    user.lastSeen = Date.now();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data without password
    const userData = {
      id: user._id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatar: user.generateAvatar(),
      status: user.status
    };

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
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
        email: user.email,
        avatar: user.generateAvatar(),
        status: user.status
      }
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // Update user status to offline
    const user = await User.findById(req.user.id);
    if (user) {
      user.status = 'offline';
      user.lastSeen = Date.now();
      await user.save();
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.username === username 
          ? 'Bu kullanıcı adı zaten kullanılıyor' 
          : 'Bu e-posta adresi zaten kullanılıyor'
      });
    }

    // Create avatar from display name
    const initial = displayName.charAt(0).toUpperCase();
    const avatar = `/placeholder.svg?height=40&width=40&text=${initial}`;

    // Create new user
    const user = new User({
      username,
      email,
      password,
      displayName,
      avatar,
      status: 'online'
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data without password
    const userData = {
      id: user._id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatar: user.avatar,
      status: user.status
    };

    res.status(201).json({
      success: true,
      message: 'Kayıt başarılı',
      token,
      user: userData
    });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
}; 