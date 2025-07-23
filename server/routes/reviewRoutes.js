const express = require('express');
const router = express.Router();
const ReviewService = require('../services/reviewService.js');
const { requireUser } = require('./middleware/auth.js');

// Get reviews for a specific user
router.get('/users/:userId/reviews', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`[REVIEW] GET /api/reviews/users/${userId}/reviews - Fetching user reviews`);

    const reviews = await ReviewService.getByTargetId(userId, 'user');

    console.log(`[REVIEW] Retrieved ${reviews.length} reviews for user ${userId}`);

    // Calculate average rating
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;

    res.json({
      success: true,
      data: {
        reviews,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length
      }
    });
  } catch (error) {
    console.error('[REVIEW] Error fetching user reviews:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get reviews for a specific property
router.get('/properties/:propertyId/reviews', async (req, res) => {
  try {
    const { propertyId } = req.params;
    console.log(`[REVIEW] GET /api/reviews/properties/${propertyId}/reviews - Fetching property reviews`);

    const reviews = await ReviewService.getByTargetId(propertyId, 'property');

    console.log(`[REVIEW] Retrieved ${reviews.length} reviews for property ${propertyId}`);

    // Calculate average rating
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;

    res.json({
      success: true,
      data: {
        reviews,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length
      }
    });
  } catch (error) {
    console.error('[REVIEW] Error fetching property reviews:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a new review for a user
router.post('/users/:userId', requireUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const { rating, comment } = req.body;
    console.log(`[REVIEW] POST /api/reviews/users/${userId} - Creating user review`);

    const reviewData = {
      reviewerId: req.user.id,
      targetId: userId,
      targetType: 'user',
      rating,
      comment
    };

    const review = await ReviewService.create(reviewData);

    console.log(`[REVIEW] User review created successfully with ID: ${review.id}`);

    res.status(201).json({
      success: true,
      review,
      message: 'Review created successfully'
    });
  } catch (error) {
    console.error('[REVIEW] Error creating user review:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a new review for a property
router.post('/properties/:propertyId', requireUser, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { rating, comment } = req.body;
    console.log(`[REVIEW] POST /api/reviews/properties/${propertyId} - Creating property review`);

    const reviewData = {
      reviewerId: req.user.id,
      targetId: propertyId,
      targetType: 'property',
      rating,
      comment
    };

    const review = await ReviewService.create(reviewData);

    console.log(`[REVIEW] Property review created successfully with ID: ${review.id}`);

    res.status(201).json({
      success: true,
      review,
      message: 'Review created successfully'
    });
  } catch (error) {
    console.error('[REVIEW] Error creating property review:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update a review
router.put('/:reviewId', requireUser, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    console.log(`[REVIEW] PUT /api/reviews/${reviewId} - Updating review`);

    const updateData = { rating, comment };
    const review = await ReviewService.update(reviewId, updateData, req.user.id);

    console.log(`[REVIEW] Review updated successfully: ${reviewId}`);

    res.json({
      success: true,
      review,
      message: 'Review updated successfully'
    });
  } catch (error) {
    console.error('[REVIEW] Error updating review:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete a review
router.delete('/:reviewId', requireUser, async (req, res) => {
  try {
    const { reviewId } = req.params;
    console.log(`[REVIEW] DELETE /api/reviews/${reviewId} - Deleting review`);

    await ReviewService.delete(reviewId, req.user.id);

    console.log(`[REVIEW] Review deleted successfully: ${reviewId}`);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('[REVIEW] Error deleting review:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;