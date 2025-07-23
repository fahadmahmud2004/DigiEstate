const { getDB } = require('../config/database.js');

class ReviewService {
  static async createReview(reviewData) {
    try {
      console.log(`[ReviewService] Creating review for ${reviewData.reviewType} with ID: ${reviewData.targetId}`);
      console.log(`[ReviewService] Review data:`, JSON.stringify(reviewData, null, 2));

      const db = getDB();

      // Check if user already reviewed this target
      const existingReviewResult = await db.query(
        'SELECT id FROM reviews WHERE review_type = $1 AND target_id = $2 AND reviewer_id = $3',
        [reviewData.reviewType, reviewData.targetId, reviewData.reviewerId]
      );

      if (existingReviewResult.rows.length > 0) {
        console.log(`[ReviewService] Existing review found`);
        throw new Error('You have already reviewed this item');
      }

      // Get reviewer information
      console.log(`[ReviewService] Fetching reviewer info for user ID: ${reviewData.reviewerId}`);
      const reviewerResult = await db.query(
        'SELECT id, name, email, avatar FROM users WHERE id = $1',
        [reviewData.reviewerId]
      );

      if (reviewerResult.rows.length === 0) {
        console.log(`[ReviewService] Reviewer not found for ID: ${reviewData.reviewerId}`);
        throw new Error('Reviewer not found');
      }

      const reviewer = reviewerResult.rows[0];
      console.log(`[ReviewService] Reviewer found:`, JSON.stringify(reviewer, null, 2));

      // Insert new review
      const insertResult = await db.query(`
        INSERT INTO reviews (review_type, target_id, reviewer_id, rating, comment)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        reviewData.reviewType,
        reviewData.targetId,
        reviewData.reviewerId,
        reviewData.rating,
        reviewData.comment
      ]);

      const newReview = insertResult.rows[0];
      console.log(`[ReviewService] Review created in database:`, JSON.stringify(newReview, null, 2));

      // Format response with reviewer info
      const formattedReview = {
        _id: newReview.id,
        reviewType: newReview.review_type,
        targetId: newReview.target_id,
        reviewerId: newReview.reviewer_id,
        rating: newReview.rating,
        comment: newReview.comment,
        reviewer: {
          _id: reviewer.id,
          name: reviewer.name || reviewer.email.split('@')[0],
          email: reviewer.email,
          avatar: reviewer.avatar || null
        },
        createdAt: newReview.created_at,
        updatedAt: newReview.updated_at
      };

      console.log(`[ReviewService] Formatted review response:`, JSON.stringify(formattedReview, null, 2));
      return formattedReview;
    } catch (err) {
      console.error(`[ReviewService] Error creating review: ${err.message}`);
      console.error(`[ReviewService] Error stack:`, err.stack);
      throw new Error(`Database error while creating review: ${err.message}`);
    }
  }

  static async getReviewsByTarget(reviewType, targetId) {
    try {
      console.log(`[ReviewService] Fetching reviews for ${reviewType} with ID: ${targetId}`);
      const db = getDB();

      const result = await db.query(`
        SELECT r.*, u.name, u.email, u.avatar
        FROM reviews r
        JOIN users u ON r.reviewer_id = u.id
        WHERE r.review_type = $1 AND r.target_id = $2
        ORDER BY r.created_at DESC
      `, [reviewType, targetId]);

      console.log(`[ReviewService] Found ${result.rows.length} reviews`);

      const reviews = result.rows.map(row => ({
        _id: row.id,
        reviewType: row.review_type,
        targetId: row.target_id,
        reviewerId: row.reviewer_id,
        rating: row.rating,
        comment: row.comment,
        reviewer: {
          _id: row.reviewer_id,
          name: row.name || row.email.split('@')[0],
          email: row.email,
          avatar: row.avatar || null
        },
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      // Calculate average rating
      const averageRating = reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

      const response = {
        reviews,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length
      };

      console.log(`[ReviewService] Final result:`, JSON.stringify(response, null, 2));
      return response;
    } catch (err) {
      console.error(`[ReviewService] Error fetching reviews: ${err.message}`);
      console.error(`[ReviewService] Error stack:`, err.stack);
      throw new Error(`Database error while fetching reviews: ${err.message}`);
    }
  }

  static async updateReview(reviewId, updateData, userId) {
    try {
      console.log(`[ReviewService] Updating review with ID: ${reviewId}`);
      console.log(`[ReviewService] Update data:`, JSON.stringify(updateData, null, 2));
      console.log(`[ReviewService] User ID: ${userId}`);

      const db = getDB();

      // Check if review exists and user owns it
      const existingResult = await db.query(
        'SELECT * FROM reviews WHERE id = $1',
        [reviewId]
      );

      if (existingResult.rows.length === 0) {
        console.log(`[ReviewService] Review not found with ID: ${reviewId}`);
        throw new Error('Review not found');
      }

      const existingReview = existingResult.rows[0];
      console.log(`[ReviewService] Found review:`, JSON.stringify(existingReview, null, 2));

      if (existingReview.reviewer_id !== userId) {
        console.log(`[ReviewService] Permission denied. Review owner: ${existingReview.reviewer_id}, Current user: ${userId}`);
        throw new Error('You can only update your own reviews');
      }

      // Update the review
      const updateResult = await db.query(`
        UPDATE reviews 
        SET rating = $1, comment = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `, [updateData.rating, updateData.comment, reviewId]);

      const updatedReview = updateResult.rows[0];

      // Get reviewer info for response
      const reviewerResult = await db.query(
        'SELECT id, name, email, avatar FROM users WHERE id = $1',
        [updatedReview.reviewer_id]
      );

      const reviewer = reviewerResult.rows[0];

      const formattedReview = {
        _id: updatedReview.id,
        reviewType: updatedReview.review_type,
        targetId: updatedReview.target_id,
        reviewerId: updatedReview.reviewer_id,
        rating: updatedReview.rating,
        comment: updatedReview.comment,
        reviewer: {
          _id: reviewer.id,
          name: reviewer.name || reviewer.email.split('@')[0],
          email: reviewer.email,
          avatar: reviewer.avatar || null
        },
        createdAt: updatedReview.created_at,
        updatedAt: updatedReview.updated_at
      };

      console.log(`[ReviewService] Review updated:`, JSON.stringify(formattedReview, null, 2));
      return formattedReview;
    } catch (err) {
      console.error(`[ReviewService] Error updating review: ${err.message}`);
      console.error(`[ReviewService] Error stack:`, err.stack);
      throw new Error(`Database error while updating review: ${err.message}`);
    }
  }

  static async deleteReview(reviewId, userId) {
    try {
      console.log(`[ReviewService] Deleting review with ID: ${reviewId}`);
      console.log(`[ReviewService] User ID: ${userId}`);

      const db = getDB();

      // Check if review exists and user owns it
      const existingResult = await db.query(
        'SELECT * FROM reviews WHERE id = $1',
        [reviewId]
      );

      if (existingResult.rows.length === 0) {
        console.log(`[ReviewService] Review not found with ID: ${reviewId}`);
        throw new Error('Review not found');
      }

      const existingReview = existingResult.rows[0];
      console.log(`[ReviewService] Found review:`, JSON.stringify(existingReview, null, 2));

      if (existingReview.reviewer_id !== userId) {
        console.log(`[ReviewService] Permission denied. Review owner: ${existingReview.reviewer_id}, Current user: ${userId}`);
        throw new Error('You can only delete your own reviews');
      }

      // Delete the review
      await db.query('DELETE FROM reviews WHERE id = $1', [reviewId]);

      console.log(`[ReviewService] Review deleted successfully`);
      return true;
    } catch (err) {
      console.error(`[ReviewService] Error deleting review: ${err.message}`);
      console.error(`[ReviewService] Error stack:`, err.stack);
      throw new Error(`Database error while deleting review: ${err.message}`);
    }
  }
}

module.exports = ReviewService;