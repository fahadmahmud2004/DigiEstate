# AI Chat Feature for DigiEstate

## Overview
The AI chat feature allows users to interact with an AI assistant specifically designed for real estate inquiries. Users can ask questions about property buying/selling, market trends, investment opportunities, and more.

## Features

### Frontend (React/TypeScript)
- **AI Chat Button**: Purple "AI Chat" button in the Messages page header
- **Dual Chat Modes**: Toggle between regular user-to-user chat and AI chat
- **AI-Specific UI**: 
  - Purple theme for AI chat
  - Bot icon for AI assistant
  - Simplified input (no file uploads for AI chat)
  - Real-time conversation display
- **Smart Placeholder**: "Ask me about real estate..." for AI chat input
- **Helpful Suggestions**: Shows what the AI can help with when starting a new AI conversation

### Backend (Node.js/Express)
- **AI Chat Endpoint**: `POST /api/messages/ai-chat`
- **Perplexity AI Integration**: Uses the provided API key for AI responses
- **Conversation Context**: Maintains conversation history for contextual responses
- **Real Estate Focus**: AI is specifically trained for real estate topics

## API Details

### AI Chat Endpoint
```
POST /api/messages/ai-chat
Authorization: Bearer <user_token>
Content-Type: application/json

Request Body:
{
  "message": "string",
  "conversationHistory": [Message[]] // Optional
}

Response:
{
  "success": true,
  "message": {
    "_id": "ai_timestamp_random",
    "sender": {
      "_id": "ai",
      "name": "DigiEstate AI",
      "avatar": "/ai-avatar.png"
    },
    "receiver": {
      "_id": "user_id",
      "name": "user_name"
    },
    "content": "AI response message",
    "isRead": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## AI Capabilities
The AI assistant is specifically designed to help with:
- Property buying and selling advice
- Market trends and analysis
- Investment opportunities
- Legal and financial guidance
- Property valuation insights
- General real estate inquiries

## Technical Implementation

### Key Components Modified:
1. **Messages.tsx**: Added AI chat state management and UI
2. **messages.ts API**: Added `sendAIMessage` function
3. **messageRoutes.js**: Added AI chat endpoint with Perplexity AI integration

### State Management:
- `isAIChat`: Boolean to track AI chat mode
- `aiConversationId`: Unique identifier for AI conversations
- Message handling differs between regular and AI chat modes

### UI/UX Features:
- Seamless switching between chat modes
- Visual distinction (purple theme for AI)
- Disabled file uploads in AI chat
- Helpful onboarding for new AI conversations

## Usage Instructions

1. **Access AI Chat**: Click the purple "AI Chat" button in the Messages page
2. **Start Conversation**: Type your real estate question in the input field
3. **Get AI Response**: The AI will respond with helpful real estate advice
4. **Switch Back**: Click the X button in AI chat header to return to regular chat
5. **Continue Conversation**: AI maintains context of your conversation

## Security & Performance
- API key is securely stored on the server
- User authentication required for AI chat
- Rate limiting and error handling implemented
- Conversation history maintained for context

## Future Enhancements
- Save AI conversations to database
- Add property-specific AI recommendations
- Integrate with property listings for contextual advice
- Add voice-to-text for AI chat
- Implement AI-powered property matching 