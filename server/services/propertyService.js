const { getDB } = require('../config/database.js');
const { randomUUID } = require('crypto');

class PropertyService {
  static formatProperty(row) {
    if (!row) return null;
    console.log('Raw row data:', row); // Debugging line
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    const formatted = {
      _id: row.id,
      listingType: row.listing_type,
      title: row.title,
      description: row.description,
      type: row.type,
      price: parseFloat(row.price),
      location: row.location,
      availability: row.availability,
      images: row.images ? row.images.map(img => `${baseUrl}/${img.replace(/\\/g, '/')}`) : [],
      videos: row.videos || [],
      features: {
        bedrooms: row.bedrooms,
        bathrooms: row.bathrooms,
        floorNumber: row.floor_number,
        totalFloors: row.total_floors,
        area: row.area ? parseFloat(row.area) : null,
        roadWidth: row.road_width ? parseFloat(row.road_width) : null,
        isCornerPlot: row.is_corner_plot,
        parkingSpaces: row.parking_spaces,
        isFurnished: row.is_furnished,
        hasAC: row.has_ac,
        hasLift: row.has_lift,
        hasParking: row.has_parking,
        customFeatures: row.custom_features || []
      },
      nearbyFacilities: row.nearby_facilities || [],
      owner: {
        _id: row.owner_id,
        name: row.owner_name || 'Unknown',
        email: row.owner_email || '',
        phone: row.owner_phone || '',
        avatar: row.owner_avatar || '',
        reputation: 4.5
      },
      status: row.status,
      views: row.views || 0,
      inquiries: row.inquiries || 0,
      bookings: row.bookings || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
    console.log('Formatted property:', formatted); // Debugging line
    return formatted;
  }

  static async list(filters = {}) {
    try {
      const db = getDB();
      let query = `
        SELECT p.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone, u.avatar as owner_avatar, u.reputation as owner_reputation
        FROM properties p
        LEFT JOIN users u ON p.owner_id = u.id
      `;
      
      let queryParams = [];
      
      // For admin users, don't filter by status unless specifically requested
      // For regular users, only show active properties
      if (filters.status) {
        query += ` WHERE p.status = $1`;
        queryParams.push(filters.status);
      } else {
        // Regular user flow - only show active properties
        query += ` WHERE p.status = 'Active'`;
      }
      
      // Add other filters
      const filterResult = this.addFiltersToQuery(query, queryParams, filters);
      query = filterResult.query;
      let paramIndex = filterResult.paramIndex;
      
      // Handle sorting
      let orderBy = 'p.created_at DESC'; // default
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'price_asc':
            orderBy = 'p.price ASC';
            break;
          case 'price_desc':
            orderBy = 'p.price DESC';
            break;
          case 'newest':
            orderBy = 'p.created_at DESC';
            break;
          case 'popular':
            orderBy = 'p.views DESC';
            break;
        }
      }
      
      // Count total results
      const countQuery = `SELECT COUNT(*) FROM (${query}) as filtered_properties`;
      const countResult = await db.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].count, 10);
      
      // Add sorting and pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 12;
      const offset = (page - 1) * limit;
      
      query += ` ORDER BY ${orderBy} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);
      
      const result = await db.query(query, queryParams);
      
      return {
        properties: result.rows.map(row => PropertyService.formatProperty(row)),
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (err) {
      console.error(`[PropertyService] Error listing properties: ${err.message}`);
      throw new Error(`Database error while listing properties: ${err.message}`);
    }
  }

  static addFiltersToQuery(baseQuery, queryParams, filters) {
    let whereConditions = [];
    let paramIndex = queryParams.length + 1;
    
    // Text search
    if (filters.search) {
      whereConditions.push(`(LOWER(p.title) LIKE LOWER($${paramIndex}) OR LOWER(p.description) LIKE LOWER($${paramIndex}) OR LOWER(p.location) LIKE LOWER($${paramIndex}))`);
      queryParams.push(`%${filters.search}%`);
      paramIndex++;
    }
    
    // Listing type (rent/sale)
    if (filters.type) {
      whereConditions.push(`p.listing_type = $${paramIndex}`);
      queryParams.push(filters.type === 'rent' ? 'Rent' : 'Sale');
      paramIndex++;
    }
    
    // Price range
    if (filters.priceMin) {
      whereConditions.push(`p.price >= $${paramIndex}`);
      queryParams.push(parseFloat(filters.priceMin));
      paramIndex++;
    }
    if (filters.priceMax) {
      whereConditions.push(`p.price <= $${paramIndex}`);
      queryParams.push(parseFloat(filters.priceMax));
      paramIndex++;
    }
    
    // Property type (single selection)
    if (filters.propertyType) {
      whereConditions.push(`p.type = $${paramIndex}`);
      queryParams.push(filters.propertyType);
      paramIndex++;
    }
    
    // Bedrooms (minimum count)
    if (filters.bedrooms) {
      whereConditions.push(`p.bedrooms >= $${paramIndex}`);
      queryParams.push(parseInt(filters.bedrooms));
      paramIndex++;
    }
    
    // Bathrooms (minimum count)
    if (filters.bathrooms) {
      whereConditions.push(`p.bathrooms >= $${paramIndex}`);
      queryParams.push(parseInt(filters.bathrooms));
      paramIndex++;
    }
    
    // Amenities
    if (filters.amenities && filters.amenities.length > 0) {
      if (filters.amenities.includes('AC')) {
        whereConditions.push(`p.has_ac = true`);
      }
      if (filters.amenities.includes('Lift')) {
        whereConditions.push(`p.has_lift = true`);
      }
      if (filters.amenities.includes('Parking')) {
        whereConditions.push(`p.has_parking = true`);
      }
    }
    
    // Property type-specific filters
    if (filters.area) {
      whereConditions.push(`p.area >= $${paramIndex}`);
      queryParams.push(parseFloat(filters.area));
      paramIndex++;
    }
    
    if (filters.roadWidth) {
      whereConditions.push(`p.road_width >= $${paramIndex}`);
      queryParams.push(parseFloat(filters.roadWidth));
      paramIndex++;
    }
    
    if (filters.floorNumber) {
      whereConditions.push(`p.floor_number >= $${paramIndex}`);
      queryParams.push(parseInt(filters.floorNumber));
      paramIndex++;
    }
    
    if (filters.totalFloors) {
      whereConditions.push(`p.total_floors >= $${paramIndex}`);
      queryParams.push(parseInt(filters.totalFloors));
      paramIndex++;
    }
    
    if (filters.parkingSpaces) {
      whereConditions.push(`p.parking_spaces >= $${paramIndex}`);
      queryParams.push(parseInt(filters.parkingSpaces));
      paramIndex++;
    }
    
    if (filters.isCornerPlot !== undefined) {
      whereConditions.push(`p.is_corner_plot = $${paramIndex}`);
      queryParams.push(filters.isCornerPlot === 'true' || filters.isCornerPlot === true);
      paramIndex++;
    }
    
    if (filters.isFurnished !== undefined) {
      whereConditions.push(`p.is_furnished = $${paramIndex}`);
      queryParams.push(filters.isFurnished === 'true' || filters.isFurnished === true);
      paramIndex++;
    }
    
    // Add WHERE conditions to query
    if (whereConditions.length > 0) {
      baseQuery += ` AND ` + whereConditions.join(' AND ');
    }
    
    return { query: baseQuery, paramIndex };
  }

  static async get(id) {
    try {
      const db = getDB();
      await db.query('BEGIN');
      await db.query('UPDATE properties SET views = views + 1 WHERE id = $1', [id]);
      const query = `
        SELECT p.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone, u.avatar as owner_avatar
        FROM properties p LEFT JOIN users u ON p.owner_id = u.id WHERE p.id = $1
      `;
      const result = await db.query(query, [id]);
      await db.query('COMMIT');
      return this.formatProperty(result.rows[0]);
    } catch (err) {
      await getDB().query('ROLLBACK');
      console.error(`[PropertyService] Error fetching property ${id}:`, err);
      throw new Error(`Database error while fetching property.`);
    }
  }

  static async create(propertyData, ownerId) {
    try {
      const db = getDB();
      console.log('[PropertyService] Creating property with data:', propertyData);

      // Safely parse JSON string fields from the form data
      const features = JSON.parse(propertyData.features || '{}');
      const nearbyFacilities = JSON.parse(propertyData.nearbyFacilities || '[]');
      
      // Get image paths and other features from the data objects
      const imageUrls = propertyData.images || [];
      console.log('[PropertyService] Image URLs:', imageUrls);
      const customFeatures = features.customFeatures || [];
      const nearbyFacilitiesJson = JSON.stringify(nearbyFacilities);

      const query = `
        INSERT INTO properties (
          id, owner_id, status, title, description, type, price, location, availability,
          images, bedrooms, bathrooms, floor_number, total_floors, area, road_width,
          is_corner_plot, parking_spaces, is_furnished, has_ac, has_lift, has_parking,
          custom_features, nearby_facilities, listing_type, created_at, updated_at
        ) VALUES (
          $1, $2, 'Pending Verification', $3, $4, $5, $6, $7, $8, 
          $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, 
          $22, $23, $24, NOW(), NOW()
        ) RETURNING *;
      `;
      
      const values = [
        randomUUID(),                           // id
        ownerId,                                // owner_id
        propertyData.title,                     // title
        propertyData.description,               // description
        propertyData.type,                      // type
        parseFloat(propertyData.price),         // price
        propertyData.location,                  // location
        propertyData.availability,              // availability
        imageUrls,                              // images (text[])
        features.bedrooms || null,              // bedrooms
        features.bathrooms || null,             // bathrooms
        features.floorNumber || null,           // floor_number
        features.totalFloors || null,           // total_floors
        features.area || null,                  // area
        features.roadWidth || null,             // road_width
        features.isCornerPlot || false,         // is_corner_plot
        features.parkingSpaces || null,         // parking_spaces
        features.isFurnished || false,          // is_furnished
        features.hasAC || false,                // has_ac
        features.hasLift || false,              // has_lift
        features.hasParking || false,           // has_parking
        customFeatures,                         // custom_features (text[])
        nearbyFacilitiesJson,                   // nearby_facilities (jsonb)
        propertyData.listingType                // listing_type
      ];

      console.log('[PropertyService] Executing query with values:', values);
      const result = await db.query(query, values);
      console.log('[PropertyService] Database result:', result.rows[0]);
      return this.formatProperty(result.rows[0]);

    } catch (err) {
      console.error('[PropertyService] Error creating property:', err);
      throw new Error(`Database error while creating property: ${err.message}`);
    }
  }

  static async getByOwner(ownerId) {
    try {
      const db = getDB();
      const query = `
        SELECT p.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone, u.avatar as owner_avatar
        FROM properties p LEFT JOIN users u ON p.owner_id = u.id WHERE p.owner_id = $1 ORDER BY p.created_at DESC
      `;
      const result = await db.query(query, [ownerId]);
      return result.rows.map(this.formatProperty);
    } catch (err) {
      console.error(`[PropertyService] Error fetching properties by owner ${ownerId}:`, err);
      throw new Error(`Database error while fetching properties by owner.`);
    }
  }
}

module.exports = PropertyService;
