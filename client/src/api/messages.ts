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
  propertyId?: string;
  propertyTitle?: string;
  propertyLocation?: string;
  propertyPrice?: number;
  propertyImageUrl?: string;
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

// Description: Upload files for message attachments
// Endpoint: POST /api/messages/upload
// Request: FormData with files
// Response: { success: boolean, filePaths: string[] }
export const uploadMessageFiles = async (files: FileList): Promise<{ success: boolean; filePaths: string[] }> => {
  try {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    const response = await api.post('/api/messages/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Send a message with files (handles file upload + message sending)
// Request: { receiverId: string, content: string, files?: FileList, propertyId?: string }
// Response: { success: boolean, message: Message }
export const sendMessageWithFiles = async (data: { 
  receiverId: string; 
  content: string; 
  files: FileList 
}) => {
  try {
    // First upload files
    const uploadResponse = await uploadMessageFiles(data.files);
    
    // Then send message with attachment paths
    const messageResponse = await api.post('/api/messages', {
      receiverId: data.receiverId,
      content: data.content,
      attachments: uploadResponse.filePaths
    });
    
    return messageResponse.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Download message attachment
// Endpoint: GET /api/messages/download/:filename
// Request: { filename: string }
// Response: File blob
export const downloadMessageFile = async (filename: string) => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`http://localhost:3001/api/messages/download/${filename}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to download file');
    }

    // Get the blob data
    const blob = await response.blob();
    
    // Create a temporary URL for the blob
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary link element and simulate click to download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename; // This will be the downloaded file name
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to download file');
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

// Description: Send message to AI and get response
// Endpoint: POST /api/messages/ai-chat
// Request: { message: string, conversationHistory?: Message[] }
// Response: { success: boolean, message: Message }
export const sendAIMessage = async (data: { 
  message: string; 
  conversationHistory?: Message[] 
}) => {
  try {
    const response = await api.post('/api/messages/ai-chat', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};