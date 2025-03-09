const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  attachments: [{
    type: String
  }],
  isSystemMessage: {
    type: Boolean,
    default: false
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  originalContent: {
    type: String
  }
}, {
  timestamps: true
});

// Ensure that either channelId or receiverId is provided
MessageSchema.pre('save', function(next) {
  if (!this.channelId && !this.receiverId) {
    return next(new Error('Message must have either a channel or a receiver'));
  }
  next();
});

module.exports = mongoose.model('Message', MessageSchema); 