import api from './api';

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  status: string;
}

// Description: Get all users for messaging
// Endpoint: GET /api/users
// Request: {}
// Response: { success: boolean, users: User[] }
export const getUsers = async () => {
  try {
    const response = await api.get('/api/users');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Search users by name or email
// Endpoint: GET /api/users/search?q=query
// Request: { query: string }
// Response: { success: boolean, users: User[] }
export const searchUsers = async (query: string) => {
  try {
    const response = await api.get(`/api/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};