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
  // Mocking the response with sample conversations
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        conversations: [
          {
            _id: 'conv_current-user_user-1',
            participants: [
              { _id: 'current-user', name: 'You' },
              { _id: 'user-1', name: 'John Smith', avatar: null }
            ],
            lastMessage: {
              _id: 'msg-1',
              sender: { _id: 'user-1', name: 'John Smith' },
              receiver: { _id: 'current-user', name: 'You' },
              content: 'Hi, I\'m interested in your property listing.',
              isRead: false,
              createdAt: new Date(Date.now() - 3600000).toISOString()
            },
            unreadCount: 1,
            property: {
              _id: 'prop-1',
              title: 'Modern 2BR Apartment in Downtown',
              images: []
            },
            updatedAt: new Date(Date.now() - 3600000).toISOString()
          },
          {
            _id: 'conv_current-user_user-2',
            participants: [
              { _id: 'current-user', name: 'You' },
              { _id: 'user-2', name: 'Sarah Johnson', avatar: null }
            ],
            lastMessage: {
              _id: 'msg-2',
              sender: { _id: 'current-user', name: 'You' },
              receiver: { _id: 'user-2', name: 'Sarah Johnson' },
              content: 'Thanks for your inquiry. The property is still available.',
              isRead: true,
              createdAt: new Date(Date.now() - 7200000).toISOString()
            },
            unreadCount: 0,
            property: {
              _id: 'prop-2',
              title: 'Luxury Villa with Garden',
              images: []
            },
            updatedAt: new Date(Date.now() - 7200000).toISOString()
          }
        ]
      });
    }, 500);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   const response = await api.get('/api/messages/conversations');
  //   return response.data;
  // } catch (error) {
  //   throw new Error(error?.response?.data?.error || error.message);
  // }
};

// Description: Get messages in a conversation
// Endpoint: GET /api/messages/conversation/:id
// Request: { conversationId: string }
// Response: { success: boolean, messages: Message[] }
export const getMessages = async (conversationId: string) => {
  // Mocking the response with sample messages
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockMessages = {
        'conv_current-user_user-1': [
          {
            _id: 'msg-1',
            sender: { _id: 'user-1', name: 'John Smith' },
            receiver: { _id: 'current-user', name: 'You' },
            content: 'Hi, I\'m interested in your property listing.',
            isRead: false,
            createdAt: new Date(Date.now() - 3600000).toISOString()
          },
          {
            _id: 'msg-3',
            sender: { _id: 'user-1', name: 'John Smith' },
            receiver: { _id: 'current-user', name: 'You' },
            content: 'Could we schedule a viewing?',
            isRead: false,
            createdAt: new Date(Date.now() - 3000000).toISOString()
          }
        ],
        'conv_current-user_user-2': [
          {
            _id: 'msg-4',
            sender: { _id: 'user-2', name: 'Sarah Johnson' },
            receiver: { _id: 'current-user', name: 'You' },
            content: 'Hello, I saw your listing and I\'m very interested.',
            isRead: true,
            createdAt: new Date(Date.now() - 8000000).toISOString()
          },
          {
            _id: 'msg-2',
            sender: { _id: 'current-user', name: 'You' },
            receiver: { _id: 'user-2', name: 'Sarah Johnson' },
            content: 'Thanks for your inquiry. The property is still available.',
            isRead: true,
            createdAt: new Date(Date.now() - 7200000).toISOString()
          }
        ]
      };

      resolve({
        success: true,
        messages: mockMessages[conversationId] || []
      });
    }, 300);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   const response = await api.get(`/api/messages/conversation/${conversationId}`);
  //   return response.data;
  // } catch (error) {
  //   throw new Error(error?.response?.data?.error || error.message);
  // }
};

// Description: Send a message
// Endpoint: POST /api/messages
// Request: { receiverId: string, content: string, attachments?: string[], propertyId?: string }
// Response: { success: boolean, message: Message }
export const sendMessage = async (data: { receiverId: string; content: string; attachments?: string[]; propertyId?: string }) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: {
          _id: `msg-${Date.now()}`,
          sender: { _id: 'current-user', name: 'You' },
          receiver: { _id: data.receiverId, name: 'User' },
          content: data.content,
          attachments: data.attachments || [],
          isRead: false,
          createdAt: new Date().toISOString()
        }
      });
    }, 500);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   const response = await api.post('/api/messages', data);
  //   return response.data;
  // } catch (error) {
  //   throw new Error(error?.response?.data?.error || error.message);
  // }
};

// Description: Mark a message as read
// Endpoint: PATCH /api/messages/:messageId/read
// Request: { messageId: string }
// Response: { success: boolean, message: Message }
export const markMessageAsRead = async (messageId: string) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: {
          _id: messageId,
          isRead: true
        }
      });
    }, 200);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   const response = await api.patch(`/api/messages/${messageId}/read`);
  //   return response.data;
  // } catch (error) {
  //   throw new Error(error?.response?.data?.error || error.message);
  // }
};

// Description: Mark all messages in a conversation as read
// Endpoint: PATCH /api/messages/conversation/:conversationId/read
// Request: { conversationId: string }
// Response: { success: boolean, result: { updatedCount: number } }
export const markConversationAsRead = async (conversationId: string) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        result: { updatedCount: 2 }
      });
    }, 200);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   const response = await api.patch(`/api/messages/conversation/${conversationId}/read`);
  //   return response.data;
  // } catch (error) {
  //   throw new Error(error?.response?.data?.error || error.message);
  // }
};