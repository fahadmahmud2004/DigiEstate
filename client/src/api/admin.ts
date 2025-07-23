import api from './api';

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: string;
  status: 'active' | 'blocked';
  reputation: number;
  joinDate: string;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProperty {
  _id: string;
  title: string;
  description: string;
  type: string;
  price: number;
  location: string;
  availability: string;
  images: string[];
  videos: string[];
  features: any;
  nearbyFacilities: any[];
  owner: {
    _id: string;
    name: string;
    email: string;
  };
  status: string;
  views: number;
  inquiries: number;
  bookings: number;
  createdAt: string;
  updatedAt: string;
}

// Description: Get all users for admin management
// Endpoint: GET /api/admin/users
// Request: { page?: number, limit?: number }
// Response: { success: boolean, users: AdminUser[], total: number, page: number, totalPages: number }
export const getAdminUsers = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/api/admin/users?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Toggle user block/unblock status
// Endpoint: PUT /api/admin/users/:userId/toggle-block
// Request: { userId: string }
// Response: { success: boolean, user: AdminUser, message: string }
export const toggleUserBlock = async (userId: string) => {
  try {
    const response = await api.put(`/api/admin/users/${userId}/toggle-block`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get all properties for admin management
// Endpoint: GET /api/admin/properties
// Request: { page?: number, limit?: number }
// Response: { success: boolean, properties: AdminProperty[], total: number, page: number, totalPages: number }
export const getAdminProperties = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/api/admin/properties?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Update property status (approve/reject)
// Endpoint: PUT /api/admin/properties/:propertyId/status
// Request: { propertyId: string, status: string, reason?: string }
// Response: { success: boolean, property: AdminProperty, message: string }
export const updatePropertyStatus = async (propertyId: string, status: string, reason?: string) => {
  try {
    const response = await api.put(`/api/admin/properties/${propertyId}/status`, {
      status,
      reason
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};