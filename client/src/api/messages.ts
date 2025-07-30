import api from './api';

export interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    avatar?: string;
  };
  receiver: {
    _id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  attachments?: string[];
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  participants: {
    _id: string;
    name: string;
    avatar?: string;
  }[];
  lastMessage: Message;
  unreadCount: number;
  property?: {
    _id: string;
    title: string;
    images: string[];
  };
  updatedAt: string;
}

// Description: Get user's conversations
// Endpoint: GET /api/messages/conversations
// Request: {}
// Response: { success: boolean, conversations: Conversation[] }
export const getConversations = async () => {
  try {
    const response = await api.get('/api/messages/conversations');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get messages in a conversation
// Endpoint: GET /api/messages/conversation/:id
// Request: { conversationId: string }
// Response: { success: boolean, messages: Message[] }
export const getMessages = async (conversationId: string) => {
  try {
    const response = await api.get(`/api/messages/conversation/${conversationId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Send a message
// Endpoint: POST /api/messages
// Request: { receiverId: string, content: string, attachments?: string[], propertyId?: string }
// Response: { success: boolean, message: Message }
export const sendMessage = async (data: { receiverId: string; content: string; attachments?: string[]; propertyId?: string }) => {
  try {
    const response = await api.post('/api/messages', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Mark a message as read
// Endpoint: PATCH /api/messages/:messageId/read
// Request: { messageId: string }
// Response: { success: boolean, message: Message }
export const markMessageAsRead = async (messageId: string) => {
  try {
    const response = await api.patch(`/api/messages/${messageId}/read`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Mark all messages in a conversation as read
// Endpoint: PATCH /api/messages/conversation/:conversationId/read
// Request: { conversationId: string }
// Response: { success: boolean, result: { updatedCount: number } }
export const markConversationAsRead = async (conversationId: string) => {
  try {
    const response = await api.patch(`/api/messages/conversation/${conversationId}/read`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};