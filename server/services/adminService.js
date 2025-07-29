const { getDB } = require('../config/database.js');

class AdminService {
  static formatProperty(row) {
    if (!row) return null;
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    return {
      _id: row.id,
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
        email: row.owner_email || 'Unknown',
        reputation: row.owner_reputation || 4.5
      },
      status: row.status,
      views: row.views || 0,
      inquiries: row.inquiries || 0,
      bookings: row.bookings || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  static async getAllUsers(page = 1, limit = 10) {
    try {
      console.log(`[AdminService] Fetching all users - page: ${page}, limit: ${limit}`);
      const db = getDB();
      
      const offset = (page - 1) * limit;
      
      // Get total count
      const countResult = await db.query('SELECT COUNT(*) FROM users');
      const total = parseInt(countResult.rows[0].count);
      
      // Get paginated users
      const result = await db.query(`
        SELECT id, email, name, phone, avatar, role, is_active, reputation, created_at, updated_at, last_login_at
        FROM users 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
      
      console.log(`[AdminService] Retrieved ${result.rows.length} users out of ${total} total`);
      
      return {
        users: result.rows,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (err) {
      console.error(`[AdminService] Error fetching users: ${err.message}`);
      throw new Error(`Database error while fetching users: ${err.message}`);
    }
  }

  static async toggleUserBlock(userId, reason = '') {
    try {
      console.log(`[AdminService] Toggling block status for user: ${userId}`);
      const db = getDB();
      
      // Get current status and user info
      const userResult = await db.query('SELECT is_active, name, email FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const currentStatus = userResult.rows[0].is_active;
      const newStatus = !currentStatus;
      const userName = userResult.rows[0].name || userResult.rows[0].email.split('@')[0];
      
      // Update status
      const result = await db.query(
        'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [newStatus, userId]
      );
      
      // Send notification to the user
      const notificationTitle = newStatus ? 'Account Unblocked' : 'Account Blocked';
      const notificationMessage = reason 
        ? `Your account has been ${newStatus ? 'unblocked' : 'blocked'} by an administrator. Reason: ${reason}`
        : `Your account has been ${newStatus ? 'unblocked' : 'blocked'} by an administrator.`;
      
      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, data, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          userId,
          'admin',
          notificationTitle,
          notificationMessage,
          JSON.stringify({
            action: 'account_status_change',
            oldStatus: currentStatus,
            newStatus: newStatus,
            reason: reason || null
          })
        ]
      );
      
      console.log(`[AdminService] User ${userId} status changed from ${currentStatus} to ${newStatus} with notification`);
      return result.rows[0];
    } catch (err) {
      console.error(`[AdminService] Error toggling user block: ${err.message}`);
      throw new Error(`Database error while toggling user block: ${err.message}`);
    }
  }

  static async getAllProperties(page = 1, limit = 10) {
    try {
      console.log(`[AdminService] Fetching all properties - page: ${page}, limit: ${limit}`);
      const db = getDB();
      
      const offset = (page - 1) * limit;
      
      // Get total count
      const countResult = await db.query('SELECT COUNT(*) FROM properties');
      const total = parseInt(countResult.rows[0].count);
      
      // Get paginated properties with owner info
      const result = await db.query(`
        SELECT p.*, u.name as owner_name, u.email as owner_email, u.reputation as owner_reputation
        FROM properties p
        LEFT JOIN users u ON p.owner_id = u.id
        ORDER BY p.created_at DESC 
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
      
      console.log(`[AdminService] Retrieved ${result.rows.length} properties out of ${total} total`);
      
      return {
        properties: result.rows.map(row => AdminService.formatProperty(row)),
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (err) {
      console.error(`[AdminService] Error fetching properties: ${err.message}`);
      throw new Error(`Database error while fetching properties: ${err.message}`);
    }
  }

  static async updatePropertyStatus(propertyId, status, reason = '') {
    try {
      console.log(`[AdminService] Updating property ${propertyId} status to: ${status}`);
      const db = getDB();
      
      const validStatuses = ['Pending Verification', 'Active', 'Flagged', 'Rejected'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid property status');
      }
      
      // First get the property with owner info
      const propertyResult = await db.query(`
        SELECT p.*, u.name as owner_name, u.email as owner_email, u.reputation as owner_reputation
        FROM properties p
        LEFT JOIN users u ON p.owner_id = u.id
        WHERE p.id = $1
      `, [propertyId]);
      
      if (propertyResult.rows.length === 0) {
        throw new Error('Property not found');
      }
      
      const property = propertyResult.rows[0];
      
      // Temporarily disable triggers to prevent duplicate notifications
      await db.query('SET session_replication_role = replica;');
      
      // Update the property
      await db.query(
        'UPDATE properties SET status = $1, updated_at = NOW() WHERE id = $2',
        [status, propertyId]
      );
      
      // Re-enable triggers
      await db.query('SET session_replication_role = DEFAULT;');
      
      // Get the updated property data
      const updatedPropertyResult = await db.query(`
        SELECT p.*, u.name as owner_name, u.email as owner_email, u.reputation as owner_reputation
        FROM properties p
        LEFT JOIN users u ON p.owner_id = u.id
        WHERE p.id = $1
      `, [propertyId]);
      
      if (updatedPropertyResult.rows.length === 0) {
        throw new Error('Failed to retrieve updated property');
      }
      
      const updatedProperty = updatedPropertyResult.rows[0];
      
      // Manually create notification with admin's reason
      let notificationTitle, notificationMessage;
      
      switch (status) {
        case 'Active':
          notificationTitle = 'Property Approved';
          notificationMessage = `Your property "${updatedProperty.title}" has been approved and is now live on the platform.`;
          break;
        case 'Flagged':
          notificationTitle = 'Property Flagged';
          notificationMessage = reason 
            ? `Your property "${updatedProperty.title}" has been flagged by an administrator for review. Reason: ${reason}`
            : `Your property "${updatedProperty.title}" has been flagged by an administrator for review.`;
          break;
        case 'Rejected':
          notificationTitle = 'Property Rejected';
          notificationMessage = reason 
            ? `Your property "${updatedProperty.title}" has been rejected by an administrator. Reason: ${reason}`
            : `Your property "${updatedProperty.title}" has been rejected by an administrator.`;
          break;
        default:
          notificationTitle = 'Property Status Updated';
          notificationMessage = `Your property "${updatedProperty.title}" status has been updated to ${status}.`;
      }
      
      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, data, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          updatedProperty.owner_id,
          'admin',
          notificationTitle,
          notificationMessage,
          JSON.stringify({
            propertyId: updatedProperty.id,
            propertyTitle: updatedProperty.title,
            oldStatus: property.status,
            newStatus: status,
            action: 'status_change',
            reason: reason || null
          })
        ]
      );
      
      console.log(`[AdminService] Property ${propertyId} status updated to: ${status}`);
      return AdminService.formatProperty(updatedProperty);
    } catch (err) {
      console.error(`[AdminService] Error updating property status: ${err.message}`);
      throw new Error(`Database error while updating property status: ${err.message}`);
    }
  }

  static async deleteProperty(propertyId, reason = '') {
    try {
      console.log(`[AdminService] Deleting property ${propertyId}`);
      const db = getDB();
      
      // First get the property to ensure it exists
      const propertyResult = await db.query(
        'SELECT * FROM properties WHERE id = $1',
        [propertyId]
      );
      
      if (propertyResult.rows.length === 0) {
        throw new Error('Property not found');
      }
      
      const property = propertyResult.rows[0];
      console.log(`[AdminService] Found property: ${property.title}`);
      
      // Check if there are any bookings for this property
      const bookingsResult = await db.query(
        'SELECT COUNT(*) as count FROM bookings WHERE property_id = $1',
        [propertyId]
      );
      
      console.log(`[AdminService] Found ${bookingsResult.rows[0].count} bookings for property`);
      
      // Temporarily disable triggers to prevent duplicate notifications
      await db.query('SET session_replication_role = replica;');
      
      // Delete the property
      const result = await db.query(
        'DELETE FROM properties WHERE id = $1 RETURNING id',
        [propertyId]
      );
      
      // Re-enable triggers
      await db.query('SET session_replication_role = DEFAULT;');
      
      if (result.rows.length === 0) {
        throw new Error('Failed to delete property');
      }
      
      // Manually create notification with admin's reason
      const notificationMessage = reason 
        ? `Your property "${property.title}" has been deleted by an administrator. Reason: ${reason}`
        : `Your property "${property.title}" has been deleted by an administrator.`;
      
      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, data, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          property.owner_id,
          'admin',
          'Property Deleted',
          notificationMessage,
          JSON.stringify({
            propertyId: property.id,
            propertyTitle: property.title,
            action: 'deletion',
            reason: reason || null
          })
        ]
      );
      
      console.log(`[AdminService] Property ${propertyId} deleted successfully with notification`);
      return {
        success: true,
        message: `Property "${property.title}" has been deleted successfully`,
        propertyId: propertyId
      };
    } catch (err) {
      console.error(`[AdminService] Error deleting property: ${err.message}`);
      console.error(`[AdminService] Error stack: ${err.stack}`);
      throw new Error(`Database error while deleting property: ${err.message}`);
    }
  }
}

module.exports = AdminService;