import api from './api';

// The Property and PropertyFilters interfaces can remain the same.
export interface Property {
  _id: string;
  listingType: 'Sale' | 'Rent';
  title: string;
  description: string;
  type: 'Flat' | 'Office Apartment' | 'Land' | 'Garage' | 'Godown' | 'Plot';
  price: number;
  location: string;
  availability: 'Available' | 'Occupied' | 'Under Maintenance';
  images: string[];
  videos: string[];
  features: {
    bedrooms?: number;
    bathrooms?: number;
    floorNumber?: number;
    totalFloors?: number;
    area?: number;
    roadWidth?: number;
    isCornerPlot?: boolean;
    parkingSpaces?: number;
    isFurnished?: boolean;
    hasAC: boolean;
    hasLift: boolean;
    hasParking: boolean;
    customFeatures: string[];
  };
  nearbyFacilities: {
    name: string;
    distance: number;
  }[];
  owner: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
    reputation: number;
  };
  status: 'Pending Verification' | 'Active' | 'Flagged' | 'Rejected';
  views: number;
  inquiries: number;
  bookings: number;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyFilters {
  search?: string;
  type?: 'rent' | 'sale';
  location?: string;
  priceMin?: number;
  priceMax?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  // Property type-specific filters
  area?: number;
  roadWidth?: number;
  floorNumber?: number;
  totalFloors?: number;
  parkingSpaces?: number;
  isCornerPlot?: boolean;
  isFurnished?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
  page?: number;
  limit?: number;
}


export const getProperties = async (filters?: PropertyFilters) => {
  try {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }
    const response = await api.get(`/api/properties?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

export const getPropertyById = async (id: string) => {
  try {
    const response = await api.get(`/api/properties/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

/**
 * REWRITTEN: Create a new property listing using FormData for file uploads.
 * @param {FormData} formData - The complete form data including text fields and image files.
 * @returns The server response.
 */
export const createProperty = async (formData: FormData) => {
  try {
    // When sending FormData, the browser automatically sets the correct
    // 'multipart/form-data' header. We do not set it manually here.
    const response = await api.post('/api/properties', formData);
    return response.data;
  } catch (error: any) {
    console.error("API error creating property:", error.response?.data);
    throw new Error(error?.response?.data?.error || 'Failed to create property listing.');
  }
};

export const getMyListings = async () => {
  try {
    const response = await api.get('/api/properties/my-listings');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

export const deleteProperty = async (propertyId: string) => {
  try {
    const response = await api.delete(`/api/properties/${propertyId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};
