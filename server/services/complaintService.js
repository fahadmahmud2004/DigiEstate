const { getDB } = require('../config/database.js');
const { randomUUID } = require('crypto');

class ComplaintService {
  // Enhanced complaint creation with property-specific validation
  static async createPropertyComplaint(complainantId, propertyId, type, description, evidence = []) {
    try {
      console.log(`[ComplaintService] Creating property complaint from user: ${complainantId}`);
      const db = getDB();
      
      // Get property details first
      const property = await db.query(
        'SELECT * FROM properties WHERE id = $1',
        [propertyId]
      );

      if (!property.rows.length) {
        throw new Error('Property not found');
      }

      const propertyData = property.rows[0];

      // Prevent owner from complaining about their own property
      if (propertyData.owner_id === complainantId) {
        throw new Error('Cannot file complaint against your own property');
      }

      // Create complaint
      const complaintId = randomUUID();
      const result = await db.query(`
        INSERT INTO complaints (
          id, complainant_id, target_id, target_type, type, description, evidence
        ) VALUES ($1, $2, $3, 'property', $4, $5, $6)
        RETURNING *
      `, [complaintId, complainantId, propertyId, type, description, evidence]);

      const complaint = result.rows[0];

      // Send notification to property owner
      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, data, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          propertyData.owner_id,
          'complaint_filed',
          'Complaint Filed Against Your Property',
          `A complaint has been filed against your property "${propertyData.title}" for ${type}`,
          JSON.stringify({
            complaintId: complaint.id,
            propertyId: propertyId,
            propertyTitle: propertyData.title,
            complaintType: type,
            complainantId: complainantId
          })
        ]
      );

