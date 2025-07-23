import api from './api';

export interface Property {
  _id: string;
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
  status: 'Pending Verification' | 'Active' | 'Flagged';
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
  propertyType?: string[];
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
  page?: number;
  limit?: number;
}

// Description: Get a list of properties with optional filters
// Endpoint: GET /api/properties
// Request: { filters?: PropertyFilters }
// Response: { properties: Property[], total: number, page: number, totalPages: number }
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

// Description: Get a single property by ID
// Endpoint: GET /api/properties/:id
// Request: { id: string }
// Response: { property: Property }
export const getPropertyById = async (id: string) => {
  try {
    const response = await api.get(`/api/properties/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Create a new property listing
// Endpoint: POST /api/properties
// Request: { property: Omit<Property, '_id' | 'owner' | 'status' | 'views' | 'inquiries' | 'bookings' | 'createdAt' | 'updatedAt'> }
// Response: { success: boolean, property: Property, message: string }
export const createProperty = async (propertyData: any) => {
  try {
    const response = await api.post('/api/properties', propertyData);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get user's own property listings
// Endpoint: GET /api/properties/my-listings
// Request: {}
// Response: { properties: Property[] }
export const getMyListings = async () => {
  try {
    const response = await api.get('/api/properties/my-listings');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};