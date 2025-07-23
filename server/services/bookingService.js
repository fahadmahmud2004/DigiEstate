const { randomUUID } = require('crypto');
const { getDB } = require('../config/database.js');
const UserService = require('./userService.js');

class BookingService {
  static async create(bookingData, userId) {
    try {
      console.log(`[BookingService] Creating booking for user ${userId} and property ${bookingData.propertyId}`);
      const db = getDB();

      // Get property details from properties table
      const propertyQuery = `
        SELECT * FROM properties WHERE id = $1
      `;
      const propertyResult = await db.query(propertyQuery, [bookingData.propertyId]);
      const property = propertyResult.rows[0];
      if (!property) {
        throw new Error('Property not found');
      }

      // Get buyer details
      const buyer = await UserService.get(userId);
      if (!buyer) {
        throw new Error('Buyer not found');
      }

      // Get seller details (owner is owner_id in properties)
      const seller = await UserService.get(property.owner_id);
      if (!seller) {
        throw new Error('Property owner not found');
      }

      // Generate reference number
      const referenceNumber = 'REF' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();

      // Insert booking into bookings table
      const insertQuery = `
        INSERT INTO bookings (id, user_id, property_id, status, booking_date, message, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), $5, NOW(), NOW())
        RETURNING *
      `;
      const bookingId = randomUUID();
      const bookingResult = await db.query(insertQuery, [
        bookingId,
        userId,
        bookingData.propertyId,
        'Pending',
        bookingData.message || ''
      ]);
      const newBooking = bookingResult.rows[0];

      // Construct full booking object with details for return
      return {
        _id: newBooking.id,
        property: {
          _id: property.id,
          title: property.title,
          location: property.location,
          price: parseFloat(property.price),
          images: typeof property.images === 'string' ? JSON.parse(property.images) : (property.images || [])
        },
        buyer: {
          _id: buyer.id,
          name: buyer.name || buyer.email.split('@')[0],
          email: buyer.email,
          phone: buyer.phone || ''
        },
        seller: {
          _id: seller.id,
          name: seller.name || seller.email.split('@')[0],
          email: seller.email,
          phone: seller.phone || ''
        },
        propertyId: bookingData.propertyId,
        buyerId: userId,
        sellerId: property.owner_id,
        preferredDate: bookingData.preferredDate || null,
        preferredTime: bookingData.preferredTime || null,
        message: bookingData.message || null,
        status: newBooking.status,
        referenceNumber,
        createdAt: newBooking.created_at,
        updatedAt: newBooking.updated_at,
      };
    } catch (err) {
      console.error(`[BookingService] Error creating booking: ${err.message}`);
      throw new Error(`Database error while creating booking: ${err.message}`);
    }
  }

