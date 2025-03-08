const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

let io;

// Initialize Socket.io
exports.initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // JWT authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Attach user data to socket
      socket.userId = user._id;
      socket.username = user.username;
      socket.displayName = user.displayName;
      
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection event
  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.userId}`);
    
    // Join user's personal room for direct messages
    socket.join(`user:${socket.userId}`);
    
    // Update user status to online
    updateUserStatus(socket.userId, 'online');
    
    // Handle events
    handleEvents(socket);
    
    // Disconnect event
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.userId}`);
      updateUserStatus(socket.userId, 'offline');
    });
  });

  return io;
};

// Get Socket.io instance
exports.getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Update user status
const updateUserStatus = async (userId, status) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        status,
        lastSeen: Date.now()
      },
      { new: true }
    );

    if (user && io) {
      io.emit('status:update', {
        userId: user._id,
        status: user.status,
        lastSeen: user.lastSeen
      });
    }
  } catch (error) {
    logger.error('Update user status error:', error);
  }
};

// Handle socket events
const handleEvents = (socket) => {
  // Join channel
  socket.on('channel:join', (channelId) => {
    socket.join(`channel:${channelId}`);
    logger.info(`User ${socket.userId} joined channel ${channelId}`);
  });

  // Leave channel
  socket.on('channel:leave', (channelId) => {
    socket.leave(`channel:${channelId}`);
    logger.info(`User ${socket.userId} left channel ${channelId}`);
  });

  // Typing indicator
  socket.on('message:typing', (data) => {
    const { channelId, receiverId } = data;
    
    if (channelId) {
      socket.to(`channel:${channelId}`).emit('message:typing', {
        userId: socket.userId,
        username: socket.username,
        displayName: socket.displayName,
        channelId
      });
    } else if (receiverId) {
      socket.to(`user:${receiverId}`).emit('message:typing', {
        userId: socket.userId,
        username: socket.username,
        displayName: socket.displayName,
        receiverId
      });
    }
  });

  // Manual status update
  socket.on('status:change', async (status) => {
    if (['online', 'offline'].includes(status)) {
      await updateUserStatus(socket.userId, status);
    }
  });
}; 