      console.log(`[ComplaintService] Property complaint created with ID: ${complaintId}`);
      return { success: true, complaint };
    } catch (error) {
      console.error(`[ComplaintService] Error creating property complaint: ${error.message}`);
      throw error;
    }
  }

  // Admin complaint resolution with property action
  static async resolveComplaintWithAction(complaintId, adminId, resolution, action, reason = '') {
    try {
      console.log(`[ComplaintService] Resolving complaint ${complaintId} with action: ${action}`);
      const db = getDB();
      
      // Get complaint details
      const complaintResult = await db.query(`
        SELECT c.*, p.title as property_title, p.owner_id, p.status as property_status
        FROM complaints c
        LEFT JOIN properties p ON c.target_id = p.id
        WHERE c.id = $1 AND c.target_type = 'property'
      `, [complaintId]);

      if (!complaintResult.rows.length) {
        throw new Error('Property complaint not found');
      }

      const complaint = complaintResult.rows[0];
      
      // Start transaction
      await db.query('BEGIN');

      try {
        // Update complaint status
        await db.query(`
          UPDATE complaints 
          SET status = 'resolved', resolution = $1, updated_at = NOW()
          WHERE id = $2
        `, [resolution, complaintId]);

        // Perform admin action on property
        let propertyAction = null;
        if (action === 'flag') {
          await db.query(
            'UPDATE properties SET status = $1 WHERE id = $2',
            ['Flagged', complaint.target_id]
          );
          propertyAction = 'flagged';
        } else if (action === 'delete') {
          await db.query(
            'UPDATE properties SET status = $1 WHERE id = $2',
            ['Rejected', complaint.target_id]
          );
          propertyAction = 'deleted';
        }

        // Notify complainant
        await db.query(
          `INSERT INTO notifications (user_id, type, title, message, data, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            complaint.complainant_id,
            'complaint_resolved',
            'Your Complaint Has Been Resolved',
            `Your complaint against "${complaint.property_title}" has been resolved. Action taken: ${propertyAction || 'reviewed'}`,
            JSON.stringify({
              complaintId: complaint.id,
              propertyId: complaint.target_id,
              propertyTitle: complaint.property_title,
              action: propertyAction,
              resolution: resolution
            })
          ]
        );

        // Notify property owner about complaint resolution and action
        if (propertyAction) {
          await db.query(
            `INSERT INTO notifications (user_id, type, title, message, data, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
              complaint.owner_id,
              'complaint_resolved',
              `Property ${propertyAction === 'flagged' ? 'Flagged' : 'Removed'} Due to Complaint`,
              `Your property "${complaint.property_title}" has been ${propertyAction} following a complaint resolution. ${reason ? 'Reason: ' + reason : ''}`,
              JSON.stringify({
                complaintId: complaint.id,
                propertyId: complaint.target_id,
                propertyTitle: complaint.property_title,
                action: propertyAction,
                reason: reason,
                canAppeal: true
              })
            ]
          );
        }

        await db.query('COMMIT');
        console.log(`[ComplaintService] Complaint ${complaintId} resolved with action: ${propertyAction}`);
        
        return { 
          success: true, 
          complaint: complaint,
          action: propertyAction,
          canAppeal: propertyAction !== null
        };
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error(`[ComplaintService] Error resolving complaint: ${error.message}`);
      throw error;
    }
  }

  // Existing methods remain the same...
  static async create(complaintData) {
    try {
      console.log(`[ComplaintService] Creating complaint from user: ${complaintData.complainant_id}`);
      const db = getDB();
      
      const id = randomUUID();
      const {
        complainant_id, target_id, target_type, type, description, evidence = []
      } = complaintData;
      
      const result = await db.query(`
        INSERT INTO complaints (
          id, complainant_id, target_id, target_type, type, description, evidence,
          status, resolution, admin_notes, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, 'open', '', '', NOW(), NOW()
        ) RETURNING *`,
        [id, complainant_id, target_id, target_type, type, description, evidence]
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
        LEFT JOIN users u1 ON c.complainant_id = u1.id
        LEFT JOIN users u2 ON c.target_id = u2.id AND c.target_type = 'user'
        LEFT JOIN properties p ON c.target_id = p.id AND c.target_type = 'property'
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
      
<<<<<<< HEAD
      // First get the complaint with complainant info
      const complaintResult = await db.query(`
        SELECT c.*, u.name as complainant_name, u.email as complainant_email
        FROM complaints c
        LEFT JOIN users u ON c.complainant_id = u.id
        WHERE c.id = $1
      `, [complaintId]);
      
      if (complaintResult.rows.length === 0) {
        throw new Error('Complaint not found');
      }
      
      const complaint = complaintResult.rows[0];
      
      // Update the complaint
=======
>>>>>>> 52e8353 (Saving my latest work before merging)
      const result = await db.query(
        `UPDATE complaints 
         SET status = $1, resolution = $2, admin_notes = $3, updated_at = NOW() 
         WHERE id = $4 RETURNING *`,
        [status, resolution, adminNotes, complaintId]
      );
      
<<<<<<< HEAD
      // Send notification to the complainant
      let notificationTitle, notificationMessage;
      
      switch (status) {
        case 'resolved':
          notificationTitle = 'Complaint Resolved';
          notificationMessage = resolution 
            ? `Your complaint has been resolved. Resolution: ${resolution}`
            : 'Your complaint has been resolved.';
          break;
        case 'dismissed':
          notificationTitle = 'Complaint Dismissed';
          notificationMessage = adminNotes 
            ? `Your complaint has been dismissed. Admin notes: ${adminNotes}`
            : 'Your complaint has been dismissed.';
          break;
        case 'in-progress':
          notificationTitle = 'Complaint Under Review';
          notificationMessage = 'Your complaint is now under review by our team.';
          break;
        default:
          notificationTitle = 'Complaint Status Updated';
          notificationMessage = `Your complaint status has been updated to ${status}.`;
      }
      
      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, data, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          complaint.complainant_id,
          'admin',
          notificationTitle,
          notificationMessage,
          JSON.stringify({
            complaintId: complaint.id,
            oldStatus: complaint.status,
            newStatus: status,
            action: 'complaint_status_change',
            resolution: resolution || null,
            adminNotes: adminNotes || null
          })
        ]
      );
      
      console.log(`[ComplaintService] Complaint ${complaintId} status updated to: ${status} with notification`);
=======
      console.log(`[ComplaintService] Complaint ${complaintId} status updated to: ${status}`);
>>>>>>> 52e8353 (Saving my latest work before merging)
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
               p.title as property_title, p.owner_id, p.status as property_status
        FROM complaints c
        LEFT JOIN users u1 ON c.complainant_id = u1.id
        LEFT JOIN users u2 ON c.target_id = u2.id AND c.target_type = 'user'
        LEFT JOIN properties p ON c.target_id = p.id AND c.target_type = 'property'
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
