export interface Complaint {
  _id: string
  complainant: {
    _id: string
    name: string
    email: string
  }
  target: {
    _id: string
    name: string
    email: string
  }
  targetType: string
  type: string
  description: string
  evidence: string[]
  status: string
  resolution: string
  adminNotes: string
  createdAt: string
  updatedAt: string
}

export interface PropertyComplaint {
  propertyId: string
  type: string
  description: string
  evidence?: string[]
}

export interface ComplaintData {
  target: string
  targetType: string
  type: string
  description: string
  evidence?: string[]
}

export interface ComplaintResponse {
  success: boolean
  complaint?: Complaint
  message?: string
  error?: string
}

export interface ComplaintsListResponse {
  success: boolean
  complaints: Complaint[]
  total: number
  page: number
  totalPages: number
}

// Create a general complaint (existing functionality)
export const createComplaint = async (complaintData: ComplaintData): Promise<ComplaintResponse> => {
  const response = await fetch('/api/complaints', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(complaintData)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create complaint')
  }

  return response.json()
}

// Create a property-specific complaint (new functionality)
export const createPropertyComplaint = async (complaintData: PropertyComplaint): Promise<ComplaintResponse> => {
  const response = await fetch('/api/complaints/property', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(complaintData)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to submit complaint')
  }

  return response.json()
}

// Get user's own complaints
export const getMyComplaints = async (page = 1, limit = 10): Promise<ComplaintsListResponse> => {
  const response = await fetch(`/api/complaints/my-complaints?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch complaints')
  }

  return response.json()
}

// Admin: Get all complaints with pagination
export const getAdminComplaints = async (page = 1, limit = 10): Promise<ComplaintsListResponse> => {
  const response = await fetch(`/api/admin/complaints?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch complaints')
  }

  return response.json()
}

// Admin: Update complaint status (existing functionality)
export const updateComplaintStatus = async (
  complaintId: string, 
  status: string, 
  resolution?: string, 
  adminNotes?: string
): Promise<ComplaintResponse> => {
  const response = await fetch(`/api/admin/complaints/${complaintId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ status, resolution, adminNotes })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update complaint status')
  }

  return response.json()
}

// Admin: Resolve complaint with property action (new functionality)
export const resolveComplaintWithAction = async (
  complaintId: string, 
  resolution: string, 
  action: string, 
  reason?: string
): Promise<ComplaintResponse> => {
  const response = await fetch(`/api/admin/complaints/${complaintId}/resolve-with-action`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ resolution, action, reason })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to resolve complaint')
  }

  return response.json()
}

// Get a specific complaint by ID
export const getComplaintById = async (complaintId: string): Promise<{ success: boolean; complaint: Complaint }> => {
  const response = await fetch(`/api/complaints/${complaintId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch complaint')
  }

  return response.json()
}

// Cancel/withdraw a complaint (user functionality)
export const cancelComplaint = async (complaintId: string): Promise<ComplaintResponse> => {
  const response = await fetch(`/api/complaints/${complaintId}/cancel`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to cancel complaint')
  }

  return response.json()
}

// Get complaint statistics for admin dashboard
export const getComplaintStats = async (): Promise<{
  success: boolean
  stats: {
    total: number
    open: number
    inProgress: number
    resolved: number
    dismissed: number
    byType: Record<string, number>
    byTargetType: Record<string, number>
    recent: Complaint[]
  }
}> => {
  const response = await fetch('/api/admin/complaints/stats', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch complaint statistics')
  }

  return response.json()
}

// Export complaint data (admin functionality)
export const exportComplaints = async (
  filters?: {
    status?: string
    type?: string
    dateFrom?: string
    dateTo?: string
  }
): Promise<Blob> => {
  const queryParams = new URLSearchParams()
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value)
    })
  }

  const response = await fetch(`/api/admin/complaints/export?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to export complaints')
  }

  return response.blob()
}

// Bulk actions for admin
export const bulkUpdateComplaints = async (
  complaintIds: string[],
  action: string,
  data?: Record<string, any>
): Promise<{ success: boolean; updated: number; message: string }> => {
  const response = await fetch('/api/admin/complaints/bulk', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ complaintIds, action, data })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to perform bulk action')
  }

  return response.json()
}

// Search complaints with filters
export const searchComplaints = async (
  query: string,
  filters?: {
    status?: string
    type?: string
    targetType?: string
    dateFrom?: string
    dateTo?: string
  },
  page = 1,
  limit = 10
): Promise<ComplaintsListResponse> => {
  const queryParams = new URLSearchParams({
    q: query,
    page: page.toString(),
    limit: limit.toString()
  })

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value)
    })
  }

  const response = await fetch(`/api/complaints/search?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to search complaints')
  }

  return response.json()
}

// Admin: Get complaints requiring urgent attention
export const getUrgentComplaints = async (): Promise<{
  success: boolean
  complaints: Complaint[]
  count: number
}> => {
  const response = await fetch('/api/admin/complaints/urgent', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch urgent complaints')
  }

  return response.json()
}

// Get complaint history/timeline
export const getComplaintHistory = async (complaintId: string): Promise<{
  success: boolean
  history: Array<{
    id: string
    action: string
    performedBy: {
      id: string
      name: string
      role: string
    }
    details: string
    timestamp: string
  }>
}> => {
  const response = await fetch(`/api/complaints/${complaintId}/history`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch complaint history')
  }

  return response.json()
}

// Add comment/note to complaint (admin functionality)
export const addComplaintComment = async (
  complaintId: string,
  comment: string,
  isInternal = false
): Promise<ComplaintResponse> => {
  const response = await fetch(`/api/admin/complaints/${complaintId}/comment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ comment, isInternal })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to add comment')
  }

  return response.json()
}

// Upload evidence files to existing complaint
export const uploadComplaintEvidence = async (
  complaintId: string,
  files: File[]
): Promise<{
  success: boolean
  uploadedFiles: string[]
  message: string
}> => {
  const formData = new FormData()
  files.forEach((file, index) => {
    formData.append(`evidence_${index}`, file)
  })

  const response = await fetch(`/api/complaints/${complaintId}/evidence`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: formData
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to upload evidence')
  }

  return response.json()
}

// Get complaints against a specific property (for property owners)
export const getPropertyComplaints = async (propertyId: string): Promise<{
  success: boolean
  complaints: Complaint[]
  canAppeal: boolean
}> => {
  const response = await fetch(`/api/properties/${propertyId}/complaints`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch property complaints')
  }

  return response.json()
}

// Default export for backward compatibility
export default {
  createComplaint,
  createPropertyComplaint,
  getMyComplaints,
  getAdminComplaints,
  updateComplaintStatus,
  resolveComplaintWithAction,
  getComplaintById,
  cancelComplaint,
  getComplaintStats,
  exportComplaints,
  bulkUpdateComplaints,
  searchComplaints,
  getUrgentComplaints,
  getComplaintHistory,
  addComplaintComment,
  uploadComplaintEvidence,
  getPropertyComplaints
}
