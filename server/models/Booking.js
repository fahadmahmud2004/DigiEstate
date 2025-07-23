const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const bookingSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => randomUUID(),
  },
  property: {
    type: String,
    required: true,
    ref: 'Property'
  },
  buyer: {
    type: String,
    required: true,
    ref: 'User'
  },
  seller: {
    type: String,
    required: true,
    ref: 'User'
  },
  preferredDate: {
    type: String,
    required: true,
  },
  preferredTime: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Accepted', 'Declined', 'Completed', 'Cancelled'],
    default: 'Pending',
  },
  declineReason: {
    type: String,
  },
  referenceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  payment: {
    amount: {
      type: Number,
    },
    method: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'Mobile Payment', 'Check'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed'],
      default: 'Pending',
    },
    transactionId: {
      type: String,
    },
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

bookingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;