import api from './api';

export interface Appeal {
  _id: string;
  complaint_id: string;
  property_id: string;
  property_owner_id: string;
  complainant_id: string;
  message: string;
  evidence_photos: string[];
  status: 'pending' | 'approved' | 'rejected';
  admin_response?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  // Additional fields from database joins
  complaint_description?: string;
  complaint_type?: string;
  complaint_status?: string;
  property_title?: string;
  complainant_name?: string;
  owner_name?: string;
}

// Description: Create a new appeal
// Endpoint: POST /api/appeals
// Request: { complaint_id: string, property_id: string, message: string, evidence_photos?: string[] }
// Response: { success: boolean, appeal: Appeal, message: string }
export const createAppeal = async (appealData: {
  complaint_id: string;
  property_id: string;
  message: string;
  evidence_photos?: string[];
}) => {
  try {
    const response = await api.post('/api/appeals', appealData);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get appeals for a property owner
// Endpoint: GET /api/appeals/owner
// Request: {}
// Response: { success: boolean, appeals: Appeal[] }
export const getOwnerAppeals = async () => {
  try {
    const response = await api.get('/api/appeals/owner');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get all appeals for admin management
// Endpoint: GET /api/admin/appeals
// Request: { page?: number, limit?: number }
// Response: { success: boolean, appeals: Appeal[], total: number, page: number, totalPages: number }
export const getAdminAppeals = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/api/admin/appeals?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Update appeal status and admin response
// Endpoint: PUT /api/admin/appeals/:appealId/status
// Request: { appealId: string, status: string, admin_response?: string }
// Response: { success: boolean, appeal: Appeal, message: string }
export const updateAppealStatus = async (
  appealId: string,
  status: string,
  admin_response?: string
) => {
  try {
    const response = await api.put(`/api/admin/appeals/${appealId}/status`, {
      status,
      admin_response
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
}; 