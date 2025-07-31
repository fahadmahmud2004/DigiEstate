const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PropertyService = require('../services/propertyService.js');
const { requireUser } = require('./middleware/auth.js');

// --- Multer Configuration ---
// Ensure the 'uploads' directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });


// Create a new property
router.post('/', requireUser, upload.array('images', 10), async (req, res) => {
  try {
    console.log('[PROPERTY ROUTE] Received POST request to create property.');
    console.log('--- Request Body (Text Fields) ---');
    console.log(req.body);
    console.log('--- Request Files (Images) ---');
    console.log(req.files);
    console.log('-----------------------------------');

    const propertyData = {
      ...req.body,
      images: req.files ? req.files.map(file => file.path) : []
    };

    console.log('[PROPERTY ROUTE] Processed propertyData:', propertyData);

    const newProperty = await PropertyService.create(propertyData, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: newProperty
    });
  } catch (error) {
    console.error('[PROPERTY ROUTE] Error creating property:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create property'
    });
  }
});

// Get current user's property listings
router.get('/my-listings', requireUser, async (req, res) => {
  try {
    const properties = await PropertyService.getByOwner(req.user.id);
    res.json({ success: true, properties });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all properties
router.get('/', async (req, res) => {
  try {
    const result = await PropertyService.list(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single property by ID
router.get('/:id', async (req, res) => {
  try {
    const property = await PropertyService.get(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }
    res.json({ success: true, property });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update property by ID
router.put('/:id', requireUser, upload.array('images', 10), async (req, res) => {
  try {
    console.log(`[PROPERTY ROUTE] Received PUT request to update property ${req.params.id} by user ${req.user.id}`);
    console.log('--- Request Body (Text Fields) ---');
    console.log(req.body);
    console.log('--- Request Files (New Images) ---');
    console.log(req.files);
    console.log('-----------------------------------');

    const propertyData = {
      ...req.body,
      images: req.files ? req.files.map(file => file.path) : []
    };

    console.log('[PROPERTY ROUTE] Processed propertyData for update:', propertyData);

    const updatedProperty = await PropertyService.update(req.params.id, propertyData, req.user.id);

    res.json({
      success: true,
      message: 'Property updated successfully',
      property: updatedProperty
    });
  } catch (error) {
    console.error('[PROPERTY ROUTE] Error updating property:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update property'
    });
  }
});

// Delete property by ID
router.delete('/:id', requireUser, async (req, res) => {
  try {
    console.log(`[PROPERTY ROUTE] Received DELETE request for property ${req.params.id} by user ${req.user.id}`);
    
    // Check if user is admin
    const isAdminDeletion = req.user.role === 'admin';
    
    // For user deletions, ensure they own the property
    // For admin deletions, allow deletion of any property
    const result = await PropertyService.delete(req.params.id, req.user.id, isAdminDeletion);
    
    res.json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('[PROPERTY ROUTE] Error deleting property:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete property'
    });
  }
});

module.exports = router;
