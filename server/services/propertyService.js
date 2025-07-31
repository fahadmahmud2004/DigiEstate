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
      images: Array.isArray(row.images) ? row.images.map(img => `${baseUrl}/${img.replace(/\\/g, '/')}`) : [],
      videos: Array.isArray(row.videos) ? row.videos : [],
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
        customFeatures: Array.isArray(row.custom_features) ? row.custom_features : []
      },
      nearbyFacilities: Array.isArray(row.nearby_facilities) ? row.nearby_facilities : [],
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
      const videoUrls = propertyData.videos || []; // Handle videos array
      console.log('[PropertyService] Image URLs:', imageUrls);
      console.log('[PropertyService] Video URLs:', videoUrls);
      const customFeatures = features.customFeatures || [];
      const nearbyFacilitiesJson = JSON.stringify(nearbyFacilities);

      const query = `
        INSERT INTO properties (
          id, owner_id, status, title, description, type, price, location, availability,
          images, videos, bedrooms, bathrooms, floor_number, total_floors, area, road_width,
          is_corner_plot, parking_spaces, is_furnished, has_ac, has_lift, has_parking,
          custom_features, nearby_facilities, listing_type, created_at, updated_at
        ) VALUES (
          $1, $2, 'Pending Verification', $3, $4, $5, $6, $7, $8, 
          $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22,
          $23, $24, $25, NOW(), NOW()
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
        videoUrls,                              // videos (text[])
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
      // Show ALL properties for owner (including rejected/deleted ones)
      // This allows owners to see what happened to their properties
      const query = `
        SELECT p.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone, u.avatar as owner_avatar
        FROM properties p LEFT JOIN users u ON p.owner_id = u.id 
        WHERE p.owner_id = $1 
        ORDER BY p.created_at DESC
      `;
      const result = await db.query(query, [ownerId]);
      return result.rows.map(this.formatProperty);
    } catch (err) {
      console.error(`[PropertyService] Error fetching properties by owner ${ownerId}:`, err);
      throw new Error(`Database error while fetching properties by owner.`);
    }
  }

  static async update(propertyId, propertyData, ownerId) {
    const db = getDB();
    try {
      console.log(`[PropertyService] Updating property ${propertyId} by owner ${ownerId}`);
      
      // First, verify the property exists and belongs to the user
      const checkQuery = `SELECT id, owner_id FROM properties WHERE id = $1 AND owner_id = $2`;
      const checkResult = await db.query(checkQuery, [propertyId, ownerId]);
      
      if (checkResult.rows.length === 0) {
        throw new Error('Property not found or you do not have permission to edit it');
      }

      // Handle images - if new images are provided, they replace existing ones
      let images = [];
      if (propertyData.images && propertyData.images.length > 0) {
        images = propertyData.images;
      } else if (propertyData.existingImages) {
        // Keep existing images if no new ones provided
        images = JSON.parse(propertyData.existingImages);
      }

      // Handle videos similarly
      let videos = [];
      if (propertyData.videos && propertyData.videos.length > 0) {
        videos = propertyData.videos;
      } else if (propertyData.existingVideos) {
        // Keep existing videos if no new ones provided
        videos = JSON.parse(propertyData.existingVideos);
      }

      // Parse custom features
      let customFeatures = [];
      if (propertyData.customFeatures) {
        try {
          customFeatures = JSON.parse(propertyData.customFeatures);
        } catch (e) {
          console.warn('Failed to parse customFeatures, using empty array');
        }
      }

      // Parse nearby facilities
      let nearbyFacilities = [];
      if (propertyData.nearbyFacilities) {
        try {
          const parsed = JSON.parse(propertyData.nearbyFacilities);
          nearbyFacilities = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.warn('Failed to parse nearbyFacilities, using empty array');
          nearbyFacilities = [];
        }
      }

      const updateQuery = `
        UPDATE properties SET
          listing_type = $2,
          title = $3,
          description = $4,
          type = $5,
          price = $6,
          location = $7,
          availability = $8,
          images = $9,
          videos = $10,
          bedrooms = $11,
          bathrooms = $12,
          floor_number = $13,
          total_floors = $14,
          area = $15,
          road_width = $16,
          is_corner_plot = $17,
          parking_spaces = $18,
          is_furnished = $19,
          has_ac = $20,
          has_lift = $21,
          has_parking = $22,
          custom_features = $23,
          nearby_facilities = $24,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND owner_id = $25
        RETURNING *
      `;

      const values = [
        propertyId,
        propertyData.listingType,
        propertyData.title,
        propertyData.description,
        propertyData.type,
        parseFloat(propertyData.price),
        propertyData.location,
        propertyData.availability,
        images,
        videos,
        propertyData.bedrooms ? parseInt(propertyData.bedrooms) : null,
        propertyData.bathrooms ? parseInt(propertyData.bathrooms) : null,
        propertyData.floorNumber ? parseInt(propertyData.floorNumber) : null,
        propertyData.totalFloors ? parseInt(propertyData.totalFloors) : null,
        propertyData.area ? parseFloat(propertyData.area) : null,
        propertyData.roadWidth ? parseFloat(propertyData.roadWidth) : null,
        propertyData.isCornerPlot === 'true',
        propertyData.parkingSpaces ? parseInt(propertyData.parkingSpaces) : null,
        propertyData.isFurnished === 'true',
        propertyData.hasAC === 'true',
        propertyData.hasLift === 'true',
        propertyData.hasParking === 'true',
        customFeatures,
        JSON.stringify(nearbyFacilities),
        ownerId
      ];

      console.log('[PropertyService] Executing update query with values:', values);
      const result = await db.query(updateQuery, values);

      if (result.rows.length === 0) {
        throw new Error('Failed to update property');
      }

      console.log('[PropertyService] Successfully updated property:', result.rows[0]);
      return this.formatProperty(result.rows[0]);

    } catch (err) {
      console.error(`[PropertyService] Error updating property ${propertyId}:`, err);
      throw new Error(err.message || 'Database error while updating property.');
    }
  }

  static async delete(propertyId, ownerId, isAdminDeletion = false) {
    const db = getDB();
    try {
      console.log(`[PropertyService] Attempting to delete property ${propertyId} by owner ${ownerId}, admin deletion: ${isAdminDeletion}`);
      
      // First, verify the property exists and belongs to the user (unless admin)
      const checkQuery = `
        SELECT id, images, status FROM properties WHERE id = $1 ${!isAdminDeletion ? 'AND owner_id = $2' : ''}
      `;
      const checkParams = isAdminDeletion ? [propertyId] : [propertyId, ownerId];
      const checkResult = await db.query(checkQuery, checkParams);
      
      if (checkResult.rows.length === 0) {
        throw new Error('Property not found or you do not have permission to delete it');
      }

      const property = checkResult.rows[0];
      
      if (isAdminDeletion) {
        // ADMIN DELETION: Soft delete by setting status to 'Rejected'
        console.log(`[PropertyService] Admin soft-deleting property (status → 'Rejected')`);
        
        const updateQuery = `
          UPDATE properties 
          SET status = 'Rejected', updated_at = NOW() 
          WHERE id = $1
        `;
        const updateResult = await db.query(updateQuery, [propertyId]);

        if (updateResult.rowCount === 0) {
          throw new Error('Failed to update property status');
        }

        // Note: This will trigger the property_status_change_trigger 
        // which handles reputation penalties and notifications
        
        console.log(`[PropertyService] Successfully soft-deleted property ${propertyId} (status = 'Rejected')`);
        return { success: true, message: 'Property rejected and removed from listings' };
        
      } else {
        // USER DELETION: Hard delete (they own it, can remove completely)
        console.log(`[PropertyService] User hard-deleting property (complete removal)`);
        
        // First, create a custom notification for self-deletion
        const notificationQuery = `
          INSERT INTO notifications (user_id, type, title, message, data, created_at)
          VALUES ($1, 'property', 'Property Deleted', 'Your property "' || (SELECT COALESCE(title, 'Untitled Property') FROM properties WHERE id = $2) || '" has been deleted successfully.', 
          jsonb_build_object('propertyId', $2, 'propertyTitle', (SELECT COALESCE(title, 'Untitled Property') FROM properties WHERE id = $2), 'action', 'self_deletion'), NOW())
        `;
        
        // Temporarily disable the trigger to avoid the "admin deleted" message
        await db.query('ALTER TABLE properties DISABLE TRIGGER property_deletion_trigger');
        
        try {
          // Send the self-deletion notification
          await db.query(notificationQuery, [ownerId, propertyId]);
          
          const deleteQuery = `DELETE FROM properties WHERE id = $1 AND owner_id = $2`;
          const deleteResult = await db.query(deleteQuery, [propertyId, ownerId]);

          if (deleteResult.rowCount === 0) {
            throw new Error('Failed to delete property');
          }
        } finally {
          // Re-enable the trigger
          await db.query('ALTER TABLE properties ENABLE TRIGGER property_deletion_trigger');
        }

        console.log(`[PropertyService] Successfully hard-deleted property ${propertyId}`);
        return { success: true, message: 'Property deleted successfully' };
      }

    } catch (err) {
      console.error(`[PropertyService] Error deleting property ${propertyId}:`, err);
      throw new Error(err.message || 'Database error while deleting property.');
    }
  }
}

module.exports = PropertyService;
