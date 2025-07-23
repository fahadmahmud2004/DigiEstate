import api from './api';

export interface Notification {
  _id: string;
  type: 'booking' | 'payment' | 'message' | 'admin' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  data?: any;
  createdAt: string;
}

export interface NotificationPreferences {
  _id: string;
  userId: string;
  bookingNotifications: boolean;
  paymentNotifications: boolean;
  messageNotifications: boolean;
  adminNotifications: boolean;
  systemNotifications: boolean;
  emailNotifications: boolean;
  createdAt: string;
  updatedAt: string;
}

// Description: Get user notifications
// Endpoint: GET /api/notifications
// Request: {}
// Response: { success: boolean, notifications: Notification[] }
export const getNotifications = async () => {
  try {
    const response = await api.get('/api/notifications');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Mark notification as read
// Endpoint: PUT /api/notifications/:id/read
// Request: { notificationId: string }
// Response: { success: boolean, message: string }
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const response = await api.put(`/api/notifications/${notificationId}/read`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Delete notification
// Endpoint: DELETE /api/notifications/:id
// Request: { notificationId: string }
// Response: { success: boolean, message: string }
export const deleteNotification = async (notificationId: string) => {
  try {
    const response = await api.delete(`/api/notifications/${notificationId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get notification preferences
// Endpoint: GET /api/notifications/preferences
// Request: {}
// Response: { success: boolean, preferences: NotificationPreferences }
export const getNotificationPreferences = async () => {
  try {
    const response = await api.get('/api/notifications/preferences');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Update notification preferences
// Endpoint: PUT /api/notifications/preferences
// Request: { bookingNotifications: boolean, paymentNotifications: boolean, messageNotifications: boolean, adminNotifications: boolean, systemNotifications: boolean, emailNotifications: boolean }
// Response: { success: boolean, preferences: NotificationPreferences, message: string }
export const updateNotificationPreferences = async (preferences: {
  bookingNotifications: boolean;
  paymentNotifications: boolean;
  messageNotifications: boolean;
  adminNotifications: boolean;
  systemNotifications: boolean;
  emailNotifications: boolean;
}) => {
  try {
    const response = await api.put('/api/notifications/preferences', preferences);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};