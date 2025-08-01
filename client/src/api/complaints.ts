import api from './api';

export interface Complaint {
  _id: string;
  complainant: {
    _id: string;
    name: string;
    email: string;
  };
  target: {
    _id: string;
    name: string;
    email: string;
    ownerId?: string;
  };
  targetType: 'user' | 'property';
  type: 'Fraudulent Listing' | 'Inappropriate Behavior' | 'Payment Issues' | 'Other';
  description: string;
  evidence: string[];
  status: 'open' | 'in-progress' | 'resolved' | 'dismissed';
  resolution: string;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
}

// Description: Get all complaints for admin management
// Endpoint: GET /api/admin/complaints
// Request: { page?: number, limit?: number }
// Response: { success: boolean, complaints: Complaint[], total: number, page: number, totalPages: number }
export const getAdminComplaints = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/api/admin/complaints?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Update complaint status and resolution
// Endpoint: PUT /api/admin/complaints/:complaintId/status
// Request: { complaintId: string, status: string, resolution?: string, adminNotes?: string }
// Response: { success: boolean, complaint: Complaint, message: string }
export const updateComplaintStatus = async (
  complaintId: string,
  status: string,
  resolution?: string,
  adminNotes?: string
) => {
  try {
    const response = await api.put(`/api/admin/complaints/${complaintId}/status`, {
      status,
      resolution,
      adminNotes
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Create a new complaint
// Endpoint: POST /api/complaints
// Request: { target: string, targetType: string, type: string, description: string, evidence?: string[] }
// Response: { success: boolean, complaint: Complaint, message: string }
export const createComplaint = async (complaintData: {
  target: string;
  targetType: 'user' | 'property';
  type: string;
  description: string;
  evidence?: string[];
}) => {
  try {
    const response = await api.post('/api/complaints', complaintData);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get complaints for property owner
// Endpoint: GET /api/complaints/owner
// Request: {}
// Response: { success: boolean, complaints: Complaint[] }
export const getOwnerComplaints = async () => {
  try {
    const response = await api.get('/api/complaints/owner');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get complaints made by the current user
// Endpoint: GET /api/complaints/my-complaints
// Request: {}
// Response: { success: boolean, complaints: Complaint[] }
export const getMyComplaints = async () => {
  try {
    const response = await api.get('/api/complaints/my-complaints');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};