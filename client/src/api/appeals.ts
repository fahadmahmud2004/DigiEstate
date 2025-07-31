export interface Appeal {
  _id: string
  complaintId: string
  propertyId: string
  propertyTitle: string
  complaintType: string
  complaintDescription: string
  message: string
  evidencePhotos: string[]
  status: 'pending' | 'approved' | 'rejected'
  adminResponse?: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  propertyOwner: {
    _id: string
    name: string
    email: string
  }
  complainant: {
    _id: string
    name: string
    email: string
  }
}

export interface CreateAppealData {
  complaintId: string
  propertyId: string
  message: string
  evidencePhotos?: string[]
}

export interface AppealResponse {
  success: boolean
  appeal?: Appeal
  message?: string
  error?: string
}

export interface AppealsListResponse {
  success: boolean
  appeals: Appeal[]
  total: number
  page: number
  totalPages: number
}

export interface AppealStatsResponse {
  success: boolean
  stats: {
    total: number
    pending: number
    approved: number
    rejected: number
    byComplaintType: Record<string, number>
    recent: Appeal[]
  }
}

// Create an appeal (property owner defending against complaint)
export const createAppeal = async (appealData: CreateAppealData): Promise<AppealResponse> => {
  const response = await fetch('/api/appeals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(appealData)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create appeal')
  }

  return response.json()
}

// Get user's own appeals (property owner)
export const getMyAppeals = async (page = 1, limit = 10): Promise<AppealsListResponse> => {
  const response = await fetch(`/api/appeals/my-appeals?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch appeals')
  }

  return response.json()
}

// Admin: Get all appeals with pagination and filters
export const getAdminAppeals = async (
  page = 1, 
  limit = 10, 
  filters?: {
    status?: string
    complaintType?: string
    dateFrom?: string
    dateTo?: string
  }
): Promise<AppealsListResponse> => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  })

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value)
    })
  }

  const response = await fetch(`/api/admin/appeals?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch appeals')
  }

  return response.json()
}

// Admin: Resolve appeal (approve/reject)
export const resolveAppeal = async (
  appealId: string, 
  decision: string, 
  adminResponse?: string
): Promise<AppealResponse> => {
  const response = await fetch(`/api/admin/appeals/${appealId}/resolve`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ decision, adminResponse })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to resolve appeal')
  }

  return response.json()
}

// Get specific appeal by ID
export const getAppealById = async (appealId: string): Promise<{ success: boolean; appeal: Appeal }> => {
  const response = await fetch(`/api/appeals/${appealId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch appeal')
  }

  return response.json()
}

// Cancel/withdraw an appeal (property owner)
export const cancelAppeal = async (appealId: string): Promise<AppealResponse> => {
  const response = await fetch(`/api/appeals/${appealId}/cancel`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to cancel appeal')
  }

  return response.json()
}

// Get appeal statistics for admin dashboard
export const getAppealStats = async (): Promise<AppealStatsResponse> => {
  const response = await fetch('/api/admin/appeals/stats', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch appeal statistics')
  }

  return response.json()
}

// Search appeals with filters
export const searchAppeals = async (
  query: string,
  filters?: {
    status?: string
    complaintType?: string
    dateFrom?: string
    dateTo?: string
  },
  page = 1,
  limit = 10
): Promise<AppealsListResponse> => {
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

  const response = await fetch(`/api/appeals/search?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to search appeals')
  }

  return response.json()
}

// Export appeal data (admin functionality)
export const exportAppeals = async (
  filters?: {
    status?: string
    complaintType?: string
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

  const response = await fetch(`/api/admin/appeals/export?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to export appeals')
  }

  return response.blob()
}

// Bulk actions for admin (approve/reject multiple appeals)
export const bulkUpdateAppeals = async (
  appealIds: string[],
  action: string,
  data?: Record<string, any>
): Promise<{ success: boolean; updated: number; message: string }> => {
  const response = await fetch('/api/admin/appeals/bulk', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ appealIds, action, data })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to perform bulk action')
  }

  return response.json()
}

// Admin: Get appeals requiring urgent attention
export const getUrgentAppeals = async (): Promise<{
  success: boolean
  appeals: Appeal[]
  count: number
}> => {
  const response = await fetch('/api/admin/appeals/urgent', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch urgent appeals')
  }

  return response.json()
}

// Get appeal history/timeline
export const getAppealHistory = async (appealId: string): Promise<{
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
  const response = await fetch(`/api/appeals/${appealId}/history`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch appeal history')
  }

  return response.json()
}

// Add comment/note to appeal (admin functionality)
export const addAppealComment = async (
  appealId: string,
  comment: string,
  isInternal = false
): Promise<AppealResponse> => {
  const response = await fetch(`/api/admin/appeals/${appealId}/comment`, {
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

// Upload additional evidence files to existing appeal
export const uploadAppealEvidence = async (
  appealId: string,
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

  const response = await fetch(`/api/appeals/${appealId}/evidence`, {
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

// Get appeals for a specific property (for property owners)
export const getPropertyAppeals = async (propertyId: string): Promise<{
  success: boolean
  appeals: Appeal[]
  canAppeal: boolean
}> => {
  const response = await fetch(`/api/properties/${propertyId}/appeals`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch property appeals')
  }

  return response.json()
}

// Get appeals related to a specific complaint
export const getComplaintAppeals = async (complaintId: string): Promise<{
  success: boolean
  appeals: Appeal[]
}> => {
  const response = await fetch(`/api/complaints/${complaintId}/appeals`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch complaint appeals')
  }

  return response.json()
}

// Check if user can appeal a specific complaint
export const canAppealComplaint = async (complaintId: string): Promise<{
  success: boolean
  canAppeal: boolean
  reason?: string
}> => {
  const response = await fetch(`/api/complaints/${complaintId}/can-appeal`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to check appeal eligibility')
  }

  return response.json()
}

// Update appeal status (admin)
export const updateAppealStatus = async (
  appealId: string,
  status: string,
  adminResponse?: string
): Promise<AppealResponse> => {
  const response = await fetch(`/api/admin/appeals/${appealId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ status, adminResponse })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update appeal status')
  }

  return response.json()
}

// Default export for backward compatibility
export default {
  createAppeal,
  getMyAppeals,
  getAdminAppeals,
  resolveAppeal,
  getAppealById,
  cancelAppeal,
  getAppealStats,
  searchAppeals,
  exportAppeals,
  bulkUpdateAppeals,
  getUrgentAppeals,
  getAppealHistory,
  addAppealComment,
  uploadAppealEvidence,
  getPropertyAppeals,
  getComplaintAppeals,
  canAppealComplaint,
  updateAppealStatus
}
