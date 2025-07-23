const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  complainant: {
    type: String,
    required: true,
  },
  target: {
    type: String,
    required: true,
  },
  targetType: {
    type: String,
    required: true,
    enum: ['user', 'property'],
  },
  type: {
    type: String,
    required: true,
    enum: ['Fraudulent Listing', 'Inappropriate Behavior', 'Payment Issues', 'Other'],
  },
  description: {
    type: String,
    required: true,
  },
  evidence: [{
    type: String,
  }],
  status: {
    type: String,
    required: true,
    enum: ['open', 'in-progress', 'resolved', 'dismissed'],
    default: 'open',
  },
  resolution: {
    type: String,
    default: '',
  },
  adminNotes: {
    type: String,
    default: '',
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

complaintSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;