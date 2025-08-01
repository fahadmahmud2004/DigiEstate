const express = require('express');
const router = express.Router();
const AppealService = require('../services/appealService.js');
const ComplaintService = require('../services/complaintService.js');
const PropertyService = require('../services/propertyService.js');
const { requireUser } = require('./middleware/auth.js');
const { requireAdmin } = require('./middleware/adminAuth.js');

// Create a new appeal
router.post('/', requireUser, async (req, res) => {
  try {
    const { complaint_id, property_id, message, evidence_photos } = req.body;
    const { id: userId } = req.user;

    console.log(`[APPEAL] POST /api/appeals - Creating appeal for complaint: ${complaint_id}`);
    console.log(`[APPEAL] Request body:`, req.body);
    console.log(`[APPEAL] User ID: ${userId}`);

    // Get the complaint to verify it exists and get complainant_id
    const complaint = await ComplaintService.get(complaint_id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    // Get the property to verify it exists and get owner_id
    const property = await PropertyService.get(property_id);
    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }
    
    console.log(`[APPEAL] Property found:`, {
      id: property._id,
      title: property.title,
      owner_id: property.owner._id,
      owner_name: property.owner.name
    });

    // Verify that the current user is the property owner
    if (property.owner._id !== userId) {
      console.log(`[APPEAL] Ownership check failed: property.owner._id (${property.owner._id}) !== userId (${userId})`);
      return res.status(403).json({
        success: false,
        error: 'Only the property owner can appeal a complaint'
      });
    }

    const appealData = {
      complaint_id,
      property_id,
      property_owner_id: userId,
      complainant_id: complaint.complainant_id,
      message,
      evidence_photos: evidence_photos || []
    };

    console.log(`[APPEAL] Creating appeal with data:`, appealData);

    const newAppeal = await AppealService.create(appealData, userId);

    console.log(`[APPEAL] Appeal created successfully: ${newAppeal.id}`);

    // Format the appeal for frontend
    const formattedAppeal = {
      _id: newAppeal.id,
      complaint_id: newAppeal.complaint_id,
      property_id: newAppeal.property_id,
      property_owner_id: newAppeal.property_owner_id,
      complainant_id: newAppeal.complainant_id,
      message: newAppeal.message,
      evidence_photos: newAppeal.evidence_photos || [],
      status: newAppeal.status,
      admin_response: newAppeal.admin_response || '',
      created_at: newAppeal.created_at,
      updated_at: newAppeal.updated_at,
      resolved_at: newAppeal.resolved_at
    };

    res.status(201).json({
      success: true,
      message: 'Appeal submitted successfully',
      appeal: formattedAppeal
    });
  } catch (error) {
    console.error('[APPEAL] Error creating appeal:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to create appeal'
    });
  }
});

// Get appeals for property owner
router.get('/owner', requireUser, async (req, res) => {
  try {
    const { id: userId } = req.user;

    console.log(`[APPEAL] GET /api/appeals/owner - Fetching appeals for user: ${userId}`);
    console.log(`[APPEAL] User ID type: ${typeof userId}`);
    console.log(`[APPEAL] User object:`, req.user);

    const appeals = await AppealService.getByOwner(userId);

    console.log(`[APPEAL] Raw appeals data:`, appeals);

    // Format appeals for frontend
    const formattedAppeals = appeals.map(appeal => ({
      _id: appeal.id,
      complaint_id: appeal.complaint_id,
      property_id: appeal.property_id,
      property_owner_id: appeal.property_owner_id,
      complainant_id: appeal.complainant_id,
      message: appeal.message,
      evidence_photos: appeal.evidence_photos || [],
      status: appeal.status,
      admin_response: appeal.admin_response || '',
      created_at: appeal.created_at,
      updated_at: appeal.updated_at,
      resolved_at: appeal.resolved_at,
      // Additional fields from joins
      complaint_description: appeal.complaint_description || '',
      complaint_type: appeal.complaint_type || '',
      complaint_status: appeal.complaint_status || '',
      property_title: appeal.property_title || 'Unknown Property',
      complainant_name: appeal.complainant_name || 'Unknown',
      owner_name: appeal.owner_name || 'Unknown'
    }));

    console.log(`[APPEAL] Retrieved ${formattedAppeals.length} appeals for user ${userId}`);

    res.json({
      success: true,
      appeals: formattedAppeals
    });
  } catch (error) {
    console.error('[APPEAL] Error fetching owner appeals:', error.message);
    console.error('[APPEAL] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appeals'
    });
  }
});

// Get all appeals for admin
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    console.log(`[APPEAL] GET /api/appeals/admin - Fetching appeals for admin, page: ${page}, limit: ${limit}`);

    const result = await AppealService.getAll(parseInt(page), parseInt(limit));

    res.json({
      success: true,
      appeals: result.appeals,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages
    });
  } catch (error) {
    console.error('[APPEAL] Error fetching admin appeals:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appeals'
    });
  }
});

// Update appeal status (admin only)
router.put('/admin/:appealId/status', requireAdmin, async (req, res) => {
  try {
    const { appealId } = req.params;
    const { status, admin_response } = req.body;

    console.log(`[APPEAL] PUT /api/appeals/admin/${appealId}/status - Updating appeal status to: ${status}`);

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Valid status is required (pending, approved, rejected)'
      });
    }

    const updatedAppeal = await AppealService.updateStatus(appealId, status, admin_response);

    console.log(`[APPEAL] Appeal status updated successfully: ${appealId}`);

    res.json({
      success: true,
      message: 'Appeal status updated successfully',
      appeal: updatedAppeal
    });
  } catch (error) {
    console.error('[APPEAL] Error updating appeal status:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to update appeal status'
    });
  }
});

// Get specific appeal details
router.get('/admin/:appealId', requireAdmin, async (req, res) => {
  try {
    const { appealId } = req.params;

    console.log(`[APPEAL] GET /api/appeals/admin/${appealId} - Fetching appeal details`);

    const appeal = await AppealService.getById(appealId);

    res.json({
      success: true,
      appeal
    });
  } catch (error) {
    console.error('[APPEAL] Error fetching appeal details:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appeal details'
    });
  }
});

module.exports = router; 