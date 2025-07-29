const express = require('express');
const router = express.Router();
const AdminService = require('../services/adminService.js');
const ComplaintService = require('../services/complaintService.js');
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
    const formattedProperty = AdminService.formatProperty(updatedProperty);
    
    console.log(`[ADMIN] Property ${propertyId} status updated to ${status} successfully`);
    
    res.json({
      success: true,
      property: formattedProperty,
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

// Test delete property without triggers
router.delete('/properties/:propertyId/test', requireAdmin, async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    console.log(`[ADMIN] TEST DELETE /api/admin/properties/${propertyId}/test`);
    
    const db = getDB();
    
    // First get the property
    const propertyResult = await db.query(
      'SELECT * FROM properties WHERE id = $1',
      [propertyId]
    );
    
    if (propertyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }
    
    const property = propertyResult.rows[0];
    console.log(`[ADMIN] Found property: ${property.title}`);
    
    // Temporarily disable triggers for testing
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
    
    console.log(`[ADMIN] Property ${propertyId} deleted successfully (test)`);
    
    res.json({
      success: true,
      message: `Property "${property.title}" has been deleted successfully (test)`,
      propertyId: result.propertyId
    });
  } catch (error) {
    console.error('[ADMIN] Error deleting property (test):', error.message);
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
        _id: complaint.complainant,
        name: complaint.complainant_name || 'Unknown',
        email: complaint.complainant_email || 'Unknown'
      },
      target: {
        _id: complaint.target,
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
        _id: updatedComplaint.complainant
      },
      target: {
        _id: updatedComplaint.target
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

module.exports = router;