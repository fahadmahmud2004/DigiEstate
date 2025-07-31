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

// AI Chat endpoint
router.post('/ai-chat', requireUser, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    const userId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Prepare conversation context for AI
    const conversationContext = conversationHistory.map(msg => ({
      role: msg.sender._id === 'ai' ? 'assistant' : 'user',
      content: msg.content
    }));

    // Add current message
    conversationContext.push({
      role: 'user',
      content: message
    });

    let aiMessage = '';
    
    // Try multiple AI APIs as fallback
    try {
      // Option 1: Try Google AI (Gemini) with API Key
      console.log('[AI Chat] Trying Google AI (Gemini) with API Key...');
      
      // First try with API key
      const googleResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyAxNbbKok0Y-vuA3pwndc-nVzIDbyKovU8', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `You are a helpful AI assistant for a digital real estate platform called DigiEstate. You help users with property-related questions, market insights, buying/selling advice, and general real estate inquiries. Be friendly, professional, and knowledgeable about real estate topics.

Previous conversation context:
${conversationContext.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

User's current message: ${message}

Please provide a helpful, professional response related to real estate.`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1000
          }
        })
      });

      if (googleResponse.ok) {
        const aiData = await googleResponse.json();
        console.log('[AI Chat] Google AI response data:', JSON.stringify(aiData, null, 2));
        
        if (aiData.candidates && aiData.candidates[0] && aiData.candidates[0].content && aiData.candidates[0].content.parts && aiData.candidates[0].content.parts[0]) {
          aiMessage = aiData.candidates[0].content.parts[0].text;
          console.log('[AI Chat] Google AI response successful');
        } else {
          throw new Error('Invalid response structure from Google AI');
        }
      } else {
        const errorData = await googleResponse.text();
        console.log('[AI Chat] Google AI error response:', errorData);
        throw new Error(`Google AI API error: ${googleResponse.status} - ${errorData}`);
      }
    } catch (googleError) {
      console.log('[AI Chat] Google AI failed:', googleError.message);
      console.log('[AI Chat] Trying Hugging Face...');
      
      try {
        // Option 2: Try Hugging Face Inference API (Free)
        const huggingFaceResponse = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer hf_xxx', // Get free token from huggingface.co
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: `Real estate assistant: ${message}`,
            parameters: {
              max_length: 150,
              temperature: 0.7
            }
          })
        });

        if (huggingFaceResponse.ok) {
          const hfData = await huggingFaceResponse.json();
          aiMessage = hfData[0]?.generated_text || generateMockResponse(message);
          console.log('[AI Chat] Hugging Face response successful');
        } else {
          throw new Error(`Hugging Face API error: ${huggingFaceResponse.status}`);
        }
      } catch (huggingFaceError) {
        console.log('[AI Chat] Hugging Face failed, trying OAuth2 Google AI...');
        
        try {
          // Option 3: Try Google AI with OAuth2 (if API key fails)
          console.log('[AI Chat] Trying Google AI with OAuth2...');
          
          // Note: This would require OAuth2 token generation
          // For now, we'll use mock response
          aiMessage = generateMockResponse(message);
          console.log('[AI Chat] OAuth2 not implemented, using mock response');
        } catch (oauthError) {
          console.log('[AI Chat] OAuth2 failed, using mock response...');
          aiMessage = generateMockResponse(message);
          console.log('[AI Chat] Using mock response');
        }
      }
    }

    // Create AI message object
    const aiMessageObj = {
      _id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sender: {
        _id: 'ai',
        name: 'DigiEstate AI',
        avatar: '/ai-avatar.png'
      },
      receiver: {
        _id: userId,
        name: req.user.name
      },
      content: aiMessage,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: aiMessageObj
    });

  } catch (error) {
    console.error('[MessageRoutes] AI Chat Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI response'
    });
  }
});

// Helper function to generate mock responses
function generateMockResponse(userMessage) {
  const responses = {
    'hello': 'Hello! I\'m your DigiEstate AI assistant. How can I help you with real estate today?',
    'property': 'I can help you with property-related questions! Are you looking to buy, sell, or invest in real estate?',
    'buy': 'Great! When buying property, consider location, budget, market trends, and future growth potential. What specific area are you interested in?',
    'sell': 'Selling property? I can help with pricing strategies, market analysis, and preparation tips. What type of property are you selling?',
    'investment': 'Real estate investment can be profitable! Consider rental yields, property appreciation, and market conditions. What\'s your investment goal?',
    'market': 'The real estate market varies by location. I can help you understand current trends, pricing, and market conditions in your area.',
    'price': 'Property pricing depends on location, size, condition, and market demand. Would you like help with property valuation?',
    'rent': 'Rental properties can provide steady income. Consider location, tenant demand, and rental yields when investing.',
    'mortgage': 'Mortgages are common for property purchases. Consider interest rates, loan terms, and down payment requirements.',
    'legal': 'Real estate transactions involve legal considerations. Always consult with a real estate attorney for legal advice.'
  };

  const lowerMessage = userMessage.toLowerCase();
  
  // Check for keywords and return appropriate response
  for (const [keyword, response] of Object.entries(responses)) {
    if (lowerMessage.includes(keyword)) {
      return response;
    }
  }

  // Default response
  return 'Thank you for your question! I\'m here to help with real estate advice, market insights, and property-related inquiries. Feel free to ask about buying, selling, investing, or any real estate topics!';
}

module.exports = router;