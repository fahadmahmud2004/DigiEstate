const express = require('express');
const router = express.Router();
const AdminService = require('../services/adminService.js');
const ComplaintService = require('../services/complaintService.js');
const AppealService = require('../services/appealService.js');
const { requireAdmin } = require('./middleware/adminAuth.js');
const { getDB } = require('../config/database.js');

// Get all users with pagination
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    console.log(`[ADMIN] GET /api/admin/users - page: ${page}, limit: ${limit}`);
    
    const result = await AdminService.getAllUsers(page, limit);
    
    // Format users for frontend
    const formattedUsers = result.users.map(user => ({
      _id: user.id,
      name: user.name || user.email.split('@')[0],
      email: user.email,
      phone: user.phone || '',
      avatar: user.avatar || '',
      role: user.role || 'user',
      status: user.is_active ? 'active' : 'blocked',
      reputation: user.reputation || 4.5,
      joinDate: user.created_at,
      lastLogin: user.last_login_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }));
    
    console.log(`[ADMIN] Retrieved ${formattedUsers.length} users successfully`);
    
    res.json({
      success: true,
      users: formattedUsers,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages
    });
  } catch (error) {
    console.error('[ADMIN] Error fetching users:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Toggle user block/unblock status
router.put('/users/:userId/toggle-block', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    console.log(`[ADMIN] PUT /api/admin/users/${userId}/toggle-block - reason: ${reason || 'none'}`);
    
    const updatedUser = await AdminService.toggleUserBlock(userId, reason);
    
    const formattedUser = {
      _id: updatedUser.id,
      name: updatedUser.name || updatedUser.email.split('@')[0],
      email: updatedUser.email,
      phone: updatedUser.phone || '',
      avatar: updatedUser.avatar || '',
      role: updatedUser.role || 'user',
      status: updatedUser.is_active ? 'active' : 'blocked',
      reputation: updatedUser.reputation || 4.5,
      joinDate: updatedUser.created_at,
      lastLogin: updatedUser.last_login_at,
      createdAt: updatedUser.created_at,
      updatedAt: updatedUser.updated_at
    };
    
    console.log(`[ADMIN] User ${userId} block status toggled successfully`);
    
    res.json({
      success: true,
      user: formattedUser,
      message: `User ${updatedUser.is_active ? 'unblocked' : 'blocked'} successfully`
    });
  } catch (error) {
    console.error('[ADMIN] Error toggling user block:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all properties with pagination
router.get('/properties', requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    console.log(`[ADMIN] GET /api/admin/properties - page: ${page}, limit: ${limit}`);
    
    const result = await AdminService.getAllProperties(page, limit);
    
    console.log(`[ADMIN] Retrieved ${result.properties.length} properties successfully`);
    
    res.json({
      success: true,
      properties: result.properties,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages
    });
  } catch (error) {
    console.error('[ADMIN] Error fetching properties:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update property status
router.put('/properties/:propertyId/status', requireAdmin, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { status, reason } = req.body;
    
    console.log(`[ADMIN] PUT /api/admin/properties/${propertyId}/status - status: ${status}`);
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    const updatedProperty = await AdminService.updatePropertyStatus(propertyId, status, reason);
    
    console.log(`[ADMIN] Property ${propertyId} status updated to ${status} successfully`);
    
    res.json({
      success: true,
      property: updatedProperty,
      message: `Property status updated to ${status} successfully`
    });
  } catch (error) {
    console.error('[ADMIN] Error updating property status:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete property
router.delete('/properties/:propertyId', requireAdmin, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { reason } = req.body;
    
    console.log(`[ADMIN] DELETE /api/admin/properties/${propertyId} - reason: ${reason || 'none'}`);
    
    const result = await AdminService.deleteProperty(propertyId, reason);
    
    console.log(`[ADMIN] Property ${propertyId} deleted successfully`);
    
    res.json({
      success: true,
      message: result.message,
      propertyId: result.propertyId
    });
  } catch (error) {
    console.error('[ADMIN] Error deleting property:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Restore property (undelete/unflag)
router.put('/properties/:propertyId/restore', requireAdmin, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { reason } = req.body;
    
    console.log(`[ADMIN] PUT /api/admin/properties/${propertyId}/restore`);
    
    const updatedProperty = await AdminService.updatePropertyStatus(propertyId, 'Active', reason);
    
    console.log(`[ADMIN] Property ${propertyId} restored successfully`);
    
    res.json({
      success: true,
      property: updatedProperty,
      message: 'Property restored successfully'
    });
  } catch (error) {
    console.error('[ADMIN] Error restoring property:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all complaints with pagination
router.get('/complaints', requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    console.log(`[ADMIN] GET /api/admin/complaints - page: ${page}, limit: ${limit}`);
    
    const result = await ComplaintService.getAll(page, limit);
    
    // Format complaints for frontend
    const formattedComplaints = result.complaints.map(complaint => ({
      _id: complaint.id,
      complainant: {
        _id: complaint.complainant_id,
        name: complaint.complainant_name || 'Unknown',
        email: complaint.complainant_email || 'Unknown'
      },
      target: {
        _id: complaint.target_id,
        name: complaint.target_name || complaint.property_title || 'Unknown',
        email: complaint.target_email || ''
      },
      targetType: complaint.target_type,
      type: complaint.type,
      description: complaint.description,
      evidence: complaint.evidence || [],
      status: complaint.status,
      resolution: complaint.resolution || '',
      adminNotes: complaint.admin_notes || '',
      createdAt: complaint.created_at,
      updatedAt: complaint.updated_at
    }));
    
    console.log(`[ADMIN] Retrieved ${formattedComplaints.length} complaints successfully`);
    
    res.json({
      success: true,
      complaints: formattedComplaints,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages
    });
  } catch (error) {
    console.error('[ADMIN] Error fetching complaints:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update complaint status
router.put('/complaints/:complaintId/status', requireAdmin, async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status, resolution, adminNotes } = req.body;
    
    console.log(`[ADMIN] PUT /api/admin/complaints/${complaintId}/status - status: ${status}`);
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    const updatedComplaint = await ComplaintService.updateStatus(
      complaintId, 
      status, 
      resolution || '', 
      adminNotes || ''
    );
    
    const formattedComplaint = {
      _id: updatedComplaint.id,
      complainant: {
        _id: updatedComplaint.complainant_id
      },
      target: {
        _id: updatedComplaint.target_id
      },
      targetType: updatedComplaint.target_type,
      type: updatedComplaint.type,
      description: updatedComplaint.description,
      evidence: updatedComplaint.evidence || [],
      status: updatedComplaint.status,
      resolution: updatedComplaint.resolution || '',
      adminNotes: updatedComplaint.admin_notes || '',
      createdAt: updatedComplaint.created_at,
      updatedAt: updatedComplaint.updated_at
    };
    
    console.log(`[ADMIN] Complaint ${complaintId} status updated to ${status} successfully`);
    
    res.json({
      success: true,
      complaint: formattedComplaint,
      message: `Complaint status updated to ${status} successfully`
    });
  } catch (error) {
    console.error('[ADMIN] Error updating complaint status:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

<<<<<<< HEAD
// Get fraud alerts and security issues
router.get('/fraud-alerts', requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    console.log(`[ADMIN] GET /api/admin/fraud-alerts - page: ${page}, limit: ${limit}`);
    
    // In a real implementation, this would query a fraud_alerts table
    // For now, we'll return mock data based on existing complaints and properties
    const db = getDB();
    
    // Get complaints that might be fraud-related
    const fraudComplaints = await db.query(`
      SELECT 
        c.id,
        c.type,
        c.description,
        c.status,
        c.created_at,
        c.target_type,
        c.target_id,
        u1.name as complainant_name,
        u1.email as complainant_email,
        u2.name as target_name,
        u2.email as target_email
      FROM complaints c
      JOIN users u1 ON c.complainant_id = u1.id
      JOIN users u2 ON c.target_id = u2.id
      WHERE c.type = 'Fraudulent Listing' AND c.status = 'open'
      ORDER BY c.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, (page - 1) * limit]);
    
    // Get properties with suspicious pricing (example: very low prices)
    const suspiciousProperties = await db.query(`
      SELECT 
        p.id,
        p.title,
        p.price,
        p.status,
        p.created_at,
        u.name as owner_name,
        u.email as owner_email
      FROM properties p
      JOIN users u ON p.owner_id = u.id
      WHERE p.price < 1000 AND p.status = 'Active'
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, (page - 1) * limit]);
    
    // Format the data as fraud alerts
    const alerts = [
      ...fraudComplaints.rows.map((complaint, index) => ({
        id: `fraud-${complaint.id}`,
        type: 'fraud_flag',
        severity: 'high',
        title: `Fraudulent Listing Complaint`,
        description: complaint.description,
        targetType: complaint.target_type,
        targetId: complaint.target_id,
        targetName: complaint.target_name,
        evidence: ['User complaint filed', 'Fraudulent listing type'],
        createdAt: complaint.created_at,
        status: 'pending',
        riskScore: 85
      })),
      ...suspiciousProperties.rows.map((property, index) => ({
        id: `suspicious-${property.id}`,
        type: 'fraud_flag',
        severity: 'medium',
        title: `Suspicious Property Pricing`,
        description: `Property "${property.title}" has unusually low price of $${property.price}`,
        targetType: 'property',
        targetId: property.id,
        targetName: property.title,
        evidence: [`Price $${property.price} is below market average`, 'New seller account'],
        createdAt: property.created_at,
        status: 'pending',
        riskScore: 70
      }))
    ];
    
    console.log(`[ADMIN] Retrieved ${alerts.length} fraud alerts successfully`);
    
    res.json({
      success: true,
      alerts: alerts,
      total: alerts.length,
      page: page,
      totalPages: Math.ceil(alerts.length / limit)
    });
  } catch (error) {
    console.error('[ADMIN] Error fetching fraud alerts:', error.message);
=======
// Resolve complaint with property action
router.put('/complaints/:complaintId/resolve-with-action', requireAdmin, async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { resolution, action, reason } = req.body;
    
    console.log(`[ADMIN] PUT /api/admin/complaints/${complaintId}/resolve-with-action - action: ${action}`);
    
    if (!resolution || !action) {
      return res.status(400).json({
        success: false,
        error: 'Resolution and action are required'
      });
    }

    const result = await ComplaintService.resolveComplaintWithAction(
      complaintId,
      req.user.id,
      resolution,
      action,
      reason || ''
    );
    
    console.log(`[ADMIN] Complaint ${complaintId} resolved with action: ${action}`);
    
    res.json({
      success: true,
      complaint: result.complaint,
      action: result.action,
      canAppeal: result.canAppeal,
      message: `Complaint resolved and property ${result.action} successfully`
    });
  } catch (error) {
    console.error('[ADMIN] Error resolving complaint with action:', error.message);
>>>>>>> 52e8353 (Saving my latest work before merging)
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

<<<<<<< HEAD
module.exports = router;
=======
// Get all appeals with pagination
router.get('/appeals', requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    console.log(`[ADMIN] GET /api/admin/appeals - page: ${page}, limit: ${limit}`);
    
    const result = await AppealService.getAllAppeals(page, limit);
    
    // Format appeals for frontend
    const formattedAppeals = result.appeals.map(appeal => ({
      _id: appeal.id,
      complaintId: appeal.complaint_id,
      propertyId: appeal.property_id,
      propertyTitle: appeal.property_title,
      propertyStatus: appeal.property_status,
      propertyOwner: {
        _id: appeal.property_owner_id,
        name: appeal.owner_name,
        email: appeal.owner_email
      },
      complainant: {
        _id: appeal.complainant_id,
        name: appeal.complainant_name,
        email: appeal.complainant_email
      },
      complaintType: appeal.complaint_type,
      complaintDescription: appeal.complaint_description,
      message: appeal.message,
      evidencePhotos: appeal.evidence_photos || [],
      status: appeal.status,
      adminResponse: appeal.admin_response || '',
      createdAt: appeal.created_at,
      updatedAt: appeal.updated_at,
      resolvedAt: appeal.resolved_at
    }));
    
    console.log(`[ADMIN] Retrieved ${formattedAppeals.length} appeals successfully`);
    
    res.json({
      success: true,
      appeals: formattedAppeals,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages
    });
  } catch (error) {
    console.error('[ADMIN] Error fetching appeals:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Resolve appeal
router.put('/appeals/:appealId/resolve', requireAdmin, async (req, res) => {
  try {
    const { appealId } = req.params;
    const { decision, adminResponse } = req.body;

    console.log(`[ADMIN] PUT /api/admin/appeals/${appealId}/resolve - decision: ${decision}`);

    if (!decision || !['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({
        success: false,
        error: 'Valid decision is required (approved or rejected)'
      });
    }

    const result = await AppealService.resolveAppeal(
      appealId,
      req.user.id,
      decision,
      adminResponse || ''
    );

    console.log(`[ADMIN] Appeal ${appealId} resolved with decision: ${decision}`);

    res.json({
      success: true,
      appeal: result.appeal,
      decision: result.decision,
      propertyAction: result.propertyAction,
      message: `Appeal ${decision} successfully`
    });
  } catch (error) {
    console.error('[ADMIN] Error resolving appeal:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
>>>>>>> 52e8353 (Saving my latest work before merging)
