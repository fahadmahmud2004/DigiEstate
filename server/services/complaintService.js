const { getDB } = require('../config/database.js');
const { randomUUID } = require('crypto');

class ComplaintService {
  static async create(complaintData) {
    try {
      console.log(`[ComplaintService] Creating complaint from user: ${complaintData.complainant}`);
      const db = getDB();
      
      const id = randomUUID();
      const {
        complainant, target, targetType, type, description, evidence = []
      } = complaintData;
      
      const result = await db.query(`
        INSERT INTO complaints (
          id, complainant, target, target_type, type, description, evidence,
          status, resolution, admin_notes, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, 'open', '', '', NOW(), NOW()
        ) RETURNING *`,
        [id, complainant, target, targetType, type, description, evidence]
      );
      
      console.log(`[ComplaintService] Complaint created with ID: ${id}`);
      return result.rows[0];
    } catch (err) {
      console.error(`[ComplaintService] Error creating complaint: ${err.message}`);
      throw new Error(`Database error while creating complaint: ${err.message}`);
    }
  }

  static async getAll(page = 1, limit = 10) {
    try {
      console.log(`[ComplaintService] Fetching all complaints - page: ${page}, limit: ${limit}`);
      const db = getDB();
      
      const offset = (page - 1) * limit;
      
      // Get total count
      const countResult = await db.query('SELECT COUNT(*) FROM complaints');
      const total = parseInt(countResult.rows[0].count);
      
      // Get paginated complaints with complainant and target info
      const result = await db.query(`
        SELECT c.*, 
               u1.name as complainant_name, u1.email as complainant_email,
               u2.name as target_name, u2.email as target_email,
               p.title as property_title
        FROM complaints c
        LEFT JOIN users u1 ON c.complainant = u1.id::text
        LEFT JOIN users u2 ON c.target = u2.id::text AND c.target_type = 'user'
        LEFT JOIN properties p ON c.target = p.id AND c.target_type = 'property'
        ORDER BY c.created_at DESC 
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
      
      console.log(`[ComplaintService] Retrieved ${result.rows.length} complaints out of ${total} total`);
      
      return {
        complaints: result.rows,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (err) {
      console.error(`[ComplaintService] Error fetching complaints: ${err.message}`);
      throw new Error(`Database error while fetching complaints: ${err.message}`);
    }
  }

  static async updateStatus(complaintId, status, resolution = '', adminNotes = '') {
    try {
      console.log(`[ComplaintService] Updating complaint ${complaintId} status to: ${status}`);
      const db = getDB();
      
      const validStatuses = ['open', 'in-progress', 'resolved', 'dismissed'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid complaint status');
      }
      
      const result = await db.query(
        `UPDATE complaints 
         SET status = $1, resolution = $2, admin_notes = $3, updated_at = NOW() 
         WHERE id = $4 RETURNING *`,
        [status, resolution, adminNotes, complaintId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Complaint not found');
      }
      
      console.log(`[ComplaintService] Complaint ${complaintId} status updated to: ${status}`);
      return result.rows[0];
    } catch (err) {
      console.error(`[ComplaintService] Error updating complaint status: ${err.message}`);
      throw new Error(`Database error while updating complaint status: ${err.message}`);
    }
  }

  static async get(id) {
    try {
      console.log(`[ComplaintService] Fetching complaint: ${id}`);
      const db = getDB();
      
      const result = await db.query(`
        SELECT c.*, 
               u1.name as complainant_name, u1.email as complainant_email,
               u2.name as target_name, u2.email as target_email,
               p.title as property_title
        FROM complaints c
        LEFT JOIN users u1 ON c.complainant = u1.id::text
        LEFT JOIN users u2 ON c.target = u2.id::text AND c.target_type = 'user'
        LEFT JOIN properties p ON c.target = p.id AND c.target_type = 'property'
        WHERE c.id = $1
      `, [id]);
      
      return result.rows[0] || null;
    } catch (err) {
      console.error(`[ComplaintService] Error fetching complaint: ${err.message}`);
      throw new Error(`Database error while fetching complaint: ${err.message}`);
    }
  }
}

module.exports = ComplaintService;