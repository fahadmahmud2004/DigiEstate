import api from './api';

export interface Review {
  _id: string;
  reviewType: 'property' | 'user';
  targetId: string;
  reviewerId: string;
  rating: number;
  comment: string;
  reviewer: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

// Description: Create a property review
// Endpoint: POST /api/reviews/properties/:propertyId/reviews
// Request: { rating: number, comment: string }
// Response: { success: boolean, data: { review: Review }, message: string }
export const createPropertyReview = async (propertyId: string, data: { rating: number; comment: string }) => {
  try {
    return await api.post(`/api/reviews/properties/${propertyId}/reviews`, data);
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get property reviews
// Endpoint: GET /api/reviews/properties/:propertyId/reviews
// Request: {}
// Response: { success: boolean, data: ReviewsResponse }
export const getPropertyReviews = async (propertyId: string) => {
  try {
    return await api.get(`/api/reviews/properties/${propertyId}/reviews`);
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Create a user review
// Endpoint: POST /api/reviews/users/:userId/reviews
// Request: { rating: number, comment: string }
// Response: { success: boolean, data: { review: Review }, message: string }
export const createUserReview = async (userId: string, data: { rating: number; comment: string }) => {
  try {
    return await api.post(`/api/reviews/users/${userId}/reviews`, data);
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get user reviews
// Endpoint: GET /api/reviews/users/:userId/reviews
// Request: {}
// Response: { success: boolean, data: ReviewsResponse }
export const getUserReviews = async (userId: string) => {
  try {
    return await api.get(`/api/reviews/users/${userId}/reviews`);
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Update a review
// Endpoint: PUT /api/reviews/reviews/:reviewId
// Request: { rating: number, comment: string }
// Response: { success: boolean, data: { review: Review }, message: string }
export const updateReview = async (reviewId: string, data: { rating: number; comment: string }) => {
  try {
    return await api.put(`/api/reviews/reviews/${reviewId}`, data);
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Delete a review
// Endpoint: DELETE /api/reviews/reviews/:reviewId
// Request: {}
// Response: { success: boolean, message: string }
export const deleteReview = async (reviewId: string) => {
  try {
    return await api.delete(`/api/reviews/reviews/${reviewId}`);
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};