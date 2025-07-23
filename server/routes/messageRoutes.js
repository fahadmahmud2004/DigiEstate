const express = require('express');
const router = express.Router();
const MessageService = require('../services/messageService.js');
const { requireUser } = require('./middleware/auth.js');

// Get user's conversations
router.get('/conversations', requireUser, async (req, res) => {
  try {
    console.log(`[MessageRoutes] Getting conversations for user: ${req.user.id}`);
    
    const conversations = await MessageService.getConversations(req.user.id);
    
    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error(`[MessageRoutes] Error getting conversations: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get messages in a conversation
router.get('/conversation/:conversationId', requireUser, async (req, res) => {
  try {
    const { conversationId } = req.params;
    console.log(`[MessageRoutes] Getting messages for conversation: ${conversationId} by user: ${req.user.id}`);
    
    const messages = await MessageService.getMessages(conversationId, req.user.id);
    
    // Mark conversation as read when user opens it
    await MessageService.markConversationAsRead(conversationId, req.user.id);
    
    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error(`[MessageRoutes] Error getting messages: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send a message
router.post('/', requireUser, async (req, res) => {
  try {
    const { receiverId, content, attachments, propertyId } = req.body;
    
    if (!receiverId || !content) {
      return res.status(400).json({
        success: false,
        error: 'Receiver ID and content are required'
      });
    }

    console.log(`[MessageRoutes] Sending message from ${req.user.id} to ${receiverId}`);
    
    const message = await MessageService.sendMessage(
      req.user.id,
      receiverId,
      content,
      attachments,
      propertyId
    );
    
    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    console.error(`[MessageRoutes] Error sending message: ${error.message}`);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Mark a specific message as read
router.patch('/:messageId/read', requireUser, async (req, res) => {
  try {
    const { messageId } = req.params;
    console.log(`[MessageRoutes] Marking message as read: ${messageId} by user: ${req.user.id}`);
    
    const message = await MessageService.markMessageAsRead(messageId, req.user.id);
    
    res.json({
      success: true,
      message
    });
  } catch (error) {
    console.error(`[MessageRoutes] Error marking message as read: ${error.message}`);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Mark all messages in a conversation as read
router.patch('/conversation/:conversationId/read', requireUser, async (req, res) => {
  try {
    const { conversationId } = req.params;
    console.log(`[MessageRoutes] Marking conversation as read: ${conversationId} by user: ${req.user.id}`);
    
    const result = await MessageService.markConversationAsRead(conversationId, req.user.id);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error(`[MessageRoutes] Error marking conversation as read: ${error.message}`);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;