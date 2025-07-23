const { getDB } = require('../config/database.js');

class AdminService {
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

  static async toggleUserBlock(userId) {
    try {
      console.log(`[AdminService] Toggling block status for user: ${userId}`);
      const db = getDB();
      
      // Get current status
      const userResult = await db.query('SELECT is_active FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const currentStatus = userResult.rows[0].is_active;
      const newStatus = !currentStatus;
      
      // Update status
      const result = await db.query(
        'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [newStatus, userId]
      );
      
      console.log(`[AdminService] User ${userId} status changed from ${currentStatus} to ${newStatus}`);
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
        SELECT p.*, u.name as owner_name, u.email as owner_email
        FROM properties p
        LEFT JOIN users u ON p.owner_id = u.id
        ORDER BY p.created_at DESC 
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
      
      console.log(`[AdminService] Retrieved ${result.rows.length} properties out of ${total} total`);
      
      return {
        properties: result.rows,
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
      
      const result = await db.query(
        'UPDATE properties SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [status, propertyId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Property not found');
      }
      
      console.log(`[AdminService] Property ${propertyId} status updated to: ${status}`);
      return result.rows[0];
    } catch (err) {
      console.error(`[AdminService] Error updating property status: ${err.message}`);
      throw new Error(`Database error while updating property status: ${err.message}`);
    }
  }
}

module.exports = AdminService;