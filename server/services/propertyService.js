const { getDB } = require('../config/database.js');
const { randomUUID } = require('crypto');

class PropertyService {
  static formatProperty(row) {
    if (!row) return null;
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    return {
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
  }

  static async list(filters = {}) {
    try {
      const db = getDB();
      let query = `
        SELECT p.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone, u.avatar as owner_avatar
        FROM properties p
        LEFT JOIN users u ON p.owner_id = u.id
        WHERE p.status = 'Active'
      `;
      const queryParams = [];
      let paramIndex = 1;
      const addFilter = (clause, value) => {
        query += ` AND ${clause}`;
        queryParams.push(value);
        paramIndex++;
      };
      if (filters.search) addFilter(`(LOWER(p.title) LIKE LOWER($${paramIndex}) OR LOWER(p.description) LIKE LOWER($${paramIndex}))`, `%${filters.search}%`);
      if (filters.listingType) addFilter(`p.listing_type = $${paramIndex}`, filters.listingType);
      
      const countQuery = `SELECT COUNT(*) FROM (${query}) as filtered_properties`;
      const countResult = await db.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].count, 10);

      switch (filters.sortBy) {
        case 'price_asc': query += ' ORDER BY p.price ASC'; break;
        case 'price_desc': query += ' ORDER BY p.price DESC'; break;
        default: query += ' ORDER BY p.created_at DESC'; break;
      }

      const limit = parseInt(filters.limit, 10) || 12;
      const page = parseInt(filters.page, 10) || 1;
      const offset = (page - 1) * limit;
      query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      queryParams.push(limit, offset);

      const result = await db.query(query, queryParams);
      const properties = result.rows.map(this.formatProperty);

      return { properties, total, page, totalPages: Math.ceil(total / limit), limit };
    } catch (err) {
      console.error('[PropertyService] Error fetching properties:', err);
      throw new Error(`Database error while fetching properties.`);
    }
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

      // Safely parse JSON string fields from the form data
      const features = JSON.parse(propertyData.features || '{}');
      const nearbyFacilities = JSON.parse(propertyData.nearbyFacilities || '[]');
      
      // Get image paths and other features from the data objects
      const imageUrls = propertyData.images || [];
      const customFeatures = features.customFeatures || [];
      const nearbyFacilitiesJson = JSON.stringify(nearbyFacilities);

      const query = `
        INSERT INTO properties (
          id, owner_id, status, title, description, type, price, location, availability,
          images, bedrooms, bathrooms, floor_number, total_floors, area, road_width,
          is_corner_plot, parking_spaces, is_furnished, has_ac, has_lift, has_parking,
          custom_features, nearby_facilities, created_at, updated_at
        ) VALUES (
          $1, $2, 'Pending Verification', $3, $4, $5, $6, $7, $8, 
          $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, 
          $22, $23, NOW(), NOW()
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
        nearbyFacilitiesJson                    // nearby_facilities (jsonb)
      ];

      const result = await db.query(query, values);
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
