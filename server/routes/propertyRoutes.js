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
    const propertyData = {
      ...req.body,
      images: req.files ? req.files.map(file => file.path) : []
    };

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

module.exports = router;
