import api from './api';

// Description: Seed admin user in the database
// Endpoint: POST /api/seed/admin
// Request: {}
// Response: { success: boolean, message: string, data: { id: string, email: string, name: string, role: string } }
export const seedAdmin = async () => {
  try {
    return await api.post('/api/seed/admin');
  } catch (error) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Seed sample properties in the database
// Endpoint: POST /api/seed/properties
// Request: {}
// Response: { success: boolean, message: string, data: { count: number, properties: Array<{ id: string, title: string, type: string, price: number, location: string }> } }
export const seedProperties = async () => {
  try {
    return await api.post('/api/seed/properties');
  } catch (error) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};