const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reviewType: {
    type: String,
    required: true,
    enum: ['property', 'user'],
  },
  targetId: {
    type: String,
    required: true,
    index: true,
  },
  reviewerId: {
    type: String,
    required: true,
    index: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000,
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

// Compound index to prevent duplicate reviews from same user
reviewSchema.index({ reviewType: 1, targetId: 1, reviewerId: 1 }, { unique: true });

reviewSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;