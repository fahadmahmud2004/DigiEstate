import api from './api';

// Description: Login user with email and password
// Endpoint: POST /api/auth/login
// Request: { email: string, password: string }
// Response: { success: boolean, message: string, data: { accessToken: string, refreshToken: string, user: object } }
export const login = async (credentials: { email: string; password: string }) => {
  try {
    console.log('[API AUTH] Login request with credentials:', { email: credentials.email, password: '***' });
    const response = await api.post('/api/auth/login', credentials);
    console.log('[API AUTH] Login response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API AUTH] Login error:', error.response?.data || error.message);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Register new user
// Endpoint: POST /api/auth/register
// Request: { email: string, password: string, name?: string }
// Response: { success: boolean, message: string, data: { accessToken: string, user: object } }
export const register = async (userData: { email: string; password: string; name?: string }) => {
  try {
    console.log('[API AUTH] Register request with data:', { email: userData.email, name: userData.name, password: '***' });
    const response = await api.post('/api/auth/register', userData);
    console.log('[API AUTH] Register response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API AUTH] Register error:', error.response?.data || error.message);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Logout current user
// Endpoint: POST /api/auth/logout
// Request: {}
// Response: { success: boolean, message: string }
export const logout = async () => {
  try {
    console.log('[API AUTH] Logout request');
    const response = await api.post('/api/auth/logout');
    console.log('[API AUTH] Logout response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API AUTH] Logout error:', error.response?.data || error.message);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

export const getProfile = async () => {
  try {
    console.log('[API] Fetching user profile');
    const response = await api.get('/auth/profile');
    console.log('[API] Get profile response:', response);
    return response;
  } catch (error) {
    console.error('[API] Get profile failed:', error);
    throw error;
  }
};