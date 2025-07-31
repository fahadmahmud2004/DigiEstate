const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const MessageService = require('../services/messageService.js');
const { requireUser } = require('./middleware/auth.js');

// Configure multer for message file uploads
const messageUploadDir = 'uploads/messages/';
if (!fs.existsSync(messageUploadDir)) {
  fs.mkdirSync(messageUploadDir, { recursive: true });
}

const messageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, messageUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const messageUpload = multer({ 
  storage: messageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 5 // Maximum 5 files per message
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// Upload files for messages
router.post('/upload', requireUser, messageUpload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    const filePaths = req.files.map(file => file.path);
    
    console.log(`[MessageRoutes] Files uploaded: ${filePaths.join(', ')}`);
    
    res.json({
      success: true,
      filePaths
    });
  } catch (error) {
    console.error(`[MessageRoutes] Error uploading files: ${error.message}`);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Download message attachments
router.get('/download/:filename', requireUser, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', 'uploads/messages', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
    
    // Send file
    res.download(filePath, (err) => {
      if (err) {
        console.error(`[MessageRoutes] Error downloading file: ${err.message}`);
        res.status(500).json({
          success: false,
          error: 'Error downloading file'
        });
      }
    });
  } catch (error) {
    console.error(`[MessageRoutes] Error in download route: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

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