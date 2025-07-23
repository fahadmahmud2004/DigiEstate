const express = require('express');
const router = express.Router();
const ComplaintService = require('../services/complaintService.js');
const { requireUser } = require('./middleware/auth.js');

// Create a new complaint
router.post('/', requireUser, async (req, res) => {
  try {
    const { target, targetType, type, description, evidence } = req.body;

    console.log(`[COMPLAINT] POST /api/complaints - Creating complaint from user ${req.user.id}`);

    if (!target || !targetType || !type || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: target, targetType, type, description'
      });
    }

    const complaintData = {
      complainant: req.user.id.toString(),
      target,
      targetType,
      type,
      description,
      evidence: evidence || []
    };

    const complaint = await ComplaintService.create(complaintData);

    console.log(`[COMPLAINT] Complaint created successfully with ID: ${complaint.id}`);

    res.status(201).json({
      success: true,
      complaint: {
        _id: complaint.id,
        complainant: {
          _id: complaint.complainant
        },
        target: {
          _id: complaint.target
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
      },
      message: 'Complaint submitted successfully'
    });
  } catch (error) {
    console.error('[COMPLAINT] Error creating complaint:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user's own complaints
router.get('/my-complaints', requireUser, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    console.log(`[COMPLAINT] GET /api/complaints/my-complaints - user: ${req.user.id}`);

    const result = await ComplaintService.getAll(page, limit);
    
    // Filter complaints by current user
    const userComplaints = result.complaints.filter(
      complaint => complaint.complainant === req.user.id.toString()
    );

    const formattedComplaints = userComplaints.map(complaint => ({
      _id: complaint.id,
      complainant: {
        _id: complaint.complainant,
        name: complaint.complainant_name || 'You',
        email: complaint.complainant_email || ''
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

    console.log(`[COMPLAINT] Retrieved ${formattedComplaints.length} complaints for user ${req.user.id}`);

    res.json({
      success: true,
      complaints: formattedComplaints,
      total: formattedComplaints.length,
      page,
      totalPages: Math.ceil(formattedComplaints.length / limit)
    });
  } catch (error) {
    console.error('[COMPLAINT] Error fetching user complaints:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;