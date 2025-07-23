import api from './api';

export interface Booking {
  _id: string;
  property: {
    _id: string;
    title: string;
    location: string;
    price: number;
    images: string[];
  };
  buyer: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  seller: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  preferredDate: string;
  preferredTime: string;
  message: string;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Completed' | 'Cancelled';
  declineReason?: string;
  referenceNumber: string;
  payment?: {
    amount: number;
    method: 'Cash' | 'Bank Transfer' | 'Mobile Payment' | 'Check';
    status: 'Pending' | 'Completed' | 'Failed';
    transactionId?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Description: Create a new booking request
// Endpoint: POST /api/bookings
// Request: { propertyId: string, preferredDate: string, preferredTime: string, message: string }
// Response: { success: boolean, booking: Booking, message: string }
export const createBooking = async (bookingData: {
  propertyId: string;
  preferredDate: string;
  preferredTime: string;
  message: string;
}) => {
  try {
    const response = await api.post('/api/bookings', bookingData);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get user's bookings (as buyer)
// Endpoint: GET /api/bookings/my-bookings
// Request: {}
// Response: { bookings: Booking[] }
export const getMyBookings = async () => {
  try {
    const response = await api.get('/api/bookings/my-bookings');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get single booking details
// Endpoint: GET /api/bookings/:id
// Request: {}
// Response: { success: boolean, booking: Booking }
export const getBookingDetails = async (bookingId: string) => {
  try {
    const response = await api.get(`/api/bookings/${bookingId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Update booking status (for sellers)
// Endpoint: PUT /api/bookings/:id/status
// Request: { status: 'Accepted' | 'Declined', message?: string }
// Response: { success: boolean, booking: Booking, message: string }
export const updateBookingStatus = async (bookingId: string, status: 'Accepted' | 'Declined', message?: string) => {
  try {
    const response = await api.put(`/api/bookings/${bookingId}/status`, { status, message });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Cancel booking (for buyers)
// Endpoint: PUT /api/bookings/:id/cancel
// Request: {}
// Response: { success: boolean, booking: Booking, message: string }
export const cancelBooking = async (bookingId: string) => {
  try {
    const response = await api.put(`/api/bookings/${bookingId}/cancel`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Delete booking (for buyers)
// Endpoint: DELETE /api/bookings/:id
// Request: {}
// Response: { success: boolean, message: string }
export const deleteBooking = async (bookingId: string) => {
  try {
    const response = await api.delete(`/api/bookings/${bookingId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};