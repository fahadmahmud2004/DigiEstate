import api from './api';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  status: string;
  reputation?: number;
  totalListings?: number;
  totalBookings?: number;
  joinDate: string;
  createdAt: string;
  updatedAt: string;
}

// Description: Get current user's profile information
// Endpoint: GET /api/users/profile
// Request: {}
// Response: { success: boolean, user: UserProfile }
export const getUserProfile = async () => {
  try {
    const response = await api.get('/api/users/profile');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Update current user's profile information
// Endpoint: PUT /api/users/profile
// Request: { name?: string, phone?: string, avatar?: string }
// Response: { success: boolean, user: UserProfile, message: string }
export const updateUserProfile = async (profileData: {
  name?: string;
  phone?: string;
  avatar?: string;
}) => {
  try {
    const response = await api.put('/api/users/profile', profileData);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};