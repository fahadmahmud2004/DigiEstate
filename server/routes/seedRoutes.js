const express = require('express');
const router = express.Router();
const UserService = require('../services/userService');
const PropertyService = require('../services/propertyService');

// Seed admin user
router.post('/admin', async (req, res) => {
  try {
    console.log('Starting admin user seeding...');
    
    // Check if admin already exists
    const existingAdmin = await UserService.getByEmail('admin@example.com');
    if (existingAdmin) {
      console.log('Admin user already exists');
      return res.status(200).json({
        success: true,
        message: 'Admin user already exists',
        data: {
          email: existingAdmin.email,
          role: existingAdmin.role
        }
      });
    }

    // Create admin user
    const adminUser = await UserService.create({
      email: 'admin@example.com',
      password: 'admin123',
      name: 'System Administrator',
      role: 'admin'
    });

    console.log('Admin user created successfully');
    
    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      }
    });
  } catch (error) {
    console.error('Error seeding admin user:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Seed sample properties
router.post('/properties', async (req, res) => {
  try {
    console.log('Starting property seeding...');
    
    // Create a sample user to be the owner of properties
    let sampleOwner = await UserService.getByEmail('owner@example.com');
    if (!sampleOwner) {
      sampleOwner = await UserService.create({
        email: 'owner@example.com',
        password: 'owner123',
        name: 'Property Owner',
        role: 'user'
      });
      console.log('Sample property owner created');
    }

    const sampleProperties = [
      {
        title: 'Modern 3BHK Apartment in Downtown',
        description: 'Beautiful spacious apartment with modern amenities, perfect for families. Located in the heart of the city with easy access to shopping centers, schools, and hospitals.',
        type: 'Flat',
        price: 850000,
        location: 'Downtown, City Center',
        availability: 'Available',
        images: [
          'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop'
        ],
        videos: [],
        features: {
          bedrooms: 3,
          bathrooms: 2,
          floorNumber: 5,
          totalFloors: 12,
          area: 1200,
          hasAC: true,
          hasLift: true,
          hasParking: true,
          customFeatures: ['Balcony', 'Modular Kitchen', 'Gym Access']
        },
        nearbyFacilities: [
          { name: 'Metro Station', distance: 0.5 },
          { name: 'Shopping Mall', distance: 1.2 },
          { name: 'Hospital', distance: 0.8 },
          { name: 'School', distance: 0.3 }
        ],
        owner: sampleOwner.id,
        status: 'Active',
        views: 245,
        inquiries: 12,
        bookings: 3
      },
      {
        title: 'Luxury Office Space in Business District',
        description: 'Premium office space with panoramic city views, perfect for growing businesses. Fully furnished with modern facilities and 24/7 security.',
        type: 'Office Apartment',
        price: 1200000,
        location: 'Business District, Financial Center',
        availability: 'Available',
        images: [
          'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop'
        ],
        videos: [],
        features: {
          floorNumber: 15,
          area: 2500,
          parkingSpaces: 10,
          isFurnished: true,
          hasAC: true,
          hasLift: true,
          hasParking: true,
          customFeatures: ['Conference Room', 'Reception Area', 'Cafeteria']
        },
        nearbyFacilities: [
          { name: 'Bank', distance: 0.2 },
          { name: 'Restaurant', distance: 0.1 },
          { name: 'Metro Station', distance: 0.4 }
        ],
        owner: sampleOwner.id,
        status: 'Active',
        views: 189,
        inquiries: 8,
        bookings: 2
      },
      {
        title: 'Prime Commercial Land for Development',
        description: 'Excellent opportunity for commercial development. Located on main road with high visibility and easy access.',
        type: 'Land',
        price: 2500000,
        location: 'Highway Junction, Commercial Zone',
        availability: 'Available',
        images: [
          'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop'
        ],
        videos: [],
        features: {
          area: 5000,
          roadWidth: 60,
          isCornerPlot: true,
          hasAC: false,
          hasLift: false,
          hasParking: false,
          customFeatures: ['Corner Plot', 'Main Road Facing', 'Commercial Zone']
        },
        nearbyFacilities: [
          { name: 'Highway', distance: 0.1 },
          { name: 'Gas Station', distance: 0.3 },
          { name: 'Shopping Center', distance: 0.8 }
        ],
        owner: sampleOwner.id,
        status: 'Active',
        views: 156,
        inquiries: 15,
        bookings: 1
      },
      {
        title: 'Cozy 2BHK Flat with Garden View',
        description: 'Peaceful apartment with beautiful garden views. Perfect for small families or couples looking for a quiet neighborhood.',
        type: 'Flat',
        price: 650000,
        location: 'Green Valley, Residential Area',
        availability: 'Available',
        images: [
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop'
        ],
        videos: [],
        features: {
          bedrooms: 2,
          bathrooms: 1,
          floorNumber: 2,
          totalFloors: 4,
          area: 900,
          hasAC: false,
          hasLift: false,
          hasParking: true,
          customFeatures: ['Garden View', 'Quiet Neighborhood']
        },
        nearbyFacilities: [
          { name: 'Park', distance: 0.2 },
          { name: 'Grocery Store', distance: 0.5 },
          { name: 'Bus Stop', distance: 0.3 }
        ],
        owner: sampleOwner.id,
        status: 'Active',
        views: 98,
        inquiries: 5,
        bookings: 1
      },
      {
        title: 'Spacious Warehouse for Rent',
        description: 'Large warehouse space suitable for storage and distribution. Easy truck access and loading facilities.',
        type: 'Godown',
        price: 450000,
        location: 'Industrial Area, Warehouse District',
        availability: 'Available',
        images: [
          'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop'
        ],
        videos: [],
        features: {
          area: 8000,
          hasAC: false,
          hasLift: false,
          hasParking: true,
          customFeatures: ['Loading Dock', 'High Ceiling', 'Security System']
        },
        nearbyFacilities: [
          { name: 'Highway Access', distance: 0.5 },
          { name: 'Truck Stop', distance: 1.0 },
          { name: 'Industrial Gate', distance: 0.2 }
        ],
        owner: sampleOwner.id,
        status: 'Active',
        views: 67,
        inquiries: 3,
        bookings: 0
      }
    ];

    const createdProperties = [];
    
    for (const propertyData of sampleProperties) {
      const property = await PropertyService.create(propertyData);
      createdProperties.push(property);
    }

    console.log(`Successfully seeded ${createdProperties.length} properties`);
    
    res.status(201).json({
      success: true,
      message: `Successfully seeded ${createdProperties.length} sample properties`,
      data: {
        count: createdProperties.length,
        properties: createdProperties.map(p => ({
          id: p._id,
          title: p.title,
          type: p.type,
          price: p.price,
          location: p.location
        }))
      }
    });
  } catch (error) {
    console.error('Error seeding properties:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;