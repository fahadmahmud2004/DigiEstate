const { getDB } = require('../config/database.js');

class AppealService {
  static async create(appealData, userId) {
    try {
      console.log(`[AppealService] Creating appeal for user: ${userId}`);
      const db = getDB();
      
      const result = await db.query(
        `INSERT INTO appeals (complaint_id, property_id, property_owner_id, complainant_id, message, evidence_photos, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING *`,
        [
          appealData.complaint_id,
          appealData.property_id,
          appealData.property_owner_id,
          appealData.complainant_id,
          appealData.message,
          appealData.evidence_photos || [],
          'pending'
        ]
      );

      const newAppeal = result.rows[0];
      console.log(`[AppealService] Appeal created successfully with ID: ${newAppeal.id}`);
      return newAppeal;
    } catch (err) {
      console.error(`[AppealService] Error creating appeal: ${err.message}`);
      throw new Error(`Database error while creating appeal: ${err.message}`);
    }
  }

  static async getByOwner(ownerId) {
    try {
      console.log(`[AppealService] Fetching appeals for owner: ${ownerId}`);
      const db = getDB();
      
      const result = await db.query(
        `SELECT a.*, c.description as complaint_description, c.type as complaint_type, c.status as complaint_status,
                p.title as property_title, u1.name as complainant_name, u2.name as owner_name
         FROM appeals a
         LEFT JOIN complaints c ON a.complaint_id = c.id
         LEFT JOIN properties p ON a.property_id = p.id
         LEFT JOIN users u1 ON a.complainant_id = u1.id
         LEFT JOIN users u2 ON a.property_owner_id = u2.id
         WHERE a.property_owner_id = $1
         ORDER BY a.created_at DESC`,
        [ownerId]
      );

      console.log(`[AppealService] Retrieved ${result.rows.length} appeals for owner`);
      return result.rows;
    } catch (err) {
      console.error(`[AppealService] Error fetching appeals: ${err.message}`);
      throw new Error(`Database error while fetching appeals: ${err.message}`);
    }
  }

  static async getAll(page = 1, limit = 10) {
    try {
      console.log(`[AppealService] Fetching all appeals with pagination: page=${page}, limit=${limit}`);
      const db = getDB();
      
      const offset = (page - 1) * limit;
      
      const result = await db.query(
        `SELECT a.*, c.description as complaint_description, c.type as complaint_type, c.status as complaint_status,
                p.title as property_title, u1.name as complainant_name, u2.name as owner_name
         FROM appeals a
         LEFT JOIN complaints c ON a.complaint_id = c.id
         LEFT JOIN properties p ON a.property_id = p.id
         LEFT JOIN users u1 ON a.complainant_id = u1.id
         LEFT JOIN users u2 ON a.property_owner_id = u2.id
         ORDER BY a.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const countResult = await db.query('SELECT COUNT(*) FROM appeals');
      const total = parseInt(countResult.rows[0].count);

      console.log(`[AppealService] Retrieved ${result.rows.length} appeals, total: ${total}`);
      return {
        appeals: result.rows,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (err) {
      console.error(`[AppealService] Error fetching appeals: ${err.message}`);
      throw new Error(`Database error while fetching appeals: ${err.message}`);
    }
  }

  static async updateStatus(appealId, status, adminResponse) {
    try {
      console.log(`[AppealService] Updating appeal status: ${appealId} to ${status}`);
      const db = getDB();
      
      const updateData = {
        status,
        updated_at: new Date()
      };

      if (status === 'approved' || status === 'rejected') {
        updateData.resolved_at = new Date();
      }

      if (adminResponse) {
        updateData.admin_response = adminResponse;
      }

      const fields = [];
      const values = [];
      let index = 1;

      for (let key in updateData) {
        if (updateData[key] !== undefined) {
          fields.push(`${key} = $${index++}`);
          values.push(updateData[key]);
        }
      }

      values.push(appealId);
      const query = `UPDATE appeals SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`;

      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Appeal not found');
      }

      console.log(`[AppealService] Appeal status updated successfully: ${appealId}`);
      return result.rows[0];
    } catch (err) {
      console.error(`[AppealService] Error updating appeal status: ${err.message}`);
      throw new Error(`Database error while updating appeal status: ${err.message}`);
    }
  }

  static async getById(appealId) {
    try {
      console.log(`[AppealService] Fetching appeal with ID: ${appealId}`);
      const db = getDB();
      
      const result = await db.query(
        `SELECT a.*, c.description as complaint_description, c.type as complaint_type, c.status as complaint_status,
                p.title as property_title, u1.name as complainant_name, u2.name as owner_name
         FROM appeals a
         LEFT JOIN complaints c ON a.complaint_id = c.id
         LEFT JOIN properties p ON a.property_id = p.id
         LEFT JOIN users u1 ON a.complainant_id = u1.id
         LEFT JOIN users u2 ON a.property_owner_id = u2.id
         WHERE a.id = $1`,
        [appealId]
      );

      if (result.rows.length === 0) {
        throw new Error('Appeal not found');
      }

      console.log(`[AppealService] Appeal found: ${appealId}`);
      return result.rows[0];
    } catch (err) {
      console.error(`[AppealService] Error fetching appeal: ${err.message}`);
      throw new Error(`Database error while fetching appeal: ${err.message}`);
    }
  }
}

module.exports = AppealService; 