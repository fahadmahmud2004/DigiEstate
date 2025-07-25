const { randomUUID } = require('crypto');
const { getDB } = require('../config/database.js');

/**
 * A helper function to consistently format booking data from the database
 * into the nested object structure the frontend expects.
 * @param {object} row - A raw row object from a database query result.
 * @returns {object} A formatted booking object.
 */
const _formatBooking = (row) => {
  if (!row) return null;

  const buyerName = row.buyer_name || (row.buyer_email ? row.buyer_email.split('@')[0] : 'N/A');
  const sellerName = row.seller_name || (row.seller_email ? row.seller_email.split('@')[0] : 'N/A');

  return {
    id: row.id,
    status: row.status,
    message: row.message,
    preferredDate: row.preferred_date,
    preferredTime: row.preferred_time,
    declineReason: row.decline_reason,
    referenceNumber: row.reference_number,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    property: {
      id: row.property_id,
      title: row.property_title,
      location: row.property_location,
      price: parseFloat(row.property_price),
      images: row.property_images || [],
    },
    buyer: {
      id: row.buyer_id,
      name: buyerName,
      email: row.buyer_email,
      avatar: row.buyer_avatar,
    },
    seller: {
      id: row.seller_id,
      name: sellerName,
      email: row.seller_email,
      avatar: row.seller_avatar,
    },
  };
};


