const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['Flat', 'Office Apartment', 'Land', 'Garage', 'Godown', 'Plot'],
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  location: {
    type: String,
    required: true,
  },
  availability: {
    type: String,
    required: true,
    enum: ['Available', 'Occupied', 'Under Maintenance'],
    default: 'Available',
  },
  images: [{
    type: String,
  }],
  videos: [{
    type: String,
  }],
  features: {
    bedrooms: {
      type: Number,
      min: 0,
    },
    bathrooms: {
      type: Number,
      min: 0,
    },
    floorNumber: {
      type: Number,
      min: 0,
    },
    totalFloors: {
      type: Number,
      min: 1,
    },
    area: {
      type: Number,
      min: 0,
    },
    roadWidth: {
      type: Number,
      min: 0,
    },
    isCornerPlot: {
      type: Boolean,
      default: false,
    },
    parkingSpaces: {
      type: Number,
      min: 0,
    },
    isFurnished: {
      type: Boolean,
      default: false,
    },
    hasAC: {
      type: Boolean,
      default: false,
    },
    hasLift: {
      type: Boolean,
      default: false,
    },
    hasParking: {
      type: Boolean,
      default: false,
    },
    customFeatures: [{
      type: String,
    }],
  },
  nearbyFacilities: [{
    name: {
      type: String,
      required: true,
    },
    distance: {
      type: Number,
      required: true,
      min: 0,
    },
  }],
  owner: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending Verification', 'Active', 'Flagged'],
    default: 'Pending Verification',
  },
  views: {
    type: Number,
    default: 0,
    min: 0,
  },
  inquiries: {
    type: Number,
    default: 0,
    min: 0,
  },
  bookings: {
    type: Number,
    default: 0,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  versionKey: false,
});

propertySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;