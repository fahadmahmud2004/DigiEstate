const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
    index: true
  },
  receiver: {
    type: String,
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  attachments: [{
    type: String
  }],
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  propertyId: {
    type: String,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  versionKey: false
});

// Index for efficient conversation queries
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ sender: 1, receiver: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;