class BookingService {
  static async create(bookingData, buyerId) {
    try {
      console.log(`[BookingService] Attempting to create booking for user ${buyerId}`);
      const db = getDB();

      const propertyQuery = 'SELECT owner_id FROM properties WHERE id = $1';
      const propertyResult = await db.query(propertyQuery, [bookingData.propertyId]);
      
      if (propertyResult.rows.length === 0) throw new Error('Property not found.');
      const sellerId = propertyResult.rows[0].owner_id;

      const referenceNumber = `REF-${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const insertQuery = `
        INSERT INTO bookings (
          id, property_id, buyer_id, seller_id, preferred_date,
          preferred_time, message, reference_number, status, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending', NOW(), NOW())
        RETURNING id;
      `;
      const newBookingId = randomUUID();
      const values = [
        newBookingId, bookingData.propertyId, buyerId, sellerId,
        bookingData.preferredDate, bookingData.preferredTime,
        bookingData.message || '', referenceNumber,
      ];
      
      const result = await db.query(insertQuery, values);
      const createdBookingId = result.rows[0].id;

      console.log(`[BookingService] Successfully created booking with ID: ${createdBookingId}`);
      return this.get(createdBookingId);

    } catch (err) {
      console.error('[BookingService] Error in create:', err);
      throw new Error('Failed to create booking due to a database error.');
    }
  }

  static async get(bookingId) {
    try {
      const db = getDB();
      const query = `
        SELECT
          b.*,
          p.id AS property_id, p.title AS property_title, p.location AS property_location, p.price AS property_price, p.images AS property_images,
          buyer.id AS buyer_id, buyer.name AS buyer_name, buyer.email AS buyer_email, buyer.avatar AS buyer_avatar,
          seller.id AS seller_id, seller.name AS seller_name, seller.email AS seller_email, seller.avatar AS seller_avatar
        FROM bookings AS b
        JOIN properties AS p ON b.property_id = p.id
        JOIN users AS buyer ON b.buyer_id = buyer.id
        JOIN users AS seller ON b.seller_id = seller.id
        WHERE b.id = $1;
      `;
      const result = await db.query(query, [bookingId]);
      return _formatBooking(result.rows[0]);
    } catch (err) {
      console.error(`[BookingService] Error in get for ID ${bookingId}:`, err);
      throw new Error('Failed to retrieve booking details.');
    }
  }

  static async getByUserId(userId) {
    try {
      const db = getDB();
      const query = `
        SELECT
          b.*,
          p.id AS property_id, p.title AS property_title, p.location AS property_location, p.price AS property_price, p.images AS property_images,
          buyer.id AS buyer_id, buyer.name AS buyer_name, buyer.email AS buyer_email, buyer.avatar AS buyer_avatar,
          seller.id AS seller_id, seller.name AS seller_name, seller.email AS seller_email, seller.avatar AS seller_avatar
        FROM bookings AS b
        JOIN properties AS p ON b.property_id = p.id
        JOIN users AS buyer ON b.buyer_id = buyer.id
        JOIN users AS seller ON b.seller_id = seller.id
        WHERE b.buyer_id = $1 OR b.seller_id = $1
        ORDER BY b.created_at DESC;
      `;
      const result = await db.query(query, [userId]);
      return result.rows.map(_formatBooking);
    } catch (err) {
      console.error(`[BookingService] Error in getByUserId for user ${userId}:`, err);
      throw new Error("Failed to retrieve user's bookings.");
    }
  }

  /**
   * Updates the status of a booking (e.g., 'Accepted', 'Declined').
   * Only the property owner (seller) can perform this action.
   * @param {string} bookingId - The ID of the booking to update.
   * @param {'Accepted' | 'Declined'} status - The new status.
   * @param {string} userId - The ID of the user performing the action (must be the seller).
   * @param {string} [declineReason] - An optional reason if the booking is declined.
   * @returns {Promise<object>} The updated and formatted booking object.
   */
  static async updateStatus(bookingId, status, userId, declineReason = null) {
    try {
      const db = getDB();
      
      // Authorization: Check if the user is the seller of this booking.
      const authQuery = 'SELECT seller_id FROM bookings WHERE id = $1';
      const authResult = await db.query(authQuery, [bookingId]);
      if (authResult.rows.length === 0) throw new Error('Booking not found.');
      if (authResult.rows[0].seller_id !== userId) throw new Error('User not authorized to update this booking.');

      const updateQuery = `
        UPDATE bookings
        SET 
          status = $1,
          decline_reason = CASE WHEN $1 = 'Declined' THEN $2 ELSE decline_reason END,
          updated_at = NOW()
        WHERE id = $3
        RETURNING id;
      `;
      await db.query(updateQuery, [status, declineReason, bookingId]);

      console.log(`[BookingService] Updated status for booking ${bookingId} to ${status}`);
      return this.get(bookingId);

    } catch (err) {
      console.error(`[BookingService] Error updating status for booking ${bookingId}:`, err);
      throw new Error('Failed to update booking status.');
    }
  }

  /**
   * Cancels a booking. Only the user who made the booking (buyer) can cancel it.
   * @param {string} bookingId - The ID of the booking to cancel.
   * @param {string} userId - The ID of the user performing the action (must be the buyer).
   * @returns {Promise<object>} The updated (cancelled) and formatted booking object.
   */
  static async cancel(bookingId, userId) {
    try {
      const db = getDB();

      // Authorization: Check if the user is the buyer of this booking.
      const authQuery = 'SELECT buyer_id, status FROM bookings WHERE id = $1';
      const authResult = await db.query(authQuery, [bookingId]);
      if (authResult.rows.length === 0) throw new Error('Booking not found.');
      if (authResult.rows[0].buyer_id !== userId) throw new Error('Only the buyer can cancel this booking.');
      if (['Completed', 'Cancelled'].includes(authResult.rows[0].status)) {
        throw new Error('This booking cannot be cancelled as it is already completed or cancelled.');
      }

      const updateQuery = `
        UPDATE bookings SET status = 'Cancelled', updated_at = NOW() WHERE id = $1 RETURNING id;
      `;
      await db.query(updateQuery, [bookingId]);
      
      console.log(`[BookingService] Cancelled booking ${bookingId} by user ${userId}`);
      return this.get(bookingId);

    } catch (err) {
      console.error(`[BookingService] Error cancelling booking ${bookingId}:`, err);
      throw new Error('Failed to cancel booking.');
    }
  }

  /**
   * Deletes a booking. Only the buyer can delete their own bookings.
   * @param {string} bookingId - The ID of the booking to delete.
   * @param {string} userId - The ID of the user performing the action (must be the buyer).
   * @returns {Promise<{success: boolean}>} A success object.
   */
  static async delete(bookingId, userId) {
    try {
      const db = getDB();

      // The DELETE query includes the user ID check for an atomic and secure operation.
      const deleteQuery = 'DELETE FROM bookings WHERE id = $1 AND buyer_id = $2';
      const result = await db.query(deleteQuery, [bookingId, userId]);

      // If rowCount is 0, it means either the booking didn't exist or the user wasn't the owner.
      if (result.rowCount === 0) {
        throw new Error('Booking not found or user not authorized to delete.');
      }

      console.log(`[BookingService] Deleted booking ${bookingId} by user ${userId}`);
      return { success: true };

    } catch (err) {
      console.error(`[BookingService] Error deleting booking ${bookingId}:`, err);
      throw new Error('Failed to delete booking.');
    }
  }
}

module.exports = BookingService;