  static async getByUserId(userId) {
    try {
      console.log(`[BookingService] Fetching bookings for user ${userId}`);
      const db = getDB();

      const query = `
        SELECT b.*, p.title, p.location, p.price, p.images,
               u_seller.id as seller_id, u_seller.name as seller_name, u_seller.email as seller_email, u_seller.phone as seller_phone, u_seller.avatar as seller_avatar
        FROM bookings b
        JOIN properties p ON b.property_id = p.id
        JOIN users u_seller ON p.owner_id = u_seller.id
        WHERE b.user_id = $1
        ORDER BY b.created_at DESC
      `;
      const result = await db.query(query, [userId]);
      
      return result.rows.map(row => ({
        _id: row.id,
        property: {
          _id: row.property_id,
          title: row.title,
          location: row.location,
          price: parseFloat(row.price),
          images: typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || [])
        },
        buyer: {
          _id: userId,
          name: '', // Will be filled by the calling function
          email: '',
          phone: ''
        },
        seller: {
          _id: row.seller_id,
          name: row.seller_name || row.seller_email.split('@')[0],
          email: row.seller_email,
          phone: row.seller_phone || '',
          avatar: row.seller_avatar
        },
        preferredDate: row.booking_date,
        preferredTime: '',
        message: row.message || '',
        status: row.status,
        referenceNumber: `REF${row.id.substring(0, 8).toUpperCase()}`,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (err) {
      console.error(`[BookingService] Error fetching user bookings: ${err.message}`);
      throw new Error(`Database error while fetching user bookings: ${err.message}`);
    }
  }

  static async get(id) {
    try {
      console.log(`[BookingService] Fetching booking with ID: ${id}`);
      const db = getDB();

      const query = `
        SELECT b.*, p.title, p.location, p.price, p.images,
               u_buyer.name as buyer_name, u_buyer.email as buyer_email, u_buyer.phone as buyer_phone,
               u_seller.id as seller_id, u_seller.name as seller_name, u_seller.email as seller_email, u_seller.phone as seller_phone
        FROM bookings b
        JOIN properties p ON b.property_id = p.id
        JOIN users u_buyer ON b.user_id = u_buyer.id
        JOIN users u_seller ON p.owner_id = u_seller.id
        WHERE b.id = $1
      `;
      const result = await db.query(query, [id]);
      const row = result.rows[0];
      if (!row) {
        return null;
      }

      return {
        _id: row.id,
        property: {
          _id: row.property_id,
          title: row.title,
          location: row.location,
          price: parseFloat(row.price),
          images: typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || [])
        },
        buyer: {
          _id: row.user_id,
          name: row.buyer_name || row.buyer_email.split('@')[0],
          email: row.buyer_email,
          phone: row.buyer_phone || ''
        },
        seller: {
          _id: row.seller_id,
          name: row.seller_name || row.seller_email.split('@')[0],
          email: row.seller_email,
          phone: row.seller_phone || ''
        },
        status: row.status,
        message: row.message,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (err) {
      console.error(`[BookingService] Error fetching booking: ${err.message}`);
      throw new Error(`Database error while fetching booking: ${err.message}`);
    }
  }

  static async updateStatus(id, status, declineReason, userId) {
    try {
      console.log(`[BookingService] Updating booking ${id} status to ${status} by user ${userId}`);
      const db = getDB();

      // Check if user authorized (buyer or seller)
      const checkAuthQuery = `
        SELECT b.id, p.owner_id AS seller_id
        FROM bookings b
        JOIN properties p ON b.property_id = p.id
        WHERE b.id = $1 AND (b.user_id = $2 OR p.owner_id = $2)
      `;
      const authResult = await db.query(checkAuthQuery, [id, userId]);
      if (authResult.rowCount === 0) {
        throw new Error('Not authorized to update this booking');
      }

      // Update status
      const updateQuery = `
        UPDATE bookings
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
      const updateResult = await db.query(updateQuery, [status, id]);

      return updateResult.rows[0];
    } catch (err) {
      console.error(`[BookingService] Error updating booking status: ${err.message}`);
      throw new Error(`Database error while updating booking status: ${err.message}`);
    }
  }

  static async cancel(id, userId) {
    try {
      console.log(`[BookingService] Cancelling booking ${id} by user ${userId}`);
      const db = getDB();

      // Check if booking exists and belongs to user
      const bookingQuery = `
        SELECT status, user_id
        FROM bookings
        WHERE id = $1
      `;
      const bookingResult = await db.query(bookingQuery, [id]);
      const booking = bookingResult.rows[0];
      if (!booking) {
        throw new Error('Booking not found');
      }
      if (booking.user_id !== userId) {
        throw new Error('Only the buyer can cancel this booking');
      }
      if (booking.status === 'Completed' || booking.status === 'Cancelled') {
        throw new Error('Cannot cancel a completed or already cancelled booking');
      }

      // Update status to Cancelled
      const updateQuery = `
        UPDATE bookings
        SET status = 'Cancelled', updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      const updateResult = await db.query(updateQuery, [id]);

      return updateResult.rows[0];
    } catch (err) {
      console.error(`[BookingService] Error cancelling booking: ${err.message}`);
      throw new Error(`Database error while cancelling booking: ${err.message}`);
    }
  }

  static async delete(id, userId) {
    try {
      console.log(`[BookingService] Deleting booking ${id} by user ${userId}`);
      const db = getDB();

      // Check ownership
      const checkQuery = `
        SELECT user_id FROM bookings WHERE id = $1
      `;
      const checkResult = await db.query(checkQuery, [id]);
      if (checkResult.rowCount === 0) {
        throw new Error('Booking not found');
      }
      if (checkResult.rows[0].user_id !== userId) {
        throw new Error('Only the buyer can delete this booking');
      }

      // Delete booking
      const deleteQuery = `
        DELETE FROM bookings WHERE id = $1
      `;
      await db.query(deleteQuery, [id]);

      return true;
    } catch (err) {
      console.error(`[BookingService] Error deleting booking: ${err.message}`);
      throw new Error(`Database error while deleting booking: ${err.message}`);
    }
  }
}

module.exports = BookingService;