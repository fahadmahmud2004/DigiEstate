const express = require('express');
const router = express.Router();
const AppealService = require('../services/appealService.js');
const { requireUser } = require('./middleware/auth.js');
const { requireAdmin } = require('./middleware/adminAuth.js');

// Create an appeal (property owner defending against complaint)
router.post('/', requireUser, async (req, res) => {
  try {
    const { complaintId, propertyId, message, evidencePhotos } = req.body;

    console.log(`[APPEAL] POST /api/appeals - Creating appeal from user ${req.user.id}`);

    if (!complaintId || !propertyId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: complaintId, propertyId, message'
      });
    }

    // Get complaint details to verify ownership and get complainant
    const ComplaintService = require('../services/complaintService.js');
    const complaint = await ComplaintService.get(complaintId);
    
    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    // Verify user owns the property
    if (complaint.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You can only appeal complaints against your own properties'
      });
    }

    const appealData = {
      complaintId,
      propertyId,
      propertyOwnerId: req.user.id,
      complainantId: complaint.complainant_id,
      message,
      evidencePhotos: evidencePhotos || []
    };

    const result = await AppealService.createAppeal(appealData);

    console.log(`[APPEAL] Appeal created successfully`);

    res.status(201).json({
      success: true,
      appeal: result.appeal,
      message: 'Appeal submitted successfully. Admin will review your case.'
    });
  } catch (error) {
    console.error('[APPEAL] Error creating appeal:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user's own appeals
router.get('/my-appeals', requireUser, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    console.log(`[APPEAL] GET /api/appeals/my-appeals - user: ${req.user.id}`);

    const result = await AppealService.getAllAppeals(page, limit);
    
    // Filter appeals by current user (property owner)
    const userAppeals = result.appeals.filter(
      appeal => appeal.property_owner_id === req.user.id
    );

    const formattedAppeals = userAppeals.map(appeal => ({
      _id: appeal.id,
      complaintId: appeal.complaint_id,
      propertyId: appeal.property_id,
      propertyTitle: appeal.property_title,
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

    console.log(`[APPEAL] Retrieved ${formattedAppeals.length} appeals for user ${req.user.id}`);

    res.json({
      success: true,
      appeals: formattedAppeals,
      total: formattedAppeals.length,
      page,
      totalPages: Math.ceil(formattedAppeals.length / limit)
    });
  } catch (error) {
    console.error('[APPEAL] Error fetching user appeals:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Admin: Get all appeals
router.get('/', requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    console.log(`[APPEAL] GET /api/appeals - Fetching all appeals for admin`);

    const result = await AppealService.getAllAppeals(page, limit);

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

    console.log(`[APPEAL] Retrieved ${formattedAppeals.length} appeals for admin`);

    res.json({
      success: true,
      appeals: formattedAppeals,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages
    });
  } catch (error) {
    console.error('[APPEAL] Error fetching appeals for admin:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Admin: Resolve appeal
router.put('/:appealId/resolve', requireAdmin, async (req, res) => {
  try {
    const { appealId } = req.params;
    const { decision, adminResponse } = req.body;

    console.log(`[APPEAL] PUT /api/appeals/${appealId}/resolve - decision: ${decision}`);

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

    console.log(`[APPEAL] Appeal ${appealId} resolved with decision: ${decision}`);

    res.json({
      success: true,
      appeal: result.appeal,
      decision: result.decision,
      propertyAction: result.propertyAction,
      message: `Appeal ${decision} successfully`
    });
  } catch (error) {
    console.error('[APPEAL] Error resolving appeal:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get specific appeal details
router.get('/:appealId', requireUser, async (req, res) => {
  try {
    const { appealId } = req.params;

    console.log(`[APPEAL] GET /api/appeals/${appealId}`);

    const appeal = await AppealService.getAppeal(appealId);

    if (!appeal) {
      return res.status(404).json({
        success: false,
        error: 'Appeal not found'
      });
    }

    // Check if user has access to this appeal
    const isOwner = appeal.property_owner_id === req.user.id;
    const isComplainant = appeal.complainant_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isComplainant && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const formattedAppeal = {
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
    };

    res.json({
      success: true,
      appeal: formattedAppeal
    });
  } catch (error) {
    console.error('[APPEAL] Error fetching appeal:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
