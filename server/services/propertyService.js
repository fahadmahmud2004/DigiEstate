const { getDB } = require('../config/database.js');
const { randomUUID } = require('crypto');

class PropertyService {
  static async list(filters = {}) {
    try {
      console.log('[PropertyService] Fetching properties with filters:', JSON.stringify(filters, null, 2));
      const db = getDB();

      let query = `
        SELECT p.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone, u.avatar as owner_avatar
        FROM properties p
        LEFT JOIN users u ON p.owner_id = u.id
        WHERE p.status = 'Active'
      `;

      const queryParams = [];
      let paramIndex = 1;

      // Search functionality
      if (filters.search) {
        query += ` AND (
          LOWER(p.title) LIKE LOWER($${paramIndex}) OR
          LOWER(p.description) LIKE LOWER($${paramIndex}) OR
          LOWER(p.location) LIKE LOWER($${paramIndex}) OR
          LOWER(p.type) LIKE LOWER($${paramIndex})
        )`;
        queryParams.push(`%${filters.search}%`);
        paramIndex++;
      }

      // Location filter
      if (filters.location) {
        query += ` AND LOWER(p.location) LIKE LOWER($${paramIndex})`;
        queryParams.push(`%${filters.location}%`);
        paramIndex++;
      }

      // Property type filter
      if (filters.propertyType && filters.propertyType.length > 0) {
        const typeConditions = filters.propertyType.map(() => `LOWER(p.type) = LOWER($${paramIndex++})`);
        query += ` AND (${typeConditions.join(' OR ')})`;
        queryParams.push(...filters.propertyType);
      }

      // Price range filter
      if (filters.priceMin) {
        query += ` AND p.price >= $${paramIndex}`;
        queryParams.push(filters.priceMin);
        paramIndex++;
      }
      if (filters.priceMax) {
        query += ` AND p.price <= $${paramIndex}`;
        queryParams.push(filters.priceMax);
        paramIndex++;
      }

      // Bedrooms filter
      if (filters.bedrooms) {
        query += ` AND p.bedrooms >= $${paramIndex}`;
        queryParams.push(filters.bedrooms);
        paramIndex++;
      }

      // Bathrooms filter
      if (filters.bathrooms) {
        query += ` AND p.bathrooms >= $${paramIndex}`;
        queryParams.push(filters.bathrooms);
        paramIndex++;
      }

      // Availability filter
      if (filters.availability) {
        query += ` AND LOWER(p.availability) = LOWER($${paramIndex})`;
        queryParams.push(filters.availability);
        paramIndex++;
      }

      // Sorting
      const sortBy = filters.sortBy || 'newest';
      switch (sortBy) {
        case 'price_asc':
          query += ' ORDER BY p.price ASC';
          break;
        case 'price_desc':
          query += ' ORDER BY p.price DESC';
          break;
        case 'popular':
          query += ' ORDER BY p.views DESC, p.inquiries DESC';
          break;
        case 'newest':
        default:
          query += ' ORDER BY p.created_at DESC';
          break;
      }

      // Pagination
      const limit = filters.limit || 12;
      const page = filters.page || 1;
      const offset = (page - 1) * limit;

      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);

      console.log('[PropertyService] Executing query:', query);
      console.log('[PropertyService] Query params:', queryParams);

      const result = await db.query(query, queryParams);

      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) as total
        FROM properties p
        WHERE p.status = 'Active'
      `;

      const countParams = [];
      let countParamIndex = 1;

      // Apply same filters for count
      if (filters.search) {
        countQuery += ` AND (
          LOWER(p.title) LIKE LOWER($${countParamIndex}) OR
          LOWER(p.description) LIKE LOWER($${countParamIndex}) OR
          LOWER(p.location) LIKE LOWER($${countParamIndex}) OR
          LOWER(p.type) LIKE LOWER($${countParamIndex})
        )`;
        countParams.push(`%${filters.search}%`);
        countParamIndex++;
      }

      if (filters.location) {
        countQuery += ` AND LOWER(p.location) LIKE LOWER($${countParamIndex})`;
        countParams.push(`%${filters.location}%`);
        countParamIndex++;
      }

      if (filters.propertyType && filters.propertyType.length > 0) {
        const typeConditions = filters.propertyType.map(() => `LOWER(p.type) = LOWER($${countParamIndex++})`);
        countQuery += ` AND (${typeConditions.join(' OR ')})`;
        countParams.push(...filters.propertyType);
      }

      if (filters.priceMin) {
        countQuery += ` AND p.price >= $${countParamIndex}`;
        countParams.push(filters.priceMin);
        countParamIndex++;
      }
      if (filters.priceMax) {
        countQuery += ` AND p.price <= $${countParamIndex}`;
        countParams.push(filters.priceMax);
        countParamIndex++;
      }

      if (filters.bedrooms) {
        countQuery += ` AND p.bedrooms >= $${countParamIndex}`;
        countParams.push(filters.bedrooms);
        countParamIndex++;
      }

      if (filters.bathrooms) {
        countQuery += ` AND p.bathrooms >= $${countParamIndex}`;
        countParams.push(filters.bathrooms);
        countParamIndex++;
      }

      if (filters.availability) {
        countQuery += ` AND LOWER(p.availability) = LOWER($${countParamIndex})`;
        countParams.push(filters.availability);
        countParamIndex++;
      }

      const countResult = await db.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      // Format properties
      const properties = result.rows.map(row => this.formatProperty(row));

      console.log(`[PropertyService] Retrieved ${properties.length} properties out of ${total} total`);

      return {
        properties,
        total,
        page: parseInt(page),
        totalPages,
        limit: parseInt(limit)
      };
    } catch (err) {
      console.error('[PropertyService] Error fetching properties:', err.message);
      throw new Error(`Database error while fetching properties: ${err.message}`);
    }
  }

  static async get(id) {
    try {
      console.log(`[PropertyService] Fetching property with ID: ${id}`);
      const db = getDB();

      const query = `
        SELECT p.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone, u.avatar as owner_avatar
        FROM properties p
        LEFT JOIN users u ON p.owner_id = u.id
        WHERE p.id = $1
      `;

      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        console.log(`[PropertyService] Property not found: ${id}`);
        return null;
      }

      // Increment view count
      await db.query('UPDATE properties SET views = views + 1 WHERE id = $1', [id]);

      const property = this.formatProperty(result.rows[0]);
      console.log(`[PropertyService] Property retrieved: ${property.title}`);

      return property;
    } catch (err) {
      console.error('[PropertyService] Error fetching property:', err.message);
      throw new Error(`Database error while fetching property: ${err.message}`);
    }
  }


static async create(propertyData, ownerId) {
  try {
    const db = getDB();

    const formattedImages = JSON.stringify(propertyData.images || []);
    const formattedVideos = JSON.stringify(propertyData.videos || []);
    const formattedCustomFeatures = JSON.stringify(propertyData.features?.customFeatures || []);
    const nearbyFacilitiesJSON = JSON.stringify(propertyData.nearbyFacilities || []);
    const featuresJSON = JSON.stringify(propertyData.features || {});

    console.log(`[PropertyService] Creating property for owner: ${ownerId}`);
    console.log('[PropertyService] Property data:', JSON.stringify(propertyData, null, 2));

    const query = `
      INSERT INTO properties (
        id, type, title, description, price,
        location, availability, images, videos, owner_id, status,
        bedrooms, bathrooms, area, is_furnished, has_parking,
        created_at, updated_at, views, inquiries, bookings,
        nearby_facilities, custom_features, floor_number, total_floors,
        road_width, is_corner_plot, parking_spaces, has_ac, has_lift
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        NOW(), NOW(), 0, 0, 0,
        $17::jsonb, $18, $19, $20, $21, $22, $23, $24, $25
      ) RETURNING *
    `;

    const values = [
      randomUUID(),
      propertyData.type,
      propertyData.title,
      propertyData.description,
      propertyData.price,
      propertyData.location,
      propertyData.availability || 'Available',
      propertyData.images || [],
      propertyData.videos || [],
      ownerId,
      'Pending Verification',
      propertyData.features?.bedrooms,
      propertyData.features?.bathrooms,
      propertyData.features?.area,
      propertyData.features?.isFurnished,
      propertyData.features?.hasParking,
      JSON.stringify(propertyData.nearbyFacilities || []),
      propertyData.features?.customFeatures || [],
      propertyData.features?.floorNumber,
      propertyData.features?.totalFloors,
      propertyData.features?.roadWidth,
      propertyData.features?.isCornerPlot,
      propertyData.features?.parkingSpaces,
      propertyData.features?.hasAC,
      propertyData.features?.hasLift
    ];

    const result = await db.query(query, values);
    const newProperty = result.rows[0];

    console.log(`[PropertyService] Property created with ID: ${newProperty.id}`);
    return newProperty;
  } catch (err) {
    console.error('[PropertyService] Error creating property:', err.message);
    throw new Error(`Database error while creating property: ${err.message}`);
  }
}


  static async getByOwner(ownerId) {
    try {
      console.log(`[PropertyService] Fetching properties for owner: ${ownerId}`);
      const db = getDB();

      const query = `
        SELECT p.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone, u.avatar as owner_avatar
        FROM properties p
        LEFT JOIN users u ON p.owner_id = u.id
        WHERE p.owner_id = $1
        ORDER BY p.created_at DESC
      `;

      const result = await db.query(query, [ownerId]);
      const properties = result.rows.map(row => this.formatProperty(row));

      console.log(`[PropertyService] Retrieved ${properties.length} properties for owner: ${ownerId}`);
      return properties;
    } catch (err) {
      console.error('[PropertyService] Error fetching properties by owner:', err.message);
      throw new Error(`Database error while fetching properties by owner: ${err.message}`);
    }
  }

  static formatProperty(row) {
    return {
      _id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      price: parseFloat(row.price),
      location: row.location,
      availability: row.availability,
      images: typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || []),
      videos: typeof row.videos === 'string' ? JSON.parse(row.videos) : (row.videos || []),
      features: {
        bedrooms: row.bedrooms,
        bathrooms: row.bathrooms,
        floorNumber: row.floor_number,
        totalFloors: row.total_floors,
        area: row.area,
        roadWidth: row.road_width,
        isCornerPlot: row.is_corner_plot,
        parkingSpaces: row.parking_spaces,
        isFurnished: row.is_furnished,
        hasAC: row.has_ac,
        hasLift: row.has_lift,
        hasParking: row.has_parking,
        customFeatures: typeof row.custom_features === 'string' ? JSON.parse(row.custom_features) : (row.custom_features || [])
      },
      nearbyFacilities: typeof row.nearby_facilities === 'string' ? JSON.parse(row.nearby_facilities) : (row.nearby_facilities || []),
      owner: {
        _id: row.owner_id,
        name: row.owner_name || 'Unknown',
        email: row.owner_email || '',
        phone: row.owner_phone || '',
        avatar: row.owner_avatar || '',
        reputation: 4.5 // Default reputation
      },
      status: row.status,
      views: row.views || 0,
      inquiries: row.inquiries || 0,
      bookings: row.bookings || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = PropertyService;