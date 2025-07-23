const express = require('express');
const router = express.Router();
const PropertyService = require('../services/propertyService.js');
const { requireUser } = require('./middleware/auth.js');

// Get current user's property listings - MUST be before /:id route
router.get('/my-listings', requireUser, async (req, res) => {
  try {
    console.log(`[PROPERTY] GET /api/properties/my-listings - Fetching listings for user ${req.user.id}`);

    const properties = await PropertyService.getByOwner(req.user.id);

    console.log(`[PROPERTY] Retrieved ${properties.length} listings for user ${req.user.id}`);

    res.json({
      success: true,
      properties
    });
  } catch (error) {
    console.error('[PROPERTY] Error fetching user listings:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all properties with optional filters and search
router.get('/', async (req, res) => {
  try {
    console.log('[PROPERTY] GET /api/properties - Fetching properties');
    console.log('[PROPERTY] Query params:', JSON.stringify(req.query, null, 2));

    const filters = {
      search: req.query.search,
      location: req.query.location,
      propertyType: req.query.propertyType ? (Array.isArray(req.query.propertyType) ? req.query.propertyType : [req.query.propertyType]) : undefined,
      priceMin: req.query.priceMin ? parseFloat(req.query.priceMin) : undefined,
      priceMax: req.query.priceMax ? parseFloat(req.query.priceMax) : undefined,
      bedrooms: req.query.bedrooms ? parseInt(req.query.bedrooms) : undefined,
      bathrooms: req.query.bathrooms ? parseInt(req.query.bathrooms) : undefined,
      availability: req.query.availability,
      sortBy: req.query.sortBy || 'newest',
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 12
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === '') {
        delete filters[key];
      }
    });

    const result = await PropertyService.list(filters);

    console.log(`[PROPERTY] Retrieved ${result.properties.length} properties`);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[PROPERTY] Error fetching properties:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get single property by ID - MUST be after /my-listings route
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[PROPERTY] GET /api/properties/${id} - Fetching property`);

    const property = await PropertyService.get(id);

    if (!property) {
      console.log(`[PROPERTY] Property not found: ${id}`);
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    console.log(`[PROPERTY] Property retrieved: ${property.title}`);

    res.json({
      success: true,
      property
    });
  } catch (error) {
    console.error('[PROPERTY] Error fetching property:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new property listing
router.post('/', requireUser, async (req, res) => {
  try {
    console.log(`[PROPERTY] POST /api/properties - Creating property for user ${req.user.id}`);
    console.log('[PROPERTY] Property data:', JSON.stringify(req.body, null, 2));

    const property = await PropertyService.create(req.body, req.user.id);

    console.log(`[PROPERTY] Property created: ${property.title}`);

    res.status(201).json({
      success: true,
      property,
      message: 'Property listing created successfully and is pending verification'
    });
  } catch (error) {
    console.error('[PROPERTY] Error creating property:